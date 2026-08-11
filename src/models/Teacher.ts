import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITeacher extends Document {
  username?: string;
  email: string;
  password: string;
  name: string;
  schoolName?: string;
  className?: string;
  classes?: string[];
  activeClass?: string;
  nip?: string;
  principalName?: string;
  principalNip?: string;
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
  '/kelas',
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
  classes: { type: [String], default: [] },
  activeClass: { type: String },
  nip: { type: String, default: '-' },
  principalName: { type: String, default: '' },
  principalNip: { type: String, default: '-' },
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

if (mongoose.models.Teacher && (!mongoose.models.Teacher.schema.path('classes') || !mongoose.models.Teacher.schema.path('activeClass') || !mongoose.models.Teacher.schema.path('principalName'))) {
  delete (mongoose.models as any).Teacher;
}

const Teacher: Model<ITeacher> = mongoose.models.Teacher || mongoose.model<ITeacher>('Teacher', TeacherSchema);

export default Teacher;
