import { RequestType, TYPE_SCOPES } from '../models/RequestType.js';
import { logAction } from '../services/audit.service.js';
import { HttpError, asyncHandler } from '../middleware/errors.js';

// بخش مالی انواع درخواست مالی را تعریف می‌کند و منابع انسانی قابلیت‌ها را
const SCOPE_ROLE = { FINANCE: 'FINANCE', HR: 'HR' };

function canManageScope(user, scope) {
  return user.role === 'ADMIN' || user.role === SCOPE_ROLE[scope];
}

/**
 * فهرست انواع. کارمندان فقط موارد فعال را می‌بینند؛
 * مالی/منابع انسانی/مدیریت همه موارد حوزه خود را می‌بینند.
 */
export const listTypes = asyncHandler(async (req, res) => {
  const scope = String(req.query.scope || '').trim();
  const filter = {};
  if (scope && TYPE_SCOPES.includes(scope)) filter.scope = scope;

  const manageAll = req.user.role === 'ADMIN' || (scope && canManageScope(req.user, scope));
  if (!manageAll) filter.isActive = true;

  const items = await RequestType.find(filter).sort({ createdAt: -1 });
  res.json({ items });
});

/** تعریف نوع جدید (مثل وام، مساعده، رزرو غذا، جلسه با مدیران) */
export const createType = asyncHandler(async (req, res) => {
  if (!canManageScope(req.user, req.body.scope)) {
    throw new HttpError(403, 'شما مجاز به تعریف در این حوزه نیستید');
  }

  const type = await RequestType.create({ ...req.body, createdBy: req.user._id });
  await logAction(req, 'request-type.create', {
    message: `نوع «${type.name}» (${type.scope === 'FINANCE' ? 'مالی' : 'منابع انسانی'}) تعریف شد`,
    entity: 'RequestType',
    entityId: type._id,
  });

  res.status(201).json({ item: type, message: 'با موفقیت تعریف شد' });
});

export const updateType = asyncHandler(async (req, res) => {
  const type = await RequestType.findById(req.params.id);
  if (!type) throw new HttpError(404, 'مورد یافت نشد');
  if (!canManageScope(req.user, type.scope)) {
    throw new HttpError(403, 'شما مجاز به ویرایش این مورد نیستید');
  }
  // جابه‌جایی حوزه مجاز نیست
  delete req.body.scope;

  Object.assign(type, req.body);
  await type.save();

  await logAction(req, 'request-type.update', {
    message: `نوع «${type.name}» ویرایش شد`,
    entity: 'RequestType',
    entityId: type._id,
  });

  res.json({ item: type, message: 'تغییرات ذخیره شد' });
});

export const deactivateType = asyncHandler(async (req, res) => {
  const type = await RequestType.findById(req.params.id);
  if (!type) throw new HttpError(404, 'مورد یافت نشد');
  if (!canManageScope(req.user, type.scope)) {
    throw new HttpError(403, 'شما مجاز به حذف این مورد نیستید');
  }

  // حذف نرم: غیرفعال می‌شود تا سوابق درخواست‌ها حفظ بماند
  type.isActive = false;
  await type.save();

  await logAction(req, 'request-type.deactivate', {
    message: `نوع «${type.name}» غیرفعال شد`,
    entity: 'RequestType',
    entityId: type._id,
  });

  res.json({ message: 'غیرفعال شد' });
});
