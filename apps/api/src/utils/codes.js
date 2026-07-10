import crypto from 'node:crypto';
import { env } from '../config/env.js';

// حروف/ارقامی که با هم اشتباه گرفته نمی‌شوند (بدون O,0,I,1,...)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateUniqueCode() {
  const bytes = crypto.randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  return `SEMA-${out.slice(0, 4)}-${out.slice(4)}`;
}

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000)); // ۶ رقمی
}

export function hashOtp(code, userId) {
  return crypto
    .createHmac('sha256', env.otpSecret)
    .update(`${userId}:${code}`)
    .digest('hex');
}

export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function maskPhone(phone) {
  const p = String(phone);
  if (p.length < 7) return '****';
  return `${p.slice(0, 4)}***${p.slice(-3)}`;
}
