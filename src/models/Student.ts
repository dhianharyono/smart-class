import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudent extends Document {
  nis: string;
  name: string;
  className: string;
  gender: 'L' | 'P';
  teacherId: string;

  // Identity & Photo
  nisn?: string;
  photo?: string;

  // Personal Biodata
  birthPlace?: string;
  birthDate?: Date;
  religion?: string;
  address?: string;

  // Parents / Guardian
  fatherName?: string;
  fatherJob?: string;
  motherName?: string;
  motherJob?: string;
  guardianName?: string;
  guardianJob?: string;

  // Entry History & Status
  entryDate?: Date;
  entryClass?: string;
  entryAcademicYear?: string;
  previousSchool?: string;
  status?: 'Aktif' | 'Mutasi' | 'Lulus' | 'Non-Aktif';

  createdAt: Date;
}

const StudentSchema = new Schema<IStudent>({
  nis: { type: String, required: true, index: true },
  name: { type: String, required: true },
  className: { type: String, required: true },
  gender: { type: String, enum: ['L', 'P'], required: true },
  teacherId: { type: String, required: true, index: true },

  // Identity & Photo
  nisn: { type: String },
  photo: { type: String },

  // Personal Biodata
  birthPlace: { type: String },
  birthDate: { type: Date },
  religion: { type: String },
  address: { type: String },

  // Parents / Guardian
  fatherName: { type: String },
  fatherJob: { type: String },
  motherName: { type: String },
  motherJob: { type: String },
  guardianName: { type: String },
  guardianJob: { type: String },

  // Entry History & Status
  entryDate: { type: Date },
  entryClass: { type: String },
  entryAcademicYear: { type: String },
  previousSchool: { type: String },
  status: {
    type: String,
    enum: ['Aktif', 'Mutasi', 'Lulus', 'Non-Aktif'],
    default: 'Aktif',
  },

  createdAt: { type: Date, default: Date.now },
});

// Compound index so a teacher cannot have duplicate NIS for different students, but different teachers can have the same NIS.
StudentSchema.index({ teacherId: 1, nis: 1 }, { unique: true });

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
