import mongoose from 'mongoose';

export const ROLES = [
  'ADMIN',
  'FINANCE',
  'HR',
  'MANAGER',
  'SITE_MANAGER',
  'GENERAL_MANAGER',
  'EMPLOYEE',
];

// نقش‌هایی که می‌توانند «مدیر اصلی» یک کارمند باشند
export const SENIOR_ROLES = ['SITE_MANAGER', 'GENERAL_MANAGER'];

export const ROLE_LABELS = {
  ADMIN: 'مدیریت',
  FINANCE: 'مالی',
  HR: 'منابع انسانی',
  MANAGER: 'مدیر میانی',
  SITE_MANAGER: 'مدیر سایت',
  GENERAL_MANAGER: 'مدیر کل',
  EMPLOYEE: 'کارمند',
};

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    nationalId: { type: String, trim: true, default: '' },
    role: { type: String, enum: ROLES, required: true, default: 'EMPLOYEE' },
    // سمت شغلی — برای هر فرد الزامی است
    position: { type: String, required: true, trim: true, maxlength: 120 },
    department: { type: String, trim: true, default: '' },
    // مدیر میانیِ مستقیم این کارمند
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // مدیر اصلی (مدیر سایت یا مدیر کل) — تاییدکننده مرخصی، خرید و وام
    seniorManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // کد یکتای ورود
    uniqueCode: { type: String, required: true, unique: true, index: true },
    isActive: { type: Boolean, default: true },
    // با افزایش این عدد، همه‌ی refresh token های قبلی کاربر باطل می‌شوند
    tokenVersion: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.model('User', userSchema);
