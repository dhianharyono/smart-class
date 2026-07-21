import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJournalHeader extends Document {
  teacherId: string;
  schoolName: string;
  subject: string;
  classNameSemester: string;
  academicYear: string;
  curriculum: string;
  teacherName: string;
  nip: string;
  createdAt: Date;
  updatedAt: Date;
}

const JournalHeaderSchema = new Schema<IJournalHeader>(
  {
    teacherId: { type: String, required: true, unique: true, index: true },
    schoolName: { type: String, default: '' },
    subject: { type: String, default: '' },
    classNameSemester: { type: String, default: '' },
    academicYear: { type: String, default: '' },
    curriculum: { type: String, default: '2013' },
    teacherName: { type: String, default: '' },
    nip: { type: String, default: '-' },
  },
  {
    timestamps: true,
  }
);

const JournalHeader: Model<IJournalHeader> =
  mongoose.models.JournalHeader ||
  mongoose.model<IJournalHeader>('JournalHeader', JournalHeaderSchema);

export default JournalHeader;
