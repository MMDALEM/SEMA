import rateLimit from 'express-rate-limit';

const message = { message: 'تعداد درخواست‌ها بیش از حد مجاز است، کمی بعد دوباره تلاش کنید' };

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

// درخواست کد یک‌بارمصرف: سختگیرانه برای جلوگیری از spam و enumeration
export const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message,
});
