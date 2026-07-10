import { z } from 'zod';
import { LEAVE_TYPES } from '../models/LeaveRequest.js';

export const leaveSchema = z
  .object({
    leaveType: z.enum(LEAVE_TYPES, { errorMap: () => ({ message: 'نوع مرخصی نامعتبر است' }) }),
    startDate: z.coerce.date({ errorMap: () => ({ message: 'تاریخ شروع معتبر نیست' }) }),
    endDate: z.coerce.date({ errorMap: () => ({ message: 'تاریخ پایان معتبر نیست' }) }),
    startTime: z.string().trim().max(5).default(''),
    endTime: z.string().trim().max(5).default(''),
    reason: z.string().trim().max(1000).default(''),
  })
  .refine((d) => d.endDate >= d.startDate, { message: 'تاریخ پایان نباید قبل از شروع باشد' });

export const leaveDecideSchema = z.object({
  approved: z.boolean(),
  note: z.string().trim().max(1000).default(''),
});
