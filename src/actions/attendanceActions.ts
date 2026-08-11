'use server';

import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from '@/lib/utils';

import Teacher from '@/models/Teacher';
import JournalHeader from '@/models/JournalHeader';

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

export async function getAttendanceHeaderInfo() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const teacher = await Teacher.findById(teacherId).lean();
    const journalHeader = await JournalHeader.findOne({ teacherId }).lean();

    const validNip =
      teacher?.nip && teacher.nip.trim() !== '' && teacher.nip !== '-'
        ? teacher.nip.trim()
        : journalHeader?.nip && journalHeader.nip.trim() !== '' && journalHeader.nip !== '-'
          ? journalHeader.nip.trim()
          : '-';

    const activeClass = teacher?.activeClass || teacher?.className || journalHeader?.classNameSemester || 'Kelas Utama';

    return {
      schoolName: teacher?.schoolName || journalHeader?.schoolName || 'SMK Negeri 1',
      className: activeClass,
      teacherName: teacher?.name || journalHeader?.teacherName || '',
      nip: validNip,
      principalName: teacher?.principalName || '',
      principalNip: teacher?.principalNip || '-',
      academicYear: journalHeader?.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    return {
      schoolName: 'SMK Negeri 1',
      className: 'Kelas Utama',
      teacherName: 'Guru Kelas',
      nip: '-',
      academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    };
  }
}

export async function getAttendanceByDate(dateStr: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const teacher = await Teacher.findById(teacherId).lean();
    const activeClass = teacher?.activeClass || teacher?.className || '';
    const targetDate = parseLocalDate(dateStr);

    const studentFilter: any = { teacherId };
    if (activeClass) {
      studentFilter.className = activeClass;
    }

    // Fetch students for active class
    const students = await Student.find(studentFilter).sort({ name: 1 }).lean();
    
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
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching attendance:', error);
    throw new Error(error.message || 'Failed to fetch attendance.');
  }
}

