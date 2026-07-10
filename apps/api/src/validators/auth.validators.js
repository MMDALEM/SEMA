import { z } from 'zod';

export const codeSchema = z.object({
  uniqueCode: z
    .string({ required_error: 'کد یکتا الزامی است' })
    .trim()
    .min(4, 'کد یکتا نامعتبر است')
    .max(40, 'کد یکتا نامعتبر است')
    .transform((v) => v.toUpperCase()),
});

export const verifySchema = codeSchema.extend({
  otp: z
    .string({ required_error: 'کد یک‌بارمصرف الزامی است' })
    .trim()
    .regex(/^\d{6}$/, 'کد یک‌بارمصرف باید ۶ رقم باشد'),
});
