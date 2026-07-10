import mongoose from 'mongoose';

const workReportSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ['SUBMITTED', 'SEEN'], default: 'SUBMITTED', index: true },
    managerNote: { type: String, trim: true, default: '', maxlength: 1000 },
    seenAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const WorkReport = mongoose.model('WorkReport', workReportSchema);
