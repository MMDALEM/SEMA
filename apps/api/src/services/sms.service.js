import { env } from '../config/env.js';

/**
 * ارسال کد یک‌بارمصرف.
 * provider ها:
 *  - console: چاپ کد در ترمینال (مناسب توسعه)
 *  - kavenegar: ارسال با سرویس کاوه‌نگار (verify lookup)
 * برای اتصال هر سرویس دیگر (SMS.ir، ملی‌پیامک و ...) کافیست یک case جدید اضافه کنید.
 */
export async function sendOtpSms(phone, code) {
  switch (env.sms.provider) {
    case 'kavenegar': {
      const url = `https://api.kavenegar.com/v1/${env.sms.kavenegarApiKey}/verify/lookup.json`;
      const params = new URLSearchParams({
        receptor: phone,
        token: code,
        template: env.sms.kavenegarTemplate,
      });
      const res = await fetch(`${url}?${params.toString()}`);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`خطا در ارسال پیامک (kavenegar): ${res.status} ${body}`);
      }
      return;
    }
    case 'console':
    default:
      console.log(`📱 [SMS→${phone}] کد ورود سما: ${code}`);
  }
}
