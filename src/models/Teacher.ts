import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeacher extends Document {
  email: string;
  password: string;
  name: string;
  schoolName?: string;
  className?: string;
  createdAt: Date;
}

const TeacherSchema = new Schema<ITeacher>({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  schoolName: { type: String },
  className: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Teacher: Model<ITeacher> = mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);

export default Teacher;
