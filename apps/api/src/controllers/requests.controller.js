import { Request } from '../models/Request.js';
import { RequestType } from '../models/RequestType.js';
import { logAction } from '../services/audit.service.js';
import { HttpError, asyncHandler } from '../middleware/errors.js';

const SCOPE_ROLE = { FINANCE: 'FINANCE', HR: 'HR' };

/** اعتبارسنجی payload بر اساس فیلدهای تعریف‌شده‌ی نوع درخواست */
function validatePayload(fields, payload = {}) {
  const clean = {};
  for (const f of fields) {
    const value = payload[f.key];
    const empty = value === undefined || value === null || value === '';
    if (empty) {
      if (f.required) throw new HttpError(400, `فیلد «${f.label}» الزامی است`);
      continue;
    }
    switch (f.type) {
      case 'number': {
        const n = Number(value);
        if (Number.isNaN(n)) throw new HttpError(400, `فیلد «${f.label}» باید عدد باشد`);
        clean[f.key] = n;
        break;
      }
      case 'date': {
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) throw new HttpError(400, `فیلد «${f.label}» تاریخ معتبر نیست`);
        clean[f.key] = d.toISOString();
        break;
      }
      case 'select': {
        if (!f.options.includes(String(value))) {
          throw new HttpError(400, `مقدار فیلد «${f.label}» از گزینه‌های مجاز نیست`);
        }
        clean[f.key] = String(value);
        break;
      }
      default:
        clean[f.key] = String(value).slice(0, 2000);
    }
  }
  return clean;
}

/** ثبت درخواست جدید توسط کارمند */
export const createRequest = asyncHandler(async (req, res) => {
  const type = await RequestType.findById(req.body.typeId);
  if (!type || !type.isActive) throw new HttpError(404, 'نوع درخواست یافت نشد یا غیرفعال است');

  const payload = validatePayload(type.fields, req.body.payload);
  // انواعی مثل وام و خرید ابتدا باید به تایید مدیر اصلی برسند
  const needsSenior = type.needsSeniorApproval && Boolean(req.user.seniorManager);
  const request = await Request.create({
    type: type._id,
    typeName: type.name,
    scope: type.scope,
    employee: req.user._id,
    seniorManager: req.user.seniorManager || null,
    status: needsSenior ? 'PENDING_SENIOR' : 'PENDING',
    payload,
    history: [
      {
        by: req.user._id,
        byName: `${req.user.firstName} ${req.user.lastName}`,
        action: 'SUBMITTED',
      },
    ],
  });

  await logAction(req, 'request.create', {
    message: `درخواست «${type.name}» ثبت شد`,
    entity: 'Request',
    entityId: request._id,
  });

  res.status(201).json({ item: request, message: 'درخواست شما ثبت شد' });
});

/** درخواست‌های خود کارمند */
export const myRequests = asyncHandler(async (req, res) => {
  const scope = String(req.query.scope || '').trim();
  const filter = { employee: req.user._id };
  if (scope === 'FINANCE' || scope === 'HR') filter.scope = scope;
  const items = await Request.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json({ items });
});

/** لغو درخواست توسط خود کارمند (تا قبل از تصمیم‌گیری) */
export const cancelRequest = asyncHandler(async (req, res) => {
  const request = await Request.findOne({ _id: req.params.id, employee: req.user._id });
  if (!request) throw new HttpError(404, 'درخواست یافت نشد');
  if (!['PENDING', 'PENDING_SENIOR'].includes(request.status)) {
    throw new HttpError(400, 'فقط درخواست‌های در انتظار قابل لغو هستند');
  }

  request.status = 'CANCELED';
  request.history.push({
    by: req.user._id,
    byName: `${req.user.firstName} ${req.user.lastName}`,
    action: 'CANCELED',
  });
  await request.save();

  await logAction(req, 'request.cancel', {
    message: `درخواست «${request.typeName}» لغو شد`,
    entity: 'Request',
    entityId: request._id,
  });

  res.json({ item: request, message: 'درخواست لغو شد' });
});

