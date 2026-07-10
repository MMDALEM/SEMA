import { AuditLog } from '../models/AuditLog.js';
import { asyncHandler } from '../middleware/errors.js';

/**
 * مشاهده لاگ همه اتفاقات سیستم — فقط بخش مدیریت
 */
export const listLogs = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Number(req.query.limit) || 30);

  const filter = {};
  const action = String(req.query.action || '').trim();
  const status = String(req.query.status || '').trim();
  if (action) filter.action = new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (status === 'SUCCESS' || status === 'FAIL') filter.status = status;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(String(req.query.from));
    if (req.query.to) filter.createdAt.$lte = new Date(String(req.query.to));
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    AuditLog.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});
