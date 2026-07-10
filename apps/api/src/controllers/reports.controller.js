import { WorkReport } from '../models/WorkReport.js';
import { logAction } from '../services/audit.service.js';
import { HttpError, asyncHandler } from '../middleware/errors.js';

/** ثبت گزارش‌کار توسط کارمند برای مدیر میانی خودش */
export const createReport = asyncHandler(async (req, res) => {
  if (!req.user.manager) {
    throw new HttpError(400, 'برای شما مدیر میانی تعریف نشده است؛ با مدیریت تماس بگیرید');
  }

  const report = await WorkReport.create({
    ...req.body,
    employee: req.user._id,
    manager: req.user.manager,
  });

  await logAction(req, 'report.create', {
    message: `گزارش‌کار «${report.title}» ثبت شد`,
    entity: 'WorkReport',
    entityId: report._id,
  });

  res.status(201).json({ item: report, message: 'گزارش‌کار ثبت شد' });
});

/** گزارش‌های خود کارمند */
export const myReports = asyncHandler(async (req, res) => {
  const items = await WorkReport.find({ employee: req.user._id })
    .sort({ date: -1 })
    .limit(100);
  res.json({ items });
});

/** کارتابل مدیر میانی: گزارش‌کار اعضای تیم */
export const teamReports = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);

  const filter = req.user.role === 'ADMIN' ? {} : { manager: req.user._id };
  const status = String(req.query.status || '').trim();
  if (status === 'SUBMITTED' || status === 'SEEN') filter.status = status;

  const [items, total] = await Promise.all([
    WorkReport.find(filter)
      .populate('employee', 'firstName lastName position')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    WorkReport.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

/** ثبت بازخورد/مشاهده گزارش توسط مدیر میانی */
export const markSeen = asyncHandler(async (req, res) => {
  const report = await WorkReport.findById(req.params.id);
  if (!report) throw new HttpError(404, 'گزارش یافت نشد');
  if (req.user.role !== 'ADMIN' && String(report.manager) !== String(req.user._id)) {
    throw new HttpError(403, 'این گزارش مربوط به تیم شما نیست');
  }

  report.status = 'SEEN';
  report.managerNote = req.body.managerNote;
  report.seenAt = new Date();
  await report.save();

  await logAction(req, 'report.seen', {
    message: `گزارش‌کار «${report.title}» بررسی شد`,
    entity: 'WorkReport',
    entityId: report._id,
  });

  res.json({ item: report, message: 'بازخورد ثبت شد' });
});
