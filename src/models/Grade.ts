import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGrade extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: string;
  subject: string;
  category: 'Tugas' | 'UH' | 'UTS' | 'UAS';
  score: number;
  date: Date;
  createdAt: Date;
}

const GradeSchema = new Schema<IGrade>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  teacherId: { type: String, required: true, index: true },
  subject: { type: String, required: true, index: true },
  category: { type: String, enum: ['Tugas', 'UH', 'UTS', 'UAS'], required: true },
  score: {
    type: Number,
    required: true,
    min: [0, 'Score must be at least 0'],
    max: [100, 'Score cannot exceed 100'],
  },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const Grade: Model<IGrade> = mongoose.models.Grade || mongoose.model<IGrade>('Grade', GradeSchema);

export default Grade;
