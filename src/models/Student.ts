import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudent extends Document {
  nis: string;
  name: string;
  className: string;
  gender: 'L' | 'P';
  teacherId: string;
  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  nis: { type: String, required: true, index: true },
  name: { type: String, required: true },
  className: { type: String, required: true },
  gender: { type: String, enum: ['L', 'P'], required: true },
  teacherId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound index so a teacher cannot have duplicate NIS for different students, but different teachers can have the same NIS.
StudentSchema.index({ teacherId: 1, nis: 1 }, { unique: true });

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
