import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISaving extends Document {
  studentId: mongoose.Types.ObjectId;
  teacherId: string;
  type: 'Kredit' | 'Debit'; // Kredit = Inflow (Deposit/Kas Masuk), Debit = Outflow (Withdrawal/Kas Keluar)
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
}

const SavingSchema = new Schema<ISaving>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
  teacherId: { type: String, required: true, index: true },
  type: { type: String, enum: ['Kredit', 'Debit'], required: true },
  amount: { type: Number, required: true, min: [0, 'Amount must be positive'] },
  description: { type: String },
  date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const Saving: Model<ISaving> = mongoose.models.Saving || mongoose.model<ISaving>('Saving', SavingSchema);

export default Saving;