/** کارتابل بخش مالی / منابع انسانی */
export const inbox = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = {};
  const scope = String(req.query.scope || '').trim();
  if (req.user.role === 'ADMIN') {
    if (scope === 'FINANCE' || scope === 'HR') filter.scope = scope;
  } else {
    // هر بخش فقط درخواست‌های حوزه خودش را می‌بیند
    filter.scope = req.user.role;
  }
  const status = String(req.query.status || '').trim();
  if (['PENDING_SENIOR', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELED'].includes(status)) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    Request.find(filter)
      .populate('employee', 'firstName lastName position department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Request.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

/** کارتابل مدیر اصلی: درخواست‌های نیازمند تایید او (وام، خرید و...) */
export const seniorInbox = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = {};
  if (req.user.role === 'SITE_MANAGER') {
    // مدیر سایت فقط کارمندان مجموعه خودش
    filter.seniorManager = req.user._id;
  } else {
    // مدیر کل و مدیریت: همه درخواست‌های دارای مرحله تایید مدیر اصلی
    filter.seniorManager = { $ne: null };
  }
  const status = String(req.query.status || '').trim();
  if (['PENDING_SENIOR', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELED'].includes(status)) {
    filter.status = status;
  }

  const [items, total] = await Promise.all([
    Request.find(filter)
      .populate('employee', 'firstName lastName position department')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Request.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

/** تصمیم مدیر اصلی — در صورت تایید، درخواست به بخش مربوطه (مالی/منابع انسانی) می‌رود */
export const seniorDecideRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) throw new HttpError(404, 'درخواست یافت نشد');

  const isOwner = String(request.seniorManager) === String(req.user._id);
  const isSuper = req.user.role === 'ADMIN' || req.user.role === 'GENERAL_MANAGER';
  if (!isOwner && !isSuper) {
    throw new HttpError(403, 'این درخواست مربوط به مجموعه شما نیست');
  }
  if (request.status !== 'PENDING_SENIOR') {
    throw new HttpError(400, 'این درخواست در مرحله تایید مدیر اصلی نیست');
  }

  request.seniorDecision = {
    by: req.user._id,
    byName: `${req.user.firstName} ${req.user.lastName}`,
    approved: req.body.approved,
    note: req.body.note,
    at: new Date(),
  };
  request.status = req.body.approved ? 'PENDING' : 'REJECTED';
  request.history.push({
    by: req.user._id,
    byName: `${req.user.firstName} ${req.user.lastName}`,
    action: req.body.approved ? 'SENIOR_APPROVED' : 'SENIOR_REJECTED',
    note: req.body.note,
  });
  await request.save();

  await logAction(req, 'request.senior-decision', {
    message: `درخواست «${request.typeName}» توسط مدیر اصلی ${req.body.approved ? 'تایید' : 'رد'} شد`,
    entity: 'Request',
    entityId: request._id,
  });

  res.json({ item: request, message: 'تصمیم ثبت شد' });
});

/** تایید یا رد درخواست توسط بخش مربوطه */
export const decideRequest = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  if (!request) throw new HttpError(404, 'درخواست یافت نشد');
  if (req.user.role !== 'ADMIN' && req.user.role !== SCOPE_ROLE[request.scope]) {
    throw new HttpError(403, 'این درخواست مربوط به حوزه شما نیست');
  }
  if (request.status !== 'PENDING') {
    throw new HttpError(400, 'برای این درخواست قبلا تصمیم‌گیری شده است');
  }

  request.status = req.body.status;
  request.decisionNote = req.body.note;
  request.decidedBy = req.user._id;
  request.decidedAt = new Date();
  request.history.push({
    by: req.user._id,
    byName: `${req.user.firstName} ${req.user.lastName}`,
    action: req.body.status,
    note: req.body.note,
  });
  await request.save();

  await logAction(req, 'request.decide', {
    message: `درخواست «${request.typeName}» ${req.body.status === 'APPROVED' ? 'تایید' : 'رد'} شد`,
    entity: 'Request',
    entityId: request._id,
    meta: { status: req.body.status },
  });

  res.json({ item: request, message: 'تصمیم ثبت شد' });
});
