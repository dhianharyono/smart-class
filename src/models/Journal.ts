import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJournal extends Document {
  teacherId: string;
  className?: string;
  date: Date;
  meetingNo: number;
  subject?: string;
  basicCompetency: string;
  material: string;
  learningActivity: string;
  absentS: number;
  absentI: number;
  absentA: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JournalSchema = new Schema<IJournal>(
  {
    teacherId: { type: String, required: true, index: true },
    className: { type: String, index: true },
    date: { type: Date, required: true, index: true },
    meetingNo: { type: Number, required: true },
    subject: { type: String },
    basicCompetency: { type: String, required: true },
    material: { type: String, required: true },
    learningActivity: { type: String, required: true },
    absentS: { type: Number, default: 0, min: 0 },
    absentI: { type: Number, default: 0, min: 0 },
    absentA: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.Journal && !mongoose.models.Journal.schema.path('className')) {
  delete (mongoose.models as any).Journal;
}

const Journal: Model<IJournal> =
  mongoose.models.Journal || mongoose.model<IJournal>('Journal', JournalSchema);

export default Journal;
