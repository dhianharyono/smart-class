'use server';

import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Grade from '@/models/Grade';
import Saving from '@/models/Saving';
import Journal from '@/models/Journal';
import JournalHeader from '@/models/JournalHeader';
import AdminUser from '@/models/AdminUser';
import School from '@/models/School';
import { cookies } from 'next/headers';
import { signSession, verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { hashPassword } from '@/lib/password';
import { isRedirectError, escapeRegExp } from '@/lib/utils';

/**
 * Memverifikasi halaman admin secara sinkronus sebelum render halaman berlanjut.
 */
export async function verifyAdminPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    redirect('/sign-in?clear=1');
  }
  const session = await verifySession(sessionToken);
  if (!session || !session.userId || !session.isAdmin) {
    redirect('/');
  }
}

/**
 * Memastikan request dikirim oleh administrator yang sah.
 */
async function requireAdminAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    redirect('/sign-in?clear=1');
  }
  const session = await verifySession(sessionToken);
  if (!session || !session.userId || !session.isAdmin) {
    redirect('/');
  }
  return session.userId;
}

/**
 * Mendapatkan seluruh data statistik sistem untuk dashboard admin.
 */
export async function getAdminStats() {
  try {
    await dbConnect();
    await requireAdminAuth();

    // Dapatkan semua email admin agar tidak terhitung sebagai guru/wali kelas
    const adminUsers = await AdminUser.find({}).lean();
    const adminEmails = adminUsers.map((a) => a.username);

    // Dapatkan semua ID guru yang sah di database untuk auto-cleanup data yatim/orphan
    const validTeachers = await Teacher.find({}).select('_id').lean();
    const validTeacherIds = validTeachers.map((t) => t._id.toString());

    // Auto-cleanup data yatim yang tersisa dari guru yang sudah dihapus sebelumnya
    await Journal.deleteMany({ teacherId: { $nin: validTeacherIds } });
    await JournalHeader.deleteMany({ teacherId: { $nin: validTeacherIds } });
    await Student.deleteMany({ teacherId: { $nin: validTeacherIds } });
    await Attendance.deleteMany({ teacherId: { $nin: validTeacherIds } });
    await Grade.deleteMany({ teacherId: { $nin: validTeacherIds } });
    await Saving.deleteMany({ teacherId: { $nin: validTeacherIds } });

    // 1. Hitung total data dasar (kecuali admin)
    const teacherCount = await Teacher.countDocuments({ email: { $nin: adminEmails } });
    const schoolCount = await School.countDocuments();
    const studentCount = await Student.countDocuments();
    const totalJournalCount = await Journal.countDocuments();
    const totalGradeCount = await Grade.countDocuments();

    // 2. Hitung total saldo tabungan di seluruh sistem
    const savings = await Saving.find({}).lean();
    let totalSavingsBalance = 0;
    savings.forEach((tx) => {
      totalSavingsBalance += tx.type === 'Kredit' ? tx.amount : -tx.amount;
    });

    // 3. Rekapituasi Presensi Sistem (Hadir, Sakit, Izin, Alfa)
    const totalHadir = await Attendance.countDocuments({ status: 'Hadir' });
    const totalSakit = await Attendance.countDocuments({ status: 'Sakit' });
    const totalIzin = await Attendance.countDocuments({ status: 'Izin' });
    const totalAlfa = await Attendance.countDocuments({ status: 'Alfa' });
    const totalAttendanceRecords = totalHadir + totalSakit + totalIzin + totalAlfa;
    const attendanceBreakdown = {
      hadir: totalHadir,
      sakit: totalSakit,
      izin: totalIzin,
      alfa: totalAlfa,
      total: totalAttendanceRecords,
      hadirPct: totalAttendanceRecords > 0 ? Math.round((totalHadir / totalAttendanceRecords) * 100) : 0,
      sakitPct: totalAttendanceRecords > 0 ? Math.round((totalSakit / totalAttendanceRecords) * 100) : 0,
      izinPct: totalAttendanceRecords > 0 ? Math.round((totalIzin / totalAttendanceRecords) * 100) : 0,
      alfaPct: totalAttendanceRecords > 0 ? Math.round((totalAlfa / totalAttendanceRecords) * 100) : 0,
    };

    // 4. Activity Stream: Entri Jurnal Pembelajaran KBM Terkini (Hanya dari guru aktif)
    const recentJournalDocs = await Journal.find({ teacherId: { $in: validTeacherIds } })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const teacherIds = Array.from(new Set(recentJournalDocs.map((j) => j.teacherId)));
    const journalTeachers = await Teacher.find({ _id: { $in: teacherIds } }).lean();
    const teacherMap = new Map(journalTeachers.map((t) => [t._id.toString(), t]));

    const recentJournals = recentJournalDocs
      .flatMap((j) => {
        const t = teacherMap.get(j.teacherId);
        if (!t) return [];
        return [{
          id: j._id.toString(),
          teacherName: t.name || 'Wali Kelas',
          schoolName: t.schoolName || '-',
          className: j.className || t.className || '-',
          subject: j.subject || 'Umum',
          material: j.material || '-',
          date: j.date ? new Date(j.date).toISOString() : new Date(j.createdAt).toISOString(),
        }];
      });

    // 5. Ambil data statistik per guru (kecuali admin)
    const teachers = await Teacher.find({ email: { $nin: adminEmails } }).sort({ name: 1 }).lean();
    const teacherStats = await Promise.all(
      teachers.map(async (t) => {
        const teacherIdStr = t._id.toString();

        const teacherClasses = Array.isArray(t.classes) && t.classes.length > 0
          ? Array.from(new Set(t.classes.filter(Boolean)))
          : (t.className ? [t.className] : []);

        // 1. Fetch Students per teacher
        const teacherStudents = await Student.find({ teacherId: teacherIdStr }, { _id: 1, className: 1 }).lean();
        const studentClassMap = new Map<string, string>();
        const studentCountByClass = new Map<string, number>();

        teacherStudents.forEach((s) => {
          const sId = s._id.toString();
          const cls = s.className || '-';
          studentClassMap.set(sId, cls);
          studentCountByClass.set(cls, (studentCountByClass.get(cls) || 0) + 1);
        });

        // 2. Fetch Journals per teacher
        const journals = await Journal.find({ teacherId: teacherIdStr }, { className: 1 }).lean();
        const journalCountByClass = new Map<string, number>();
        journals.forEach((j) => {
          const cls = j.className || (teacherClasses[0] || '-');
          journalCountByClass.set(cls, (journalCountByClass.get(cls) || 0) + 1);
        });

        const allClasses = Array.from(
          new Set([
            ...teacherClasses,
            ...Array.from(studentCountByClass.keys()),
            ...Array.from(journalCountByClass.keys()),
          ])
        );

        const classStudentCounts = allClasses.map((cls) => ({
          className: cls,
          count: studentCountByClass.get(cls) || 0,
        }));
        const classStudentCount = teacherStudents.length;

        // 3. Fetch Attendance per teacher
        const attendances = await Attendance.find({ teacherId: teacherIdStr }, { studentId: 1, status: 1 }).lean();
        const classAttMap = new Map<string, { total: number; hadir: number }>();
        let hadirAttendance = 0;

        attendances.forEach((att) => {
          if (att.status === 'Hadir') hadirAttendance++;
          const sId = att.studentId?.toString();
          const clsName = (sId ? studentClassMap.get(sId) : null) || teacherClasses[0] || '-';
          const curr = classAttMap.get(clsName) || { total: 0, hadir: 0 };
          curr.total += 1;
          if (att.status === 'Hadir') curr.hadir += 1;
          classAttMap.set(clsName, curr);
        });

        const totalAttendance = attendances.length;
        const attendanceRate = totalAttendance > 0 ? Math.round((hadirAttendance / totalAttendance) * 100) : 0;

        const classAttendanceRates = allClasses.map((cls) => {
          const data = classAttMap.get(cls);
          return {
            className: cls,
            rate: data && data.total > 0 ? Math.round((data.hadir / data.total) * 100) : null,
            total: data?.total || 0,
          };
        });

        // 4. Class Journal Counts
        const classJournalCounts = allClasses.map((cls) => ({
          className: cls,
          count: journalCountByClass.get(cls) || 0,
        }));
        const journalCount = journals.length;

        // 5. Fetch Grades per teacher
        const grades = await Grade.find({ teacherId: teacherIdStr }, { studentId: 1 }).lean();
        const gradeCountByClass = new Map<string, number>();
        grades.forEach((g) => {
          const sId = g.studentId?.toString();
          const cls = (sId ? studentClassMap.get(sId) : null) || teacherClasses[0] || '-';
          gradeCountByClass.set(cls, (gradeCountByClass.get(cls) || 0) + 1);
        });

        const classGradeCounts = allClasses.map((cls) => ({
          className: cls,
          count: gradeCountByClass.get(cls) || 0,
        }));
        const gradeCount = grades.length;

        // 6. Fetch Savings per teacher
        const teacherSavings = await Saving.find({ teacherId: teacherIdStr }, { studentId: 1, type: 1, amount: 1 }).lean();
        const savingsByClass = new Map<string, number>();
        let classSavingsBalance = 0;

        teacherSavings.forEach((tx) => {
          const amt = tx.type === 'Kredit' ? tx.amount : -tx.amount;
          classSavingsBalance += amt;
          const sId = tx.studentId?.toString();
          const cls = (sId ? studentClassMap.get(sId) : null) || teacherClasses[0] || '-';
          savingsByClass.set(cls, (savingsByClass.get(cls) || 0) + amt);
        });

        const classSavings = allClasses.map((cls) => ({
          className: cls,
          amount: savingsByClass.get(cls) || 0,
        }));

        return {
          id: teacherIdStr,
          name: t.name,
          email: t.email,
          schoolName: t.schoolName || '-',
          className: t.className || (teacherClasses[0] || '-'),
          classes: teacherClasses,
          classStudentCounts,
          classAttendanceRates,
          classJournalCounts,
          classGradeCounts,
          classSavings,
          studentCount: classStudentCount,
          totalSavings: classSavingsBalance,
          journalCount,
          gradeCount,
          attendanceRate,
          totalAttendance,
          createdAt: t.createdAt.toISOString(),
        };
      })
    );

    // Hitung rata-rata tingkat kehadiran seluruh kelas di mana ada data absensi
    const teachersWithAttendance = teacherStats.filter(t => t.totalAttendance > 0);
    const overallAttendanceRate = teachersWithAttendance.length > 0
      ? Math.round(teachersWithAttendance.reduce((acc, curr) => acc + curr.attendanceRate, 0) / teachersWithAttendance.length)
      : 0;

    // 6. Dapatkan pengguna online (aktif dalam 5 menit terakhir, khusus Wali Kelas / Guru non-admin)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeTeachers = await Teacher.find({
      email: { $nin: adminEmails },
      lastActiveAt: { $gte: fiveMinutesAgo }
    }).sort({ name: 1 }).lean();

    const onlineUsers = activeTeachers.map((u) => {
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: (u as any).role || 'Wali Kelas',
        lastActiveAt: u.lastActiveAt ? u.lastActiveAt.toISOString() : new Date().toISOString()
      };
    });

    // 7. Hitung Tren Aktivitas Wali Kelas (7 hari terakhir)
    const activityTrend: {
      date: string;
      day: string;
      fullLabel: string;
      jurnal: number;
      presensi: number;
      nilai: number;
      tabungan: number;
      total: number;
    }[] = [];

    const now = new Date();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      const journalCount = await Journal.countDocuments({
        teacherId: { $in: validTeacherIds },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const attendanceCount = await Attendance.countDocuments({
        teacherId: { $in: validTeacherIds },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const gradeCount = await Grade.countDocuments({
        teacherId: { $in: validTeacherIds },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const savingCount = await Saving.countDocuments({
        teacherId: { $in: validTeacherIds },
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });

      const dayLabel = dayNames[d.getDay()];
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;

      activityTrend.push({
        date: dateStr,
        day: dayLabel,
        fullLabel: `${dayLabel}, ${dateStr}`,
        jurnal: journalCount,
        presensi: attendanceCount,
        nilai: gradeCount,
        tabungan: savingCount,
        total: journalCount + attendanceCount + gradeCount + savingCount,
      });
    }

    return {
      teacherCount,
      schoolCount,
      studentCount,
      totalSavingsBalance,
      totalJournalCount,
      totalGradeCount,
      overallAttendanceRate,
      attendanceBreakdown,
      recentJournals,
      teacherStats,
      onlineUsers,
      activityTrend,
    };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error generating admin stats:', error);
    throw new Error(error.message || 'Gagal menghasilkan statistik admin.');
  }
}

/**
 * Mengambil daftar seluruh wali kelas.
 */
export async function getTeachers() {
  try {
    await dbConnect();
    await requireAdminAuth();

    // Dapatkan semua email admin
    const adminUsers = await AdminUser.find({}).lean();
    const adminEmails = adminUsers.map((a) => a.username);

    // Ambil guru reguler saja
    const teachers = await Teacher.find({ email: { $nin: adminEmails } }).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(teachers));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching teachers:', error);
    throw new Error(error.message || 'Gagal mengambil data guru.');
  }
}

/**
 * Mengubah data profil wali kelas oleh admin.
 */
export async function updateTeacher(id: string, data: {
  name: string;
  email: string;
  schoolName?: string;
  className?: string;
  role?: 'Wali Kelas' | 'Kepala Sekolah';
}) {
  try {
    await dbConnect();
    await requireAdminAuth();

    const { name, email, schoolName, className, role } = data;
    if (!name || !email) {
      throw new Error('Nama dan email wajib diisi.');
    }

    if (schoolName && schoolName.trim()) {
      await ensureSchoolExists(schoolName.trim());
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Cek jika email dipakai guru lain
    const existing = await Teacher.findOne({ email: normalizedEmail, _id: { $ne: id } });
    if (existing) {
      throw new Error('Email sudah digunakan oleh guru lain.');
    }

    const parsedClasses = className
      ? Array.from(new Set(className.split(/[,/]/).map((s) => s.trim()).filter(Boolean)))
      : [];

    const updateFields: any = {
      name: name.trim(),
      email: normalizedEmail,
      schoolName: schoolName?.trim(),
      className: parsedClasses[0] || className?.trim() || '',
      classes: parsedClasses.length > 0 ? parsedClasses : (className?.trim() ? [className.trim()] : []),
      role: role || 'Wali Kelas',
    };

    if (parsedClasses.length > 0) {
      updateFields.activeClass = parsedClasses[0];
    }

    await Teacher.findByIdAndUpdate(id, updateFields);

    revalidatePath('/admin/sekolah');
    revalidatePath('/admin/guru');
    revalidatePath('/admin');

    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating teacher:', error);
    return { success: false, error: error.message || 'Gagal mengubah data guru.' };
  }
}

/**
 * Menghapus guru beserta seluruh data terkait (Siswa, Tabungan, Absensi, Nilai).
 */
export async function deleteTeacher(id: string) {
  try {
    await dbConnect();
    await requireAdminAuth();

    // Pastikan admin tidak menghapus dirinya sendiri jika sedang login
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (sessionToken) {
      const session = await verifySession(sessionToken);
      if (session && session.userId === id) {
        throw new Error('Anda tidak dapat menghapus akun Anda sendiri saat sedang masuk.');
      }
    }

    // Lakukan cascade delete untuk seluruh data terkait guru ini
    await Teacher.findByIdAndDelete(id);
    await Student.deleteMany({ teacherId: id });
    await Attendance.deleteMany({ teacherId: id });
    await Grade.deleteMany({ teacherId: id });
    await Saving.deleteMany({ teacherId: id });
    await Journal.deleteMany({ teacherId: id });
    await JournalHeader.deleteMany({ teacherId: id });

    revalidatePath('/admin/sekolah');
    revalidatePath('/admin/guru');
    revalidatePath('/admin');

    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error deleting teacher:', error);
    return { success: false, error: error.message || 'Gagal menghapus data guru.' };
  }
}

/**
 * Memastikan nama sekolah ada di koleksi Master Data Sekolah (School).
 * Jika belum ada, akan ditambahkan secara otomatis.
 */
export async function ensureSchoolExists(name: string) {
  if (!name || !name.trim()) return null;
  const trimmed = name.trim();
  const safePattern = escapeRegExp(trimmed);

  await dbConnect();

  const existing = await School.findOne({
    name: { $regex: new RegExp(`^${safePattern}$`, 'i') },
  });

  if (!existing) {
    try {
      const created = await School.create({ name: trimmed });
      return JSON.parse(JSON.stringify(created));
    } catch (error: any) {
      const found = await School.findOne({
        name: { $regex: new RegExp(`^${safePattern}$`, 'i') },
      });
      return found ? JSON.parse(JSON.stringify(found)) : null;
    }
  }

  return JSON.parse(JSON.stringify(existing));
}

/**
 * Mengambil daftar sekolah (Public - digunakan di Sign-Up & Admin).
 * Otomatis menyinkronkan data sekolah dari koleksi Teacher ke koleksi Master Data School.
 */
export async function getSchools() {
  try {
    await dbConnect();

    // Dapatkan semua email admin agar tidak terikut saat auto-sync sekolah
    const adminUsers = await AdminUser.find({}).lean();
    const adminEmails = adminUsers.map((a) => (a.username || '').toLowerCase().trim());

    // Auto-sync: Sinkronisasi nama sekolah unik dari dokumen Teacher non-admin yang belum ada di koleksi School
    const teacherSchoolNames: (string | null | undefined)[] = await Teacher.distinct('schoolName', {
      email: { $nin: adminEmails },
      schoolName: { $exists: true, $ne: '' },
    });
    for (const rawName of teacherSchoolNames) {
      if (rawName && typeof rawName === 'string' && rawName.trim().length >= 2) {
        const trimmed = rawName.trim();
        const safePattern = escapeRegExp(trimmed);
        const exists = await School.findOne({
          name: { $regex: new RegExp(`^${safePattern}$`, 'i') },
        });
        if (!exists) {
          try {
            await School.create({ name: trimmed });
            console.log(`[SYNC] Auto-created missing school from teacher record: "${trimmed}"`);
          } catch (err) {
            // Abaikan jika ada duplikasi concurrent
          }
        }
      }
    }

    const schools = await School.find({}).sort({ name: 1 }).lean();

    const schoolsWithCount = await Promise.all(
      schools.map(async (school) => {
        const teacherCount = await Teacher.countDocuments({ 
          schoolName: school.name,
          email: { $nin: adminEmails }
        });

        // Hitung jumlah siswa di sekolah ini
        const schoolTeachers = await Teacher.find({ 
          schoolName: school.name,
          email: { $nin: adminEmails }
        }).select('_id').lean();
        const teacherIds = schoolTeachers.map((t) => t._id.toString());
        const studentCount = await Student.countDocuments({ teacherId: { $in: teacherIds } });

        return {
          ...school,
          teacherCount,
          studentCount,
        };
      })
    );

    return JSON.parse(JSON.stringify(schoolsWithCount));
  } catch (error: any) {
    console.error('Error fetching schools:', error);
    return [];
  }
}

/**
 * Membuat Wali Kelas baru oleh Administrator.
 */
export async function createTeacher(data: {
  name: string;
  email: string;
  password?: string;
  schoolName: string;
  className: string;
  role?: 'Wali Kelas' | 'Kepala Sekolah';
}) {
  try {
    await dbConnect();
    await requireAdminAuth();

    const { name, email, password, schoolName, className, role } = data;
    if (!name || !email || !schoolName || !className) {
      throw new Error('Semua field wajib diisi.');
    }

    const trimmedSchool = schoolName.trim();
    await ensureSchoolExists(trimmedSchool);

    const normalizedEmail = email.toLowerCase().trim();
    
    // Cek duplikasi email
    const existing = await Teacher.findOne({ email: normalizedEmail });
    if (existing) {
      throw new Error('Email atau username sudah terdaftar.');
    }

    const rawPassword = password || 'Gurusmart123!';
    const hashedPassword = hashPassword(rawPassword);

    const parsedClasses = className
      ? Array.from(new Set(className.split(/[,/]/).map((s) => s.trim()).filter(Boolean)))
      : [];

    const newTeacher = new Teacher({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      schoolName: trimmedSchool,
      className: parsedClasses[0] || className.trim(),
      classes: parsedClasses.length > 0 ? parsedClasses : [className.trim()],
      activeClass: parsedClasses[0] || className.trim(),
      role: role || 'Wali Kelas',
    });

    await newTeacher.save();

    revalidatePath('/admin/sekolah');
    revalidatePath('/admin/guru');
    revalidatePath('/admin');

    return { 
      success: true, 
      teacher: {
        _id: newTeacher._id.toString(),
        name: newTeacher.name,
        email: newTeacher.email,
        schoolName: newTeacher.schoolName,
        className: newTeacher.className,
        classes: newTeacher.classes,
        role: newTeacher.role,
        createdAt: newTeacher.createdAt.toISOString()
      } 
    };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error creating teacher:', error);
    return { success: false, error: error.message || 'Gagal menambahkan wali kelas.' };
  }
}

/**
 * Menambahkan sekolah baru ke dalam sistem.
 */
export async function addSchool(name: string) {
  try {
    await dbConnect();
    await requireAdminAuth();

    if (!name || !name.trim()) {
      throw new Error('Nama sekolah tidak boleh kosong.');
    }

    const trimmed = name.trim();
    // Case-insensitive check with safe regex pattern
    const safePattern = escapeRegExp(trimmed);
    const exists = await School.findOne({ name: { $regex: new RegExp(`^${safePattern}$`, 'i') } });
    if (exists) {
      throw new Error('Nama sekolah sudah terdaftar.');
    }

    const newSchool = await School.create({ name: trimmed });
    revalidatePath('/admin/sekolah');
    revalidatePath('/admin/guru');
    revalidatePath('/admin');
    return { success: true, school: JSON.parse(JSON.stringify(newSchool)) };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error adding school:', error);
    return { success: false, error: error.message || 'Gagal menambahkan sekolah.' };
  }
}

/**
 * Menghapus sekolah jika tidak digunakan oleh guru manapun.
 */
export async function deleteSchool(id: string) {
  try {
    await dbConnect();
    await requireAdminAuth();

    const school = await School.findById(id).lean();
    if (!school) {
      throw new Error('Sekolah tidak ditemukan.');
    }

    // Dapatkan semua email admin
    const adminUsers = await AdminUser.find({}).lean();
    const adminEmails = adminUsers.map((a) => a.username);

    // Blokir jika masih ada guru reguler yang terdaftar dengan sekolah ini
    const isUsed = await Teacher.exists({ 
      schoolName: school.name,
      email: { $nin: adminEmails }
    });
    if (isUsed) {
      throw new Error(`Sekolah "${school.name}" tidak dapat dihapus karena masih digunakan oleh beberapa wali kelas.`);
    }

    await School.findByIdAndDelete(id);

    // Bersihkan referensi nama sekolah ini pada dokumen Teacher (misal akun admin) agar tidak ter-sync kembali
    await Teacher.updateMany(
      { schoolName: school.name },
      { $set: { schoolName: '' } }
    );

    revalidatePath('/admin/sekolah');
    revalidatePath('/admin/guru');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error deleting school:', error);
    return { success: false, error: error.message || 'Gagal menghapus sekolah.' };
  }
}

/**
 * Mengambil data profil pengguna Administrator.
 */
export async function getAdminProfile() {
  try {
    await dbConnect();
    const adminId = await requireAdminAuth();

    const teacher = await Teacher.findById(adminId).lean();
    if (!teacher) {
      throw new Error('Data pengguna admin tidak ditemukan.');
    }

    return JSON.parse(
      JSON.stringify({
        _id: teacher._id.toString(),
        name: teacher.name,
        username: teacher.username || '',
        email: teacher.email,
        createdAt: teacher.createdAt ? new Date(teacher.createdAt).toISOString() : new Date().toISOString(),
      })
    );
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching admin profile:', error);
    throw new Error(error.message || 'Gagal mengambil data profil admin.');
  }
}

/**
 * Mengubah profil Administrator (Nama, Username, Email).
 */
export async function updateAdminProfile(data: {
  name: string;
  username: string;
  email: string;
}) {
  try {
    await dbConnect();
    const adminId = await requireAdminAuth();

    const { name, username, email } = data;

    if (!name || name.trim().length < 3) {
      throw new Error('Nama lengkap & gelar minimal 3 karakter.');
    }

    const normalizedUsername = username?.toLowerCase().trim();
    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
    if (!normalizedUsername || !USERNAME_REGEX.test(normalizedUsername)) {
      throw new Error('Username hanya boleh berisi huruf, angka, dan garis bawah (_) minimal 3-20 karakter.');
    }

    const normalizedEmail = email?.toLowerCase().trim();
    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error('Format email tidak valid.');
    }

    const currentTeacher = await Teacher.findById(adminId);
    if (!currentTeacher) {
      throw new Error('Pengguna admin tidak ditemukan.');
    }

    const oldEmail = currentTeacher.email.toLowerCase().trim();
    const oldUsername = (currentTeacher.username || '').toLowerCase().trim();

    // Cek keunikan username
    const usernameExists = await Teacher.findOne({
      username: normalizedUsername,
      _id: { $ne: adminId },
    });
    if (usernameExists) {
      throw new Error('Username ini sudah digunakan oleh akun lain.');
    }

    // Cek keunikan email
    const emailExists = await Teacher.findOne({
      email: normalizedEmail,
      _id: { $ne: adminId },
    });
    if (emailExists) {
      throw new Error('Email ini sudah terdaftar pada akun lain.');
    }

    // Update Teacher document
    currentTeacher.name = name.trim();
    currentTeacher.username = normalizedUsername;
    currentTeacher.email = normalizedEmail;
    await currentTeacher.save();

    // Sinkronkan data di AdminUser agar sesi admin tetap valid
    await AdminUser.findOneAndUpdate(
      { $or: [{ username: oldEmail }, { username: oldUsername }] },
      { username: normalizedEmail }
    );

    // Perbarui session cookie dengan nama & email baru
    const token = await signSession({
      userId: currentTeacher._id.toString(),
      email: currentTeacher.email,
      name: currentTeacher.name,
      isAdmin: true,
    });

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    revalidatePath('/admin');
    revalidatePath('/admin/profile');

    return {
      success: true,
      admin: {
        _id: currentTeacher._id.toString(),
        name: currentTeacher.name,
        username: currentTeacher.username,
        email: currentTeacher.email,
      },
    };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating admin profile:', error);
    return { success: false, error: error.message || 'Gagal mengubah profil admin.' };
  }
}

