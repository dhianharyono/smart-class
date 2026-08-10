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
  supervisorName?: string;
  supervisorNip?: string;
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
    supervisorName: { type: String, default: '' },
    supervisorNip: { type: String, default: '-' },
  },
  {
    timestamps: true,
  }
);

if (mongoose.models.JournalHeader && !mongoose.models.JournalHeader.schema.path('supervisorName')) {
  delete (mongoose.models as any).JournalHeader;
}

const JournalHeader: Model<IJournalHeader> =
  mongoose.models.JournalHeader ||
  mongoose.model<IJournalHeader>('JournalHeader', JournalHeaderSchema);

export default JournalHeader;
