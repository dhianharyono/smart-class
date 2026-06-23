'use server';

import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Grade from '@/models/Grade';
import Saving from '@/models/Saving';
import Teacher from '@/models/Teacher';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth';
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


export async function getDashboardStats() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    // Get teacher's KKM
    const teacher = await Teacher.findById(teacherId).select('kkm').lean();
    const kkm = teacher?.kkm ?? 70;

    // 1. Total Students count
    const studentCount = await Student.countDocuments({ teacherId });

    // 2. Attendance stats (Current Month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyAttendance = await Attendance.find({
      teacherId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).lean();

    const attendanceBreakdown = {
      Hadir: 0,
      Sakit: 0,
      Izin: 0,
      Alfa: 0,
    };

    monthlyAttendance.forEach((rec) => {
      if (rec.status in attendanceBreakdown) {
        attendanceBreakdown[rec.status as keyof typeof attendanceBreakdown]++;
      }
    });

    const totalLogs = monthlyAttendance.length;
    const monthlyAttendanceRate =
      totalLogs > 0
        ? Math.round((attendanceBreakdown.Hadir / totalLogs) * 100)
        : 100; // default to 100% if no logs

    // 3. Savings total balance
    const savingsTx = await Saving.find({ teacherId }).sort({ date: 1 }).lean();
    let totalSavingsBalance = 0;
    
    // Accumulate trend data points
    const savingsTrendRaw: { [key: string]: number } = {};
    
    savingsTx.forEach((tx) => {
      const change = tx.type === 'Kredit' ? tx.amount : -tx.amount;
      totalSavingsBalance += change;
      
      // format date to YYYY-MM-DD
      const dateStr = tx.date.toISOString().split('T')[0];
      savingsTrendRaw[dateStr] = totalSavingsBalance;
    });

    const savingsTrend = Object.entries(savingsTrendRaw)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        "Saldo": amount,
      }))
      .slice(-10); // get last 10 points

    // 4. Low grade alerts (score < KKM)
    // Find all grades < KKM, populate student name
    const lowGrades = await Grade.find({
      teacherId,
      score: { $lt: kkm },
    })
      .sort({ score: 1 })
      .populate({
        path: 'studentId',
        select: 'name nis className',
        model: Student
      })
      .lean();

    const lowGradeNotifications = lowGrades
      .filter((g) => g.studentId) // filter out deleted students if any dangling
      .map((g: any) => ({
        gradeId: g._id.toString(),
        studentName: g.studentId.name,
        nis: g.studentId.nis,
        className: g.studentId.className,
        subject: g.subject,
        category: g.category,
        score: g.score,
      }));

    // 5. Attendance pie chart data format
    const attendanceChartData = [
      { name: 'Hadir', value: attendanceBreakdown.Hadir, color: '#10b981' },
      { name: 'Sakit', value: attendanceBreakdown.Sakit, color: '#3b82f6' },
      { name: 'Izin', value: attendanceBreakdown.Izin, color: '#f59e0b' },
      { name: 'Alfa', value: attendanceBreakdown.Alfa, color: '#ef4444' },
    ].filter(item => item.value > 0); // only show non-zero statuses in charts

    // If all are zero, provide placeholder
    if (attendanceChartData.length === 0) {
      attendanceChartData.push({ name: 'Belum Ada Data', value: 1, color: '#71717a' });
    }

    return JSON.parse(JSON.stringify({
      studentCount,
      monthlyAttendanceRate,
      totalSavingsBalance,
      lowGradeCount: lowGradeNotifications.length,
      lowGradeNotifications: lowGradeNotifications.slice(0, 5), // top 5 most urgent alerts
      savingsTrend,
      attendanceBreakdown,
      attendanceChartData,
      kkm,
    }));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error generating dashboard stats:', error);
    throw new Error(error.message || 'Failed to generate dashboard statistics.');
  }
}

export async function getTeacherKkm() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const teacher = await Teacher.findById(teacherId).select('kkm').lean();
    return teacher?.kkm ?? 70;
  } catch (error) {
    console.error('Error fetching teacher KKM:', error);
    return 70;
  }
}

export async function updateTeacherKkm(newKkm: number) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    
    if (typeof newKkm !== 'number' || newKkm < 0 || newKkm > 100 || isNaN(newKkm)) {
      return { success: false, error: 'KKM harus berupa angka antara 0 dan 100.' };
    }

    await Teacher.findByIdAndUpdate(teacherId, { kkm: newKkm });
    
    revalidatePath('/');
    revalidatePath('/nilai');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating KKM:', error);
    return { success: false, error: error.message || 'Gagal memperbarui KKM.' };
  }
}
