import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeacher extends Document {
  username?: string;
  email: string;
  password: string;
  name: string;
  schoolName?: string;
  className?: string;
  nip?: string;
  role: 'Wali Kelas' | 'Kepala Sekolah';
  kkm: number;
  isFirstLogin?: boolean;
  enabledMenus?: string[];
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  lastActiveAt?: Date;
  createdAt: Date;
}

const DEFAULT_MENUS = [
  '/',
  '/siswa',
  '/absensi',
  '/nilai',
  '/tabungan',
  '/jurnal',
];

const TeacherSchema = new Schema<ITeacher>({
  username: { type: String, sparse: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  schoolName: { type: String },
  className: { type: String },
  nip: { type: String, default: '-' },
  role: { type: String, enum: ['Wali Kelas', 'Kepala Sekolah'], default: 'Wali Kelas' },
  kkm: { type: Number, default: 70, min: 0, max: 100 },
  isFirstLogin: { type: Boolean, default: true },
  enabledMenus: { type: [String], default: DEFAULT_MENUS },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const Teacher: Model<ITeacher> = mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);

export default Teacher;
