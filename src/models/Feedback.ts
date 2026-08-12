import mongoose, { Schema, Document, Model } from 'mongoose';

export type FeedbackCategory = 'Kritik' | 'Saran' | 'Laporan Bug' | 'Pertanyaan' | 'Lainnya';
export type FeedbackStatus = 'Pending' | 'Diproses' | 'Selesai';

export interface IFeedback extends Document {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  schoolName?: string;
  className?: string;
  category: FeedbackCategory;
  subject: string;
  content: string;
  rating?: number;
  status: FeedbackStatus;
  adminResponse?: string;
  respondedAt?: Date;
  respondedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    teacherId: { type: String, required: true, index: true },
    teacherName: { type: String, required: true },
    teacherEmail: { type: String, required: true },
    schoolName: { type: String, default: '' },
    className: { type: String, default: '' },
    category: {
      type: String,
      enum: ['Kritik', 'Saran', 'Laporan Bug', 'Pertanyaan', 'Lainnya'],
      default: 'Saran',
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    status: {
      type: String,
      enum: ['Pending', 'Diproses', 'Selesai'],
      default: 'Pending',
      index: true,
    },
    adminResponse: { type: String, default: '' },
    respondedAt: { type: Date },
    respondedBy: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

const Feedback: Model<IFeedback> =
  mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
