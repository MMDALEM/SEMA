import { z } from 'zod';

export const createRequestSchema = z.object({
  typeId: z.string().trim().length(24, 'نوع درخواست نامعتبر است'),
  payload: z.record(z.any()).default({}),
});

export const decideRequestSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], { errorMap: () => ({ message: 'وضعیت نامعتبر است' }) }),
  note: z.string().trim().max(1000).default(''),
});

export const seniorDecideSchema = z.object({
  approved: z.boolean(),
  note: z.string().trim().max(1000).default(''),
});
