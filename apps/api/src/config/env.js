import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (isProd && (!process.env[name] || String(process.env[name]).startsWith('change-me'))) {
    throw new Error(`متغیر محیطی ${name} در حالت production باید مقدار امن داشته باشد`);
  }
  return value;
}

export const env = {
  isProd,
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/sema',
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  otpSecret: required('OTP_SECRET', 'dev-otp-secret'),
  accessTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTtl: process.env.REFRESH_TOKEN_TTL || '7d',
  cookieSecure: process.env.COOKIE_SECURE === 'true' || isProd,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  sms: {
    provider: process.env.SMS_PROVIDER || 'console',
    kavenegarApiKey: process.env.KAVENEGAR_API_KEY || '',
    kavenegarTemplate: process.env.KAVENEGAR_TEMPLATE || 'sema-otp',
  },
};
