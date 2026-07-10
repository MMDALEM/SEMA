import { ROLES, SENIOR_ROLES, User } from '../models/User.js';
import { generateUniqueCode } from '../utils/codes.js';
import { logAction } from '../services/audit.service.js';
import { HttpError, asyncHandler } from '../middleware/errors.js';

async function newUniqueCode() {
  // در صورت برخورد (بسیار نادر) دوباره تلاش می‌کنیم
  for (let i = 0; i < 5; i += 1) {
    const code = generateUniqueCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ uniqueCode: code });
    if (!exists) return code;
  }
  throw new HttpError(500, 'خطا در تولید کد یکتا');
}

/** فهرست کاربران (فقط مدیریت) */
export const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 20);
  const q = String(req.query.q || '').trim();
  const role = String(req.query.role || '').trim();

  const filter = {};
  if (role && ROLES.includes(role)) filter.role = role;
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ firstName: rx }, { lastName: rx }, { phone: rx }, { uniqueCode: rx }, { position: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('manager', 'firstName lastName')
      .populate('seniorManager', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ items, total, page, pages: Math.ceil(total / limit) });
});

/** فهرست مدیران میانی برای انتخاب در فرم‌ها */
export const listManagers = asyncHandler(async (_req, res) => {
  const items = await User.find({ role: 'MANAGER', isActive: true }).select(
    'firstName lastName position'
  );
  res.json({ items });
});

/** فهرست مدیران اصلی (مدیر سایت / مدیر کل) برای انتخاب در فرم‌ها */
export const listSeniorManagers = asyncHandler(async (_req, res) => {
  const items = await User.find({ role: { $in: SENIOR_ROLES }, isActive: true }).select(
    'firstName lastName position role'
  );
  res.json({ items });
});

/** ایجاد کاربر جدید — فقط از پنل مدیریت */
export const createUser = asyncHandler(async (req, res) => {
  const uniqueCode = await newUniqueCode();
  const user = await User.create({
    ...req.body,
    manager: req.body.manager || null,
    seniorManager: req.body.seniorManager || null,
    uniqueCode,
    createdBy: req.user._id,
  });

  await logAction(req, 'user.create', {
    message: `کاربر «${user.firstName} ${user.lastName}» ایجاد شد`,
    entity: 'User',
    entityId: user._id,
    meta: { role: user.role, position: user.position },
  });

  res.status(201).json({ user: user.toJSON(), message: 'کاربر با موفقیت ایجاد شد' });
});

/** ویرایش کاربر */
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'کاربر یافت نشد');

  Object.assign(user, req.body, {
    manager: req.body.manager ?? user.manager,
    seniorManager: req.body.seniorManager ?? user.seniorManager,
  });
  if (req.body.manager === null || req.body.manager === '') user.manager = null;
  if (req.body.seniorManager === null || req.body.seniorManager === '') user.seniorManager = null;
  await user.save();

  await logAction(req, 'user.update', {
    message: `اطلاعات کاربر «${user.firstName} ${user.lastName}» ویرایش شد`,
    entity: 'User',
    entityId: user._id,
    meta: { changes: Object.keys(req.body) },
  });

  res.json({ user: user.toJSON(), message: 'تغییرات ذخیره شد' });
});

/** فعال/غیرفعال کردن حساب */
export const setUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'کاربر یافت نشد');
  if (String(user._id) === String(req.user._id)) {
    throw new HttpError(400, 'امکان غیرفعال کردن حساب خودتان وجود ندارد');
  }

  user.isActive = req.body.isActive;
  // با غیرفعال شدن، همه نشست‌های کاربر باطل می‌شود
  if (!user.isActive) user.tokenVersion += 1;
  await user.save();

  await logAction(req, user.isActive ? 'user.activate' : 'user.deactivate', {
    message: `حساب «${user.firstName} ${user.lastName}» ${user.isActive ? 'فعال' : 'غیرفعال'} شد`,
    entity: 'User',
    entityId: user._id,
  });

  res.json({ user: user.toJSON(), message: 'وضعیت حساب به‌روزرسانی شد' });
});

/** تولید مجدد کد یکتا (مثلا در صورت لو رفتن) */
export const regenerateCode = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new HttpError(404, 'کاربر یافت نشد');

  user.uniqueCode = await newUniqueCode();
  user.tokenVersion += 1;
  await user.save();

  await logAction(req, 'user.regenerate-code', {
    message: `کد یکتای «${user.firstName} ${user.lastName}» بازتولید شد`,
    entity: 'User',
    entityId: user._id,
  });

  res.json({ user: user.toJSON(), message: 'کد یکتای جدید صادر شد' });
});
