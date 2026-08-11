'use server';

import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Grade from '@/models/Grade';
import Saving from '@/models/Saving';
import Journal from '@/models/Journal';
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

    // 4. Activity Stream: Entri Jurnal Pembelajaran KBM Terkini
    const recentJournalDocs = await Journal.find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const teacherIds = Array.from(new Set(recentJournalDocs.map((j) => j.teacherId)));
    const journalTeachers = await Teacher.find({ _id: { $in: teacherIds } }).lean();
    const teacherMap = new Map(journalTeachers.map((t) => [t._id.toString(), t]));

    const recentJournals = recentJournalDocs.map((j) => {
      const t = teacherMap.get(j.teacherId);
      return {
        id: j._id.toString(),
        teacherName: t?.name || 'Wali Kelas',
        schoolName: t?.schoolName || '-',
        className: j.className || t?.className || '-',
        subject: j.subject || 'Umum',
        material: j.material || '-',
        date: j.date ? new Date(j.date).toISOString() : new Date(j.createdAt).toISOString(),
      };
    });

    // 5. Ambil data statistik per guru (kecuali admin)
    const teachers = await Teacher.find({ email: { $nin: adminEmails } }).sort({ name: 1 }).lean();
    const teacherStats = await Promise.all(
      teachers.map(async (t) => {
        const teacherIdStr = t._id.toString();
        const classStudentCount = await Student.countDocuments({ teacherId: teacherIdStr });
        const teacherSavings = await Saving.find({ teacherId: teacherIdStr }).lean();
        
        let classSavingsBalance = 0;
        teacherSavings.forEach((tx) => {
          classSavingsBalance += tx.type === 'Kredit' ? tx.amount : -tx.amount;
        });

        const journalCount = await Journal.countDocuments({ teacherId: teacherIdStr });
        const gradeCount = await Grade.countDocuments({ teacherId: teacherIdStr });

        const totalAttendance = await Attendance.countDocuments({ teacherId: teacherIdStr });
        const hadirAttendance = await Attendance.countDocuments({ teacherId: teacherIdStr, status: 'Hadir' });
        const attendanceRate = totalAttendance > 0 ? Math.round((hadirAttendance / totalAttendance) * 100) : 0;

        const teacherClasses = Array.isArray(t.classes) && t.classes.length > 0
          ? Array.from(new Set(t.classes.filter(Boolean)))
          : (t.className ? [t.className] : []);

        return {
          id: teacherIdStr,
          name: t.name,
          email: t.email,
          schoolName: t.schoolName || '-',
          className: t.className || (teacherClasses[0] || '-'),
          classes: teacherClasses,
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

    // 6. Dapatkan pengguna online (aktif dalam 5 menit terakhir)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const activeTeachers = await Teacher.find({
      lastActiveAt: { $gte: fiveMinutesAgo }
    }).sort({ name: 1 }).lean();

    const onlineUsers = activeTeachers.map((u) => {
      let role = (u as any).role || 'Wali Kelas';
      if (adminEmails.includes(u.email.toLowerCase())) {
        role = 'Admin';
      }
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role,
        lastActiveAt: u.lastActiveAt ? u.lastActiveAt.toISOString() : new Date().toISOString()
      };
    });

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

    // Lakukan cascade delete
    await Teacher.findByIdAndDelete(id);
    await Student.deleteMany({ teacherId: id });
    await Attendance.deleteMany({ teacherId: id });
    await Grade.deleteMany({ teacherId: id });
    await Saving.deleteMany({ teacherId: id });

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
 * Mengambil daftar sekolah (Public - digunakan di Sign-Up & Admin).
 */
export async function getSchools() {
  try {
    await dbConnect();
    const schools = await School.find({}).sort({ name: 1 }).lean();
    
    // Hitung jumlah guru untuk masing-masing sekolah (kecuali admin)
    const adminUsers = await AdminUser.find({}).lean();
    const adminEmails = adminUsers.map((a) => a.username);

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
      schoolName: schoolName.trim(),
      className: parsedClasses[0] || className.trim(),
      classes: parsedClasses.length > 0 ? parsedClasses : [className.trim()],
      activeClass: parsedClasses[0] || className.trim(),
      role: role || 'Wali Kelas',
    });

    await newTeacher.save();

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

