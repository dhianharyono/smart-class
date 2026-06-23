import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeacher extends Document {
  email: string;
  password: string;
  name: string;
  schoolName?: string;
  className?: string;
  role: 'Wali Kelas' | 'Kepala Sekolah';
  lastActiveAt?: Date;
  createdAt: Date;
}

const TeacherSchema = new Schema<ITeacher>({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  schoolName: { type: String },
  className: { type: String },
  role: { type: String, enum: ['Wali Kelas', 'Kepala Sekolah'], default: 'Wali Kelas' },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const Teacher: Model<ITeacher> = mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);

export default Teacher;
