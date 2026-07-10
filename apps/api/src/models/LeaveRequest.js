import mongoose from 'mongoose';

// گردش کار مرخصی: کارمند → مدیر میانی → مدیر اصلی (سایت/کل) → منابع انسانی
// تایید مدیریتِ خود کارمند و منابع انسانی هر دو الزامی است
export const LEAVE_STATUSES = [
  'PENDING_MANAGER',
  'PENDING_SENIOR',
  'PENDING_HR',
  'APPROVED',
  'REJECTED',
  'CANCELED',
];

export const LEAVE_PENDING_STATUSES = ['PENDING_MANAGER', 'PENDING_SENIOR', 'PENDING_HR'];

export const LEAVE_TYPES = ['DAILY', 'HOURLY', 'SICK'];

export const LEAVE_TYPE_LABELS = {
  DAILY: 'روزانه',
  HOURLY: 'ساعتی',
  SICK: 'استعلاجی',
};

const decisionSchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, default: '' },
    approved: { type: Boolean },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const leaveSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // برای فیلتر سریع کارتابل مدیر میانی
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    // مدیر اصلی (سایت/کل) کارمند در زمان ثبت
    seniorManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    leaveType: { type: String, enum: LEAVE_TYPES, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    reason: { type: String, trim: true, default: '', maxlength: 1000 },
    status: { type: String, enum: LEAVE_STATUSES, default: 'PENDING_MANAGER', index: true },
    managerDecision: { type: decisionSchema, default: null },
    seniorDecision: { type: decisionSchema, default: null },
    hrDecision: { type: decisionSchema, default: null },
  },
  { timestamps: true }
);

export const LeaveRequest = mongoose.model('LeaveRequest', leaveSchema);
