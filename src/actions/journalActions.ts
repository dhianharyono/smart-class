'use server';

import dbConnect from '@/lib/db';
import Journal from '@/models/Journal';
import JournalHeader from '@/models/JournalHeader';
import Teacher from '@/models/Teacher';
import Attendance from '@/models/Attendance';
import Student from '@/models/Student';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from '@/lib/utils';

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

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export async function getJournalHeader() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const teacher = await Teacher.findById(teacherId).lean();
    let header = await JournalHeader.findOne({ teacherId }).lean();

    if (!header) {
      // Default fallback header based on teacher info
      return {
        schoolName: teacher?.schoolName || 'SMK 17 Seyegan',
        subject: 'Sistem Operasi',
        classNameSemester: teacher?.className ? `${teacher.className}/Genap` : 'XTKJ/Genap',
        academicYear: '2022/2023',
        curriculum: '2013',
        teacherName: teacher?.name || '',
        nip: '-',
      };
    }

    return JSON.parse(JSON.stringify(header));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error getting journal header:', error);
    throw new Error(error.message || 'Gagal memuat header jurnal.');
  }
}

export async function saveJournalHeader(data: {
  schoolName: string;
  subject: string;
  classNameSemester: string;
  academicYear: string;
  curriculum: string;
  teacherName: string;
  nip: string;
}) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const header = await JournalHeader.findOneAndUpdate(
      { teacherId },
      { $set: { ...data, teacherId } },
      { upsert: true, new: true }
    );

    revalidatePath('/jurnal');
    return { success: true, header: JSON.parse(JSON.stringify(header)) };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error saving journal header:', error);
    throw new Error(error.message || 'Gagal menyimpan header jurnal.');
  }
}

export async function getJournals() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const journals = await Journal.find({ teacherId })
      .sort({ date: 1, meetingNo: 1 })
      .lean();

    return JSON.parse(JSON.stringify(journals));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error getting journals:', error);
    throw new Error(error.message || 'Gagal memuat jurnal.');
  }
}

export async function getAttendanceSummaryForJournalDate(dateStr: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const targetDate = parseLocalDate(dateStr);

    // Fetch attendance for teacher on target date
    const records = await Attendance.find({ teacherId, date: targetDate }).lean();

    if (!records || records.length === 0) {
      return { absentS: 0, absentI: 0, absentA: 0, notes: '' };
    }

    let absentS = 0;
    let absentI = 0;
    let absentA = 0;
    const absentStudentIds: string[] = [];

    records.forEach((r) => {
      if (r.status === 'Sakit') {
        absentS++;
        absentStudentIds.push(r.studentId.toString());
      } else if (r.status === 'Izin') {
        absentI++;
        absentStudentIds.push(r.studentId.toString());
      } else if (r.status === 'Alfa') {
        absentA++;
        absentStudentIds.push(r.studentId.toString());
      }
    });

    let notes = '';
    if (absentStudentIds.length > 0) {
      const students = await Student.find({ _id: { $in: absentStudentIds } }).lean();
      const names = students.map((s) => s.name).join(', ');
      notes = names;
    }

    return { absentS, absentI, absentA, notes };
  } catch (error: any) {
    console.error('Error getting attendance summary:', error);
    return { absentS: 0, absentI: 0, absentA: 0, notes: '' };
  }
}

