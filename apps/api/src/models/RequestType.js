import mongoose from 'mongoose';

// FINANCE: انواع درخواست مالی (وام، مساعده، ...) — تعریف توسط بخش مالی
// HR: قابلیت‌ها/خدمات (رزرو غذا، جلسه با مدیران، ...) — تعریف توسط منابع انسانی
export const TYPE_SCOPES = ['FINANCE', 'HR'];

const fieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: ['text', 'textarea', 'number', 'date', 'select'], default: 'text' },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const requestTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    scope: { type: String, enum: TYPE_SCOPES, required: true, index: true },
    fields: { type: [fieldSchema], default: [] },
    // اگر فعال باشد، درخواست ابتدا باید به تایید مدیر اصلی (سایت/کل) کارمند برسد
    // مناسب انواعی مثل درخواست وام و درخواست خرید
    needsSeniorApproval: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const RequestType = mongoose.model('RequestType', requestTypeSchema);
