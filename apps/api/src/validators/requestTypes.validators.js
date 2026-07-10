import { z } from 'zod';
import { TYPE_SCOPES } from '../models/RequestType.js';

const fieldSchema = z.object({
  key: z
    .string()
    .trim()
    .regex(/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/, 'کلید فیلد باید با حرف انگلیسی شروع شود'),
  label: z.string().trim().min(1, 'عنوان فیلد الزامی است').max(100),
  type: z.enum(['text', 'textarea', 'number', 'date', 'select']).default('text'),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1)).max(30).default([]),
});

export const typeSchema = z.object({
  name: z.string().trim().min(2, 'نام الزامی است').max(120),
  description: z.string().trim().max(500).default(''),
  scope: z.enum(TYPE_SCOPES, { errorMap: () => ({ message: 'دسته نامعتبر است' }) }),
  fields: z.array(fieldSchema).max(20).default([]),
  needsSeniorApproval: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const typeUpdateSchema = typeSchema.partial();
