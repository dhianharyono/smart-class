import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: string;
  date: Date;
  status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
  createdAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  teacherId: { type: String, required: true, index: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Hadir', 'Sakit', 'Izin', 'Alfa'], required: true },
  createdAt: { type: Date, default: Date.now },
});

// A student can only have one attendance log per day
AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
