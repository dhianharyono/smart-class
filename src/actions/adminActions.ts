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

    // 1. Dapatkan semua email admin agar tidak terhitung sebagai guru/wali kelas
    const adminUsers = await AdminUser.find({}).lean();
    const adminEmails = adminUsers.map((a) => (a.username || '').toLowerCase().trim());
    const adminEmailSet = new Set(adminEmails);

    // 2. Dapatkan guru reguler (non-admin)
    const allTeachers = await Teacher.find({}).sort({ name: 1 }).lean();
    const teachers = allTeachers.filter(
      (t) => !adminEmailSet.has((t.email || '').toLowerCase().trim())
    );

    const validTeacherIdStrs = teachers.map((t) => t._id.toString());
    const teacherMap = new Map(teachers.map((t) => [t._id.toString(), t]));

    // 3. Hitung total data dasar
    const teacherCount = teachers.length;
    const schoolCount = await School.countDocuments();

    // 4. Fetch data agregat secara paralel untuk seluruh guru
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      allStudents,
      allJournals,
      allAttendances,
      allGrades,
      allSavings,
      recentJournalDocs,
      activeTeachers,
    ] = await Promise.all([
      Student.find({ teacherId: { $in: validTeacherIdStrs } }, { _id: 1, teacherId: 1, className: 1 }).lean(),
      Journal.find({ teacherId: { $in: validTeacherIdStrs } }, { _id: 1, teacherId: 1, className: 1, createdAt: 1, subject: 1, material: 1, date: 1 }).lean(),
      Attendance.find({ teacherId: { $in: validTeacherIdStrs } }, { _id: 1, teacherId: 1, studentId: 1, status: 1, createdAt: 1 }).lean(),
      Grade.find({ teacherId: { $in: validTeacherIdStrs } }, { _id: 1, teacherId: 1, studentId: 1, createdAt: 1 }).lean(),
      Saving.find({ teacherId: { $in: validTeacherIdStrs } }, { _id: 1, teacherId: 1, studentId: 1, type: 1, amount: 1, createdAt: 1 }).lean(),
      Journal.find({ teacherId: { $in: validTeacherIdStrs } })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Teacher.find({
        _id: { $in: validTeacherIdStrs },
        lastActiveAt: { $gte: fiveMinutesAgo },
      }).sort({ name: 1 }).lean(),
    ]);

    const studentCount = allStudents.length;
    const totalJournalCount = allJournals.length;
    const totalGradeCount = allGrades.length;

    // Hitung total saldo tabungan di seluruh sistem
    let totalSavingsBalance = 0;
    allSavings.forEach((tx) => {
      totalSavingsBalance += tx.type === 'Kredit' ? tx.amount : -tx.amount;
    });

    // Presensi Sistem
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlfa = 0;

    allAttendances.forEach((att) => {
      if (att.status === 'Hadir') totalHadir++;
      else if (att.status === 'Sakit') totalSakit++;
      else if (att.status === 'Izin') totalIzin++;
      else if (att.status === 'Alfa') totalAlfa++;
    });

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

    // Entri Jurnal Pembelajaran KBM Terkini
    const recentJournals = recentJournalDocs.flatMap((j) => {
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

    // Pengelompokan Data Per Guru (In-Memory Indexing)
    const teacherStudentsMap = new Map<string, typeof allStudents>();
    allStudents.forEach((s) => {
      const tId = s.teacherId;
      const list = teacherStudentsMap.get(tId) || [];
      list.push(s);
      teacherStudentsMap.set(tId, list);
    });

    const teacherJournalsMap = new Map<string, typeof allJournals>();
    allJournals.forEach((j) => {
      const tId = j.teacherId;
      const list = teacherJournalsMap.get(tId) || [];
      list.push(j);
      teacherJournalsMap.set(tId, list);
    });

    const teacherAttendancesMap = new Map<string, typeof allAttendances>();
    allAttendances.forEach((a) => {
      const tId = a.teacherId;
      const list = teacherAttendancesMap.get(tId) || [];
      list.push(a);
      teacherAttendancesMap.set(tId, list);
    });

    const teacherGradesMap = new Map<string, typeof allGrades>();
    allGrades.forEach((g) => {
      const tId = g.teacherId;
      const list = teacherGradesMap.get(tId) || [];
      list.push(g);
      teacherGradesMap.set(tId, list);
    });

    const teacherSavingsMap = new Map<string, typeof allSavings>();
    allSavings.forEach((s) => {
      const tId = s.teacherId;
      const list = teacherSavingsMap.get(tId) || [];
      list.push(s);
      teacherSavingsMap.set(tId, list);
    });

    // Olah statistik per guru
    const teacherStats = teachers.map((t) => {
      const teacherIdStr = t._id.toString();

      const teacherClasses = Array.isArray(t.classes) && t.classes.length > 0
        ? Array.from(new Set(t.classes.filter(Boolean)))
        : (t.className ? [t.className] : []);

      const tStudents = teacherStudentsMap.get(teacherIdStr) || [];
      const studentClassMap = new Map<string, string>();
      const studentCountByClass = new Map<string, number>();

      tStudents.forEach((s) => {
        const sId = s._id.toString();
        const cls = s.className || '-';
        studentClassMap.set(sId, cls);
        studentCountByClass.set(cls, (studentCountByClass.get(cls) || 0) + 1);
      });

      const tJournals = teacherJournalsMap.get(teacherIdStr) || [];
      const journalCountByClass = new Map<string, number>();
      tJournals.forEach((j) => {
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

      const tAttendances = teacherAttendancesMap.get(teacherIdStr) || [];
      const classAttMap = new Map<string, { total: number; hadir: number }>();
      let hadirAttendance = 0;

      tAttendances.forEach((att) => {
        if (att.status === 'Hadir') hadirAttendance++;
        const sId = att.studentId?.toString();
        const clsName = (sId ? studentClassMap.get(sId) : null) || teacherClasses[0] || '-';
        const curr = classAttMap.get(clsName) || { total: 0, hadir: 0 };
        curr.total += 1;
        if (att.status === 'Hadir') curr.hadir += 1;
        classAttMap.set(clsName, curr);
      });

      const totalAttendance = tAttendances.length;
      const attendanceRate = totalAttendance > 0 ? Math.round((hadirAttendance / totalAttendance) * 100) : 0;

      const classAttendanceRates = allClasses.map((cls) => {
        const data = classAttMap.get(cls);
        return {
          className: cls,
          rate: data && data.total > 0 ? Math.round((data.hadir / data.total) * 100) : null,
          total: data?.total || 0,
        };
      });

      const classJournalCounts = allClasses.map((cls) => ({
        className: cls,
        count: journalCountByClass.get(cls) || 0,
      }));
      const journalCount = tJournals.length;

      const tGrades = teacherGradesMap.get(teacherIdStr) || [];
      const gradeCountByClass = new Map<string, number>();
      tGrades.forEach((g) => {
        const sId = g.studentId?.toString();
        const cls = (sId ? studentClassMap.get(sId) : null) || teacherClasses[0] || '-';
        gradeCountByClass.set(cls, (gradeCountByClass.get(cls) || 0) + 1);
      });

      const classGradeCounts = allClasses.map((cls) => ({
        className: cls,
        count: gradeCountByClass.get(cls) || 0,
      }));
      const gradeCount = tGrades.length;

      const tSavings = teacherSavingsMap.get(teacherIdStr) || [];
      const savingsByClass = new Map<string, number>();
      let classSavingsBalance = 0;

      tSavings.forEach((tx) => {
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
        studentCount: tStudents.length,
        totalSavings: classSavingsBalance,
        journalCount,
        gradeCount,
        attendanceRate,
        totalAttendance,
        createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    // Hitung rata-rata tingkat kehadiran seluruh kelas
    const teachersWithAttendance = teacherStats.filter((t) => t.totalAttendance > 0);
    const overallAttendanceRate = teachersWithAttendance.length > 0
      ? Math.round(teachersWithAttendance.reduce((acc, curr) => acc + curr.attendanceRate, 0) / teachersWithAttendance.length)
      : 0;

    // Pengguna online
    const onlineUsers = activeTeachers.map((u) => {
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: (u as any).role || 'Wali Kelas',
        lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : new Date().toISOString(),
      };
    });

    // Tren Aktivitas Wali Kelas (7 hari terakhir) - Fast In-Memory Bucketing
    const activityTrend = [];
    const now = new Date();
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);

      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
      const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();

      let jCount = 0;
      for (const j of allJournals) {
        const t = new Date((j as any).createdAt || (j as any).date).getTime();
        if (t >= startOfDay && t <= endOfDay) jCount++;
      }

      let aCount = 0;
      for (const a of allAttendances) {
        const t = new Date((a as any).createdAt).getTime();
        if (t >= startOfDay && t <= endOfDay) aCount++;
      }

      let gCount = 0;
      for (const g of allGrades) {
        const t = new Date((g as any).createdAt).getTime();
        if (t >= startOfDay && t <= endOfDay) gCount++;
      }

      let sCount = 0;
      for (const s of allSavings) {
        const t = new Date((s as any).createdAt).getTime();
        if (t >= startOfDay && t <= endOfDay) sCount++;
      }

      const dayLabel = dayNames[d.getDay()];
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;

      activityTrend.push({
        date: dateStr,
        day: dayLabel,
        fullLabel: `${dayLabel}, ${dateStr}`,
        jurnal: jCount,
        presensi: aCount,
        nilai: gCount,
        tabungan: sCount,
        total: jCount + aCount + gCount + sCount,
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

    const adminUsers = await AdminUser.find({}).lean();
    const adminEmails = adminUsers.map((a) => (a.username || '').toLowerCase().trim());
    const adminEmailSet = new Set(adminEmails);

    const [schools, teachers] = await Promise.all([
      School.find({}).sort({ name: 1 }).lean(),
      Teacher.find({}, { _id: 1, email: 1, schoolName: 1 }).lean(),
    ]);

    const validTeachers = teachers.filter(
      (t) => !adminEmailSet.has((t.email || '').toLowerCase().trim())
    );
    const validTeacherIds = validTeachers.map((t) => t._id.toString());

    // Sync missing school names from teacher records if any
    const existingSchoolNamesLower = new Set(schools.map((s) => (s.name || '').toLowerCase().trim()));
    const teacherSchoolNames = Array.from(
      new Set(validTeachers.map((t) => t.schoolName).filter(Boolean))
    ) as string[];

    const missingSchools = teacherSchoolNames.filter(
      (name) => name.trim().length >= 2 && !existingSchoolNamesLower.has(name.trim().toLowerCase())
    );

    if (missingSchools.length > 0) {
      for (const missingName of missingSchools) {
        try {
          await School.create({ name: missingName.trim() });
          console.log(`[SYNC] Auto-created missing school: "${missingName}"`);
        } catch (err) {}
      }
      const updatedSchools = await School.find({}).sort({ name: 1 }).lean();
      schools.length = 0;
      schools.push(...updatedSchools);
    }

    const students = await Student.find({ teacherId: { $in: validTeacherIds } }, { teacherId: 1 }).lean();

    const teacherCountBySchool = new Map<string, number>();
    const teacherIdsBySchool = new Map<string, string[]>();

    validTeachers.forEach((t) => {
      if (t.schoolName) {
        const sName = t.schoolName.trim();
        teacherCountBySchool.set(sName, (teacherCountBySchool.get(sName) || 0) + 1);
        const ids = teacherIdsBySchool.get(sName) || [];
        ids.push(t._id.toString());
        teacherIdsBySchool.set(sName, ids);
      }
    });

    const studentCountByTeacher = new Map<string, number>();
    students.forEach((s) => {
      if (s.teacherId) {
        const tId = s.teacherId.toString();
        studentCountByTeacher.set(tId, (studentCountByTeacher.get(tId) || 0) + 1);
      }
    });

    const schoolsWithCount = schools.map((school) => {
      const sName = (school.name || '').trim();
      const teacherCount = teacherCountBySchool.get(sName) || 0;
      const tIds = teacherIdsBySchool.get(sName) || [];
      const studentCount = tIds.reduce((sum, tId) => sum + (studentCountByTeacher.get(tId) || 0), 0);

      return {
        ...school,
        _id: school._id.toString(),
        createdAt: school.createdAt ? new Date(school.createdAt).toISOString() : new Date().toISOString(),
        teacherCount,
        studentCount,
      };
    });

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

