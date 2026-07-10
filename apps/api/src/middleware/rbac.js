import { HttpError } from './errors.js';

/**
 * کنترل سطح دسترسی بر اساس نقش.
 * نقش ADMIN به همه بخش‌ها دسترسی دارد.
 */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, 'ابتدا وارد شوید'));
    if (req.user.role === 'ADMIN' || roles.includes(req.user.role)) return next();
    return next(new HttpError(403, 'شما به این بخش دسترسی ندارید'));
  };
}
