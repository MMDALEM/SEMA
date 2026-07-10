import { z } from 'zod';
import { ROLES } from '../models/User.js';

const phoneRegex = /^09\d{9}$/;

export const createUserSchema = z.object({
  firstName: z.string().trim().min(2, 'نام الزامی است').max(80),
  lastName: z.string().trim().min(2, 'نام خانوادگی الزامی است').max(80),
  phone: z.string().trim().regex(phoneRegex, 'شماره تلفن معتبر نیست (مثال: 09121234567)'),
  email: z.string().trim().email('ایمیل معتبر نیست').or(z.literal('')).default(''),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد')
    .or(z.literal(''))
    .default(''),
  role: z.enum(ROLES, { errorMap: () => ({ message: 'نقش نامعتبر است' }) }),
  position: z.string().trim().min(2, 'سمت شغلی الزامی است').max(120),
  department: z.string().trim().max(120).default(''),
  manager: z.string().trim().length(24, 'شناسه مدیر نامعتبر است').nullable().optional(),
  seniorManager: z.string().trim().length(24, 'شناسه مدیر اصلی نامعتبر است').nullable().optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const statusSchema = z.object({ isActive: z.boolean() });