export async function getWeeklyAttendanceReport(startDateStr: string, endDateStr: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const teacher = await Teacher.findById(teacherId).lean();
    const activeClass = teacher?.activeClass || teacher?.className || '';

    const startDate = parseLocalDate(startDateStr);
    const [endY, endM, endD] = endDateStr.split('-').map(Number);
    const endDate = new Date(Date.UTC(endY, endM - 1, endD, 23, 59, 59, 999));

    const studentFilter: any = { teacherId };
    if (activeClass) {
      studentFilter.className = activeClass;
    }

    const students = await Student.find(studentFilter).sort({ name: 1 }).lean();
    const attendanceRecords = await Attendance.find({
      teacherId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    const datesList: string[] = [];
    const curr = new Date(startDate);
    while (curr <= endDate) {
      const year = curr.getUTCFullYear();
      const month = String(curr.getUTCMonth() + 1).padStart(2, '0');
      const day = String(curr.getUTCDate()).padStart(2, '0');
      datesList.push(`${year}-${month}-${day}`);
      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    const studentDateMap: Record<string, Record<string, string>> = {};
    attendanceRecords.forEach((rec) => {
      const sId = rec.studentId.toString();
      const recDate = new Date(rec.date);
      const year = recDate.getUTCFullYear();
      const month = String(recDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(recDate.getUTCDate()).padStart(2, '0');
      const dStr = `${year}-${month}-${day}`;
      if (!studentDateMap[sId]) {
        studentDateMap[sId] = {};
      }
      studentDateMap[sId][dStr] = rec.status;
    });

    const studentsReport = students.map((student) => {
      const sId = student._id.toString();
      const dateMap = studentDateMap[sId] || {};

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alfa = 0;

      Object.values(dateMap).forEach((st) => {
        if (st === 'Hadir') hadir++;
        else if (st === 'Sakit') sakit++;
        else if (st === 'Izin') izin++;
        else if (st === 'Alfa') alfa++;
      });

      const totalRecorded = hadir + sakit + izin + alfa;
      const percentage = totalRecorded > 0 ? Math.round((hadir / totalRecorded) * 100) : 0;

      return {
        studentId: sId,
        nis: student.nis,
        name: student.name,
        className: student.className,
        gender: student.gender,
        dailyMap: dateMap,
        hadir,
        sakit,
        izin,
        alfa,
        totalRecorded,
        percentage,
      };
    });

    return JSON.parse(
      JSON.stringify({
        startDateStr,
        endDateStr,
        datesList,
        studentsReport,
      })
    );
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching weekly attendance report:', error);
    throw new Error(error.message || 'Gagal memuat rekap absensi mingguan.');
  }
}

export async function getMonthlyAttendanceReport(year: number, month: number) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const teacher = await Teacher.findById(teacherId).lean();
    const activeClass = teacher?.activeClass || teacher?.className || '';

    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const daysInMonth = new Date(year, month, 0).getDate();

    const studentFilter: any = { teacherId };
    if (activeClass) {
      studentFilter.className = activeClass;
    }

    const students = await Student.find(studentFilter).sort({ name: 1 }).lean();
    const attendanceRecords = await Attendance.find({
      teacherId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    // Map: studentId -> { [day]: status }
    const studentDayMap: Record<string, Record<number, string>> = {};
    attendanceRecords.forEach((rec) => {
      const sId = rec.studentId.toString();
      const recDate = new Date(rec.date);
      const day = recDate.getUTCDate();
      if (!studentDayMap[sId]) {
        studentDayMap[sId] = {};
      }
      studentDayMap[sId][day] = rec.status;
    });

    const studentsReport = students.map((student) => {
      const sId = student._id.toString();
      const dayMap = studentDayMap[sId] || {};

      let hadir = 0;
      let sakit = 0;
      let izin = 0;
      let alfa = 0;

      Object.values(dayMap).forEach((st) => {
        if (st === 'Hadir') hadir++;
        else if (st === 'Sakit') sakit++;
        else if (st === 'Izin') izin++;
        else if (st === 'Alfa') alfa++;
      });

      const totalRecorded = hadir + sakit + izin + alfa;
      const percentage = totalRecorded > 0 ? Math.round((hadir / totalRecorded) * 100) : 0;

      return {
        studentId: sId,
        nis: student.nis,
        name: student.name,
        className: student.className,
        gender: student.gender,
        dailyMap: dayMap,
        hadir,
        sakit,
        izin,
        alfa,
        totalRecorded,
        percentage,
      };
    });

    return JSON.parse(
      JSON.stringify({
        year,
        month,
        daysInMonth,
        studentsReport,
      })
    );
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching monthly attendance report:', error);
    throw new Error(error.message || 'Gagal memuat rekap absensi bulanan.');
  }
}

export async function getYearlyAttendanceReport(year: number) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const students = await Student.find({ teacherId }).sort({ name: 1 }).lean();
    const attendanceRecords = await Attendance.find({
      teacherId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    // Map: studentId -> { [monthIndex 0..11]: { hadir, sakit, izin, alfa } }
    const studentMonthMap: Record<
      string,
      Record<number, { hadir: number; sakit: number; izin: number; alfa: number }>
    > = {};

    attendanceRecords.forEach((rec) => {
      const sId = rec.studentId.toString();
      const recDate = new Date(rec.date);
      const mIdx = recDate.getUTCMonth(); // 0..11

      if (!studentMonthMap[sId]) {
        studentMonthMap[sId] = {};
      }
      if (!studentMonthMap[sId][mIdx]) {
        studentMonthMap[sId][mIdx] = { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
      }

      if (rec.status === 'Hadir') studentMonthMap[sId][mIdx].hadir++;
      else if (rec.status === 'Sakit') studentMonthMap[sId][mIdx].sakit++;
      else if (rec.status === 'Izin') studentMonthMap[sId][mIdx].izin++;
      else if (rec.status === 'Alfa') studentMonthMap[sId][mIdx].alfa++;
    });

    const studentsReport = students.map((student) => {
      const sId = student._id.toString();
      const monthData = studentMonthMap[sId] || {};

      let totalHadir = 0;
      let totalSakit = 0;
      let totalIzin = 0;
      let totalAlfa = 0;

      const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => {
        const m = monthData[i] || { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
        totalHadir += m.hadir;
        totalSakit += m.sakit;
        totalIzin += m.izin;
        totalAlfa += m.alfa;
        return {
          monthIndex: i,
          hadir: m.hadir,
          sakit: m.sakit,
          izin: m.izin,
          alfa: m.alfa,
        };
      });

      const totalRecorded = totalHadir + totalSakit + totalIzin + totalAlfa;
      const percentage = totalRecorded > 0 ? Math.round((totalHadir / totalRecorded) * 100) : 0;

      return {
        studentId: sId,
        nis: student.nis,
        name: student.name,
        className: student.className,
        gender: student.gender,
        monthlyBreakdown,
        hadir: totalHadir,
        sakit: totalSakit,
        izin: totalIzin,
        alfa: totalAlfa,
        totalRecorded,
        percentage,
      };
    });

    return JSON.parse(
      JSON.stringify({
        year,
        studentsReport,
      })
    );
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching yearly attendance report:', error);
    throw new Error(error.message || 'Gagal memuat rekap absensi tahunan.');
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

    // Verify student ownership to prevent cross-tenant parameter tampering
    const teacherStudents = await Student.find({ teacherId }).select('_id').lean();
    const validStudentSet = new Set(teacherStudents.map((s) => s._id.toString()));
    const validRecords = records.filter((rec) => validStudentSet.has(rec.studentId));

    const bulkOps = validRecords.map((rec) => ({
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
    revalidatePath('/jurnal');
    revalidatePath('/');
    return { success: true, count: records.length };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error saving bulk attendance:', error);
    throw new Error(error.message || 'Failed to save attendance records.');
  }
}

