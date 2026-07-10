import mongoose from 'mongoose';

// PENDING_SENIOR: در انتظار تایید مدیر اصلی (برای انواعی مثل وام و خرید)
// PENDING: در انتظار تصمیم بخش مربوطه (مالی / منابع انسانی)
export const REQUEST_STATUSES = ['PENDING_SENIOR', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELED'];

const historySchema = new mongoose.Schema(
  {
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    byName: { type: String, default: '' },
    action: { type: String, required: true },
    note: { type: String, default: '' },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema(
  {
    type: { type: mongoose.Schema.Types.ObjectId, ref: 'RequestType', required: true },
    typeName: { type: String, required: true },
    scope: { type: String, enum: ['FINANCE', 'HR'], required: true, index: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // مدیر اصلی کارمند در زمان ثبت (برای کارتابل تایید مدیر اصلی)
    seniorManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: REQUEST_STATUSES, default: 'PENDING', index: true },
    seniorDecision: {
      type: new mongoose.Schema(
        {
          by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          byName: { type: String, default: '' },
          approved: { type: Boolean },
          note: { type: String, default: '' },
          at: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
      default: null,
    },
    decisionNote: { type: String, default: '' },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

export const Request = mongoose.model('Request', requestSchema);
