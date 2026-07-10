import { z } from 'zod';

export const reportSchema = z.object({
  date: z.coerce.date({ errorMap: () => ({ message: 'تاریخ گزارش معتبر نیست' }) }),
  title: z.string().trim().min(2, 'عنوان الزامی است').max(200),
  content: z.string().trim().min(5, 'متن گزارش الزامی است').max(5000),
});

export const seenSchema = z.object({
  managerNote: z.string().trim().max(1000).default(''),
});
