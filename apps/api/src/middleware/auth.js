import { User } from '../models/User.js';
import { ACCESS_COOKIE, verifyAccessToken } from '../services/token.service.js';
import { HttpError, asyncHandler } from './errors.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[ACCESS_COOKIE];
  if (!token) throw new HttpError(401, 'ابتدا وارد شوید');

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw new HttpError(401, 'نشست شما منقضی شده است');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new HttpError(401, 'حساب کاربری معتبر نیست');

  req.user = user;
  next();
});
