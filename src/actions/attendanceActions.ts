'use server';

import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

export async function getAttendanceByDate(dateStr: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const targetDate = parseLocalDate(dateStr);

    // Fetch all students for this teacher
    const students = await Student.find({ teacherId }).sort({ name: 1 }).lean();
    
    // Fetch all attendance for this date
    const attendanceRecords = await Attendance.find({
      teacherId,
      date: targetDate,
    }).lean();

    // Map records by studentId for fast lookup
    const recordMap = new Map(
      attendanceRecords.map((r) => [r.studentId.toString(), r.status])
    );

    // Merge students with their attendance status
    const result = students.map((student) => ({
      studentId: student._id.toString(),
      name: student.name,
      nis: student.nis,
      className: student.className,
      gender: student.gender,
      status: recordMap.get(student._id.toString()) || 'Hadir', // default to Hadir
    }));

    return JSON.parse(JSON.stringify(result));
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    throw new Error(error.message || 'Failed to fetch attendance.');
  }
}

export async function saveBulkAttendance(
  dateStr: string,
  records: { studentId: string; status: 'Hadir' | 'Sakit' | 'Izin' | 'Alfa' }[]
) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const targetDate = parseLocalDate(dateStr);

    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: { studentId: rec.studentId, date: targetDate, teacherId },
        update: {
          $set: {
            status: rec.status,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    revalidatePath('/absensi');
    revalidatePath('/');
    return { success: true, count: records.length };
  } catch (error: any) {
    console.error('Error saving bulk attendance:', error);
    throw new Error(error.message || 'Failed to save attendance records.');
  }
}
