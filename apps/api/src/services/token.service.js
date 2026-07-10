import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const ACCESS_COOKIE = 'sema_at';
export const REFRESH_COOKIE = 'sema_rt';
// کوکی نشانگر نشست (بدون داده حساس) — برای تشخیص ورود در middleware فرانت‌اند
export const SESSION_COOKIE = 'sema_session';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, name: `${user.firstName} ${user.lastName}` },
    env.jwtAccessSecret,
    { expiresIn: env.accessTtl }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: String(user._id), tv: user.tokenVersion },
    env.jwtRefreshSecret,
    { expiresIn: env.refreshTtl }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

const baseCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.cookieSecure,
};

export function setAuthCookies(res, user) {
  res.cookie(ACCESS_COOKIE, signAccessToken(user), {
    ...baseCookie,
    path: '/',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie(REFRESH_COOKIE, signRefreshToken(user), {
    ...baseCookie,
    // فقط برای مسیرهای auth ارسال می‌شود
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie(SESSION_COOKIE, '1', {
    ...baseCookie,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE, { ...baseCookie, path: '/' });
  res.clearCookie(REFRESH_COOKIE, { ...baseCookie, path: '/api/auth' });
  res.clearCookie(SESSION_COOKIE, { ...baseCookie, path: '/' });
}