async function syncAttendanceFromJournal(
  teacherId: string,
  targetDate: Date,
  absentS: number,
  absentI: number,
  absentA: number,
  notes?: string
) {
  try {
    const students = await Student.find({ teacherId }).lean();
    if (!students || students.length === 0) return;

    const notesStr = (notes || '').trim();
    if (!notesStr && absentS === 0 && absentI === 0 && absentA === 0) {
      const bulkOps: any[] = students.map((s) => ({
        updateOne: {
          filter: { studentId: s._id, date: targetDate, teacherId },
          update: { $set: { status: 'Hadir', createdAt: new Date() } },
          upsert: true,
        },
      }));
      await Attendance.bulkWrite(bulkOps);
      return;
    }

    const tokens: string[] = notesStr
      .toLowerCase()
      .split(/[,;\n()]/)
      .map((t: string) => t.trim())
      .filter((t: string) => t.length >= 2);

    const bulkOps: any[] = [];
    for (const s of students) {
      const sNameLower = s.name.toLowerCase();
      const isMentioned = tokens.some(
        (token: string) => sNameLower.includes(token) || token.includes(sNameLower)
      );

      let status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' = 'Hadir';

      if (isMentioned) {
        const index = notesStr.toLowerCase().indexOf(sNameLower);
        let assigned = false;
        if (index !== -1) {
          const snippet = notesStr.toLowerCase().substring(index, index + 35);
          if (snippet.includes('sakit')) {
            status = 'Sakit';
            assigned = true;
          } else if (snippet.includes('izin')) {
            status = 'Izin';
            assigned = true;
          } else if (snippet.includes('alfa') || snippet.includes('alpha')) {
            status = 'Alfa';
            assigned = true;
          }
        }
        if (!assigned) {
          if (absentS > 0) status = 'Sakit';
          else if (absentI > 0) status = 'Izin';
          else if (absentA > 0) status = 'Alfa';
          else status = 'Sakit';
        }
      }

      bulkOps.push({
        updateOne: {
          filter: { studentId: s._id, date: targetDate, teacherId },
          update: { $set: { status, createdAt: new Date() } },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }
  } catch (err) {
    console.error('Error syncing attendance from journal:', err);
  }
}

export async function createJournal(data: {
  date: string;
  meetingNo: number;
  subject?: string;
  basicCompetency: string;
  material: string;
  learningActivity: string;
  absentS: number;
  absentI: number;
  absentA: number;
  notes?: string;
}) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const targetDate = parseLocalDate(data.date);

    const newJournal = new Journal({
      teacherId,
      date: targetDate,
      meetingNo: data.meetingNo,
      subject: data.subject || '',
      basicCompetency: data.basicCompetency,
      material: data.material,
      learningActivity: data.learningActivity,
      absentS: data.absentS || 0,
      absentI: data.absentI || 0,
      absentA: data.absentA || 0,
      notes: data.notes || '',
    });

    await newJournal.save();

    // Two-way sync to Attendance collection
    await syncAttendanceFromJournal(
      teacherId,
      targetDate,
      data.absentS || 0,
      data.absentI || 0,
      data.absentA || 0,
      data.notes
    );

    revalidatePath('/jurnal');
    revalidatePath('/absensi');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error creating journal:', error);
    throw new Error(error.message || 'Gagal menambahkan jurnal.');
  }
}

export async function updateJournal(
  id: string,
  data: {
    date: string;
    meetingNo: number;
    subject?: string;
    basicCompetency: string;
    material: string;
    learningActivity: string;
    absentS: number;
    absentI: number;
    absentA: number;
    notes?: string;
  }
) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const targetDate = parseLocalDate(data.date);

    const updated = await Journal.findOneAndUpdate(
      { _id: id, teacherId },
      {
        $set: {
          date: targetDate,
          meetingNo: data.meetingNo,
          subject: data.subject || '',
          basicCompetency: data.basicCompetency,
          material: data.material,
          learningActivity: data.learningActivity,
          absentS: data.absentS || 0,
          absentI: data.absentI || 0,
          absentA: data.absentA || 0,
          notes: data.notes || '',
        },
      },
      { new: true }
    );

    if (!updated) {
      throw new Error('Jurnal tidak ditemukan atau Anda tidak memiliki akses.');
    }

    // Two-way sync to Attendance collection
    await syncAttendanceFromJournal(
      teacherId,
      targetDate,
      data.absentS || 0,
      data.absentI || 0,
      data.absentA || 0,
      data.notes
    );

    revalidatePath('/jurnal');
    revalidatePath('/absensi');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating journal:', error);
    throw new Error(error.message || 'Gagal memperbarui jurnal.');
  }
}

export async function deleteJournal(id: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const res = await Journal.deleteOne({ _id: id, teacherId });
    if (res.deletedCount === 0) {
      throw new Error('Jurnal tidak ditemukan atau Anda tidak memiliki akses.');
    }

    revalidatePath('/jurnal');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error deleting journal:', error);
    throw new Error(error.message || 'Gagal menghapus jurnal.');
  }
}
