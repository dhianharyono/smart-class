'use server';

import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Saving from '@/models/Saving';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from '@/lib/utils';

import Teacher from '@/models/Teacher';

async function requireAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    redirect('/sign-in');
  }
  const session = await verifySession(sessionToken);
  if (!session || !session.userId) {
    redirect('/sign-in');
  }
  return session.userId;
}


export async function getSavingsSummary() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const teacher = await Teacher.findById(teacherId).lean();
    const activeClass = teacher?.activeClass || teacher?.className || '';

    // Fetch students for active class
    const studentFilter: any = { teacherId };
    if (activeClass) {
      studentFilter.$or = [{ className: activeClass }, { className: { $exists: false } }, { className: '' }];
    }

    const students = await Student.find(studentFilter).sort({ name: 1 }).lean();

    // Fetch all savings transactions for this teacher
    const transactions = await Saving.find({ teacherId }).lean();

    // Compute balance for each student
    const studentBalances = new Map<string, { balance: number; transactionsCount: number }>();
    
    // Initialize map
    for (const student of students) {
      studentBalances.set(student._id.toString(), { balance: 0, transactionsCount: 0 });
    }

    // Accumulate balances
    for (const tx of transactions) {
      const sId = tx.studentId.toString();
      if (studentBalances.has(sId)) {
        const current = studentBalances.get(sId)!;
        const change = tx.type === 'Kredit' ? tx.amount : -tx.amount;
        studentBalances.set(sId, {
          balance: current.balance + change,
          transactionsCount: current.transactionsCount + 1,
        });
      }
    }

    const result = students.map((student) => {
      const stats = studentBalances.get(student._id.toString()) || { balance: 0, transactionsCount: 0 };
      return {
        studentId: student._id.toString(),
        name: student.name,
        nis: student.nis,
        className: student.className,
        balance: stats.balance,
        transactionsCount: stats.transactionsCount,
      };
    });

    return JSON.parse(JSON.stringify(result));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching savings summary:', error);
    throw new Error(error.message || 'Failed to fetch savings summary.');
  }
}

export async function getStudentLedger(studentId: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    // Verify ownership of student
    const student = await Student.findOne({ _id: studentId, teacherId }).lean();
    if (!student) {
      throw new Error('Siswa tidak ditemukan atau Anda tidak memiliki akses.');
    }

    const ledger = await Saving.find({ studentId, teacherId })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify({
      studentName: student.name,
      studentNis: student.nis,
      ledger,
    }));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching student ledger:', error);
    throw new Error(error.message || 'Failed to fetch student ledger.');
  }
}

export async function addTransaction(data: {
  studentId: string;
  type: 'Kredit' | 'Debit';
  amount: number;
  description?: string;
}) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    // Verify student ownership
    const student = await Student.findOne({ _id: data.studentId, teacherId }).lean();
    if (!student) {
      throw new Error('Siswa tidak ditemukan atau Anda tidak memiliki akses.');
    }

    if (data.amount <= 0) {
      throw new Error('Nominal transaksi harus lebih dari 0.');
    }

    // Check withdrawal balance if it's Debit (outflow)
    if (data.type === 'Debit') {
      const studentTxList = await Saving.find({ studentId: data.studentId, teacherId }).lean();
      const currentBalance = studentTxList.reduce((acc, tx) => {
        return acc + (tx.type === 'Kredit' ? tx.amount : -tx.amount);
      }, 0);

      if (currentBalance < data.amount) {
        throw new Error(`Saldo tabungan tidak mencukupi. Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`);
      }
    }

    const newTx = new Saving({
      ...data,
      teacherId,
      date: new Date(),
    });

    await newTx.save();

    revalidatePath('/tabungan');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error adding savings transaction:', error);
    throw new Error(error.message || 'Failed to save transaction.');
  }
}
