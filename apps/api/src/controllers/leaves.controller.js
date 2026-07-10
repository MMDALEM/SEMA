import { LEAVE_PENDING_STATUSES, LeaveRequest } from '../models/LeaveRequest.js';
import { logAction } from '../services/audit.service.js';
import { HttpError, asyncHandler } from '../middleware/errors.js';

/**
 * گردش کار مرخصی (چند تایید):
 *   مدیر میانی → مدیر اصلی (سایت/کل) → منابع انسانی
 * تایید مدیریتِ خود کارمند و منابع انسانی الزامی است؛
 * مراحلی که برای کارمند تعریف نشده‌اند رد می‌شوند.
 */
function initialStatus(user) {
  if (user.manager) return 'PENDING_MANAGER';
  if (user.seniorManager) return 'PENDING_SENIOR';
  return 'PENDING_HR';
}

function decisionOf(user, approved, note) {
  return {
    by: user._id,
    byName: `${user.firstName} ${user.lastName}`,
    approved,
    note,
    at: new Date(),
  };
}

/** ثبت درخواست مرخصی توسط کارمند */
export const createLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.create({
    ...req.body,
    employee: req.user._id,
    manager: req.user.manager || null,
    seniorManager: req.user.seniorManager || null,
    status: initialStatus(req.user),
  });

  await logAction(req, 'leave.create', {
    message: 'درخواست مرخصی ثبت شد',
    entity: 'LeaveRequest',
    entityId: leave._id,
  });

  res.status(201).json({ item: leave, message: 'درخواست مرخصی ثبت شد' });
});

/** مرخصی‌های خود کارمند */
export const myLeaves = asyncHandler(async (req, res) => {
  const items = await LeaveRequest.find({ employee: req.user._id })
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ items });
});

/** ویرایش مرخصی توسط کارمند — تا قبل از تصمیم نهایی؛ گردش کار از ابتدا شروع می‌شود */
export const updateLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, employee: req.user._id });
  if (!leave) throw new HttpError(404, 'درخواست یافت نشد');
  if (!LEAVE_PENDING_STATUSES.includes(leave.status)) {
    throw new HttpError(400, 'این درخواست دیگر قابل ویرایش نیست');
  }

  Object.assign(leave, req.body);
  leave.status = initialStatus(req.user);
  leave.manager = req.user.manager || null;
  leave.seniorManager = req.user.seniorManager || null;
  leave.managerDecision = null;
  leave.seniorDecision = null;
  leave.hrDecision = null;
  await leave.save();

  await logAction(req, 'leave.update', {
    message: 'درخواست مرخصی ویرایش شد',
    entity: 'LeaveRequest',
    entityId: leave._id,
  });

  res.json({ item: leave, message: 'تغییرات ذخیره شد و درخواست دوباره در گردش کار قرار گرفت' });
});

/** لغو مرخصی توسط کارمند */
export const cancelLeave = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findOne({ _id: req.params.id, employee: req.user._id });
  if (!leave) throw new HttpError(404, 'درخواست یافت نشد');
  if (!LEAVE_PENDING_STATUSES.includes(leave.status)) {
    throw new HttpError(400, 'این درخواست دیگر قابل لغو نیست');
  }

  leave.status = 'CANCELED';
  await leave.save();

  await logAction(req, 'leave.cancel', {
    message: 'درخواست مرخصی لغو شد',
    entity: 'LeaveRequest',
    entityId: leave._id,
  });

  res.json({ item: leave, message: 'درخواست لغو شد' });
});

/** کارتابل مرخصی — بسته به نقش: مدیر میانی / مدیر اصلی / منابع انسانی / مدیریت */
export const leavesInbox = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = {};
  if (req.user.role === 'MANAGER') {
    // مدیر میانی فقط مرخصی تیم خودش را می‌بیند
    filter.manager = req.user._id;
  } else if (req.user.role === 'SITE_MANAGER') {
    // مدیر سایت فقط کارمندانی که مدیر اصلی‌شان است
    filter.seniorManager = req.user._id;
  }
  // مدیر کل، منابع انسانی و مدیریت همه را می‌بینند
  const status = String(req.query.status || '').trim();
  if (status) filter.status = status;

  const [items, total] = await Promise.all([
    LeaveRequest.find(filter)
      .populate('employee', 'firstName lastName position department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    LeaveRequest.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

/** تصمیم مدیر میانی — در صورت تایید به مرحله بعد می‌رود */
export const managerDecision = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new HttpError(404, 'درخواست یافت نشد');
  if (req.user.role !== 'ADMIN' && String(leave.manager) !== String(req.user._id)) {
    throw new HttpError(403, 'این درخواست مربوط به تیم شما نیست');
  }
  if (leave.status !== 'PENDING_MANAGER') {
    throw new HttpError(400, 'این درخواست در مرحله تصمیم مدیر میانی نیست');
  }

  leave.managerDecision = decisionOf(req.user, req.body.approved, req.body.note);
  leave.status = req.body.approved
    ? leave.seniorManager
      ? 'PENDING_SENIOR'
      : 'PENDING_HR'
    : 'REJECTED';
  await leave.save();

  await logAction(req, 'leave.manager-decision', {
    message: `مرخصی توسط مدیر میانی ${req.body.approved ? 'تایید' : 'رد'} شد`,
    entity: 'LeaveRequest',
    entityId: leave._id,
  });

  res.json({ item: leave, message: 'تصمیم ثبت شد' });
});

/** تصمیم مدیر اصلی (مدیر سایت / مدیر کل) — در صورت تایید به منابع انسانی می‌رود */
export const seniorDecision = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new HttpError(404, 'درخواست یافت نشد');

  // مدیر سایت فقط برای کارمندان خودش؛ مدیر کل و مدیریت برای همه
  const isOwner = String(leave.seniorManager) === String(req.user._id);
  const isSuper = req.user.role === 'ADMIN' || req.user.role === 'GENERAL_MANAGER';
  if (!isOwner && !isSuper) {
    throw new HttpError(403, 'این درخواست مربوط به مجموعه شما نیست');
  }
  if (leave.status !== 'PENDING_SENIOR') {
    throw new HttpError(400, 'این درخواست در مرحله تصمیم مدیر اصلی نیست');
  }

  leave.seniorDecision = decisionOf(req.user, req.body.approved, req.body.note);
  leave.status = req.body.approved ? 'PENDING_HR' : 'REJECTED';
  await leave.save();

  await logAction(req, 'leave.senior-decision', {
    message: `مرخصی توسط مدیر اصلی ${req.body.approved ? 'تایید' : 'رد'} شد`,
    entity: 'LeaveRequest',
    entityId: leave._id,
  });

  res.json({ item: leave, message: 'تصمیم ثبت شد' });
});

/** تصمیم نهایی منابع انسانی */
export const hrDecision = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) throw new HttpError(404, 'درخواست یافت نشد');
  if (leave.status !== 'PENDING_HR') {
    throw new HttpError(400, 'این درخواست در مرحله تصمیم منابع انسانی نیست');
  }

  leave.hrDecision = decisionOf(req.user, req.body.approved, req.body.note);
  leave.status = req.body.approved ? 'APPROVED' : 'REJECTED';
  await leave.save();

  await logAction(req, 'leave.hr-decision', {
    message: `مرخصی توسط منابع انسانی ${req.body.approved ? 'تایید نهایی' : 'رد'} شد`,
    entity: 'LeaveRequest',
    entityId: leave._id,
  });

  res.json({ item: leave, message: 'تصمیم نهایی ثبت شد' });
});
