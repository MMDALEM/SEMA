import { User } from '../models/User.js';
import { Otp } from '../models/Otp.js';
import { generateOtp, hashOtp, maskPhone, safeEqual } from '../utils/codes.js';
import { sendOtpSms } from '../services/sms.service.js';
import { logAction } from '../services/audit.service.js';
import {
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
  verifyRefreshToken,
} from '../services/token.service.js';
import { HttpError, asyncHandler } from '../middleware/errors.js';

const OTP_TTL_MS = 5 * 60 * 1000; // ۵ دقیقه
const OTP_MAX_ATTEMPTS = 5;

/**
 * مرحله ۱: کاربر کد یکتای خود را وارد می‌کند و کد یک‌بارمصرف پیامک می‌شود.
 */
export const requestOtp = asyncHandler(async (req, res) => {
  const { uniqueCode } = req.body;
  const user = await User.findOne({ uniqueCode });

  if (!user || !user.isActive) {
    await logAction(req, 'auth.otp.request', {
      status: 'FAIL',
      message: `تلاش ورود با کد نامعتبر: ${uniqueCode}`,
    });
    throw new HttpError(404, 'کد یکتا معتبر نیست یا حساب غیرفعال است');
  }

  // کدهای قبلی مصرف‌نشده باطل می‌شوند
  await Otp.deleteMany({ user: user._id, consumedAt: null });

  const code = generateOtp();
  await Otp.create({
    user: user._id,
    codeHash: hashOtp(code, user._id),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    ip: req.ip || '',
  });

  await sendOtpSms(user.phone, code);
  await logAction(req, 'auth.otp.request', {
    actor: user,
    message: 'کد یک‌بارمصرف ارسال شد',
    entity: 'User',
    entityId: user._id,
  });

  res.json({
    message: `کد یک‌بارمصرف به شماره ${maskPhone(user.phone)} ارسال شد`,
    phoneMasked: maskPhone(user.phone),
    ttlSeconds: OTP_TTL_MS / 1000,
  });
});

/**
 * مرحله ۲: تایید کد یک‌بارمصرف و صدور JWT در کوکی HttpOnly.
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { uniqueCode, otp } = req.body;
  const user = await User.findOne({ uniqueCode });
  if (!user || !user.isActive) throw new HttpError(401, 'اطلاعات ورود نامعتبر است');

  const record = await Otp.findOne({ user: user._id, consumedAt: null }).sort({ createdAt: -1 });
  if (!record || record.expiresAt < new Date()) {
    throw new HttpError(401, 'کد منقضی شده است، دوباره درخواست دهید');
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw new HttpError(429, 'تعداد تلاش‌ها بیش از حد مجاز است، کد جدید درخواست دهید');
  }

  if (!safeEqual(record.codeHash, hashOtp(otp, user._id))) {
    record.attempts += 1;
    await record.save();
    await logAction(req, 'auth.login', {
      actor: user,
      status: 'FAIL',
      message: 'کد یک‌بارمصرف اشتباه وارد شد',
    });
    throw new HttpError(401, 'کد یک‌بارمصرف اشتباه است');
  }

  record.consumedAt = new Date();
  await record.save();

  user.lastLoginAt = new Date();
  await user.save();

  setAuthCookies(res, user);
  await logAction(req, 'auth.login', {
    actor: user,
    message: 'ورود موفق به سیستم',
    entity: 'User',
    entityId: user._id,
  });

  res.json({ message: 'ورود موفق', user: user.toJSON() });
});

/**
 * تمدید نشست با refresh token (چرخش توکن).
 */
export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw new HttpError(401, 'نشست یافت نشد');

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearAuthCookies(res);
    throw new HttpError(401, 'نشست منقضی شده است');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive || user.tokenVersion !== payload.tv) {
    clearAuthCookies(res);
    throw new HttpError(401, 'نشست معتبر نیست');
  }

  setAuthCookies(res, user);
  res.json({ message: 'نشست تمدید شد', user: user.toJSON() });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  await logAction(req, 'auth.logout', { message: 'خروج از سیستم' });
  res.json({ message: 'خروج انجام شد' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await req.user.populate('manager', 'firstName lastName position');
  res.json({ user: user.toJSON() });
});
