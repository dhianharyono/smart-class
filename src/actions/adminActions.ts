'use server';

import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import Student from '@/models/Student';
import Attendance from '@/models/Attendance';
import Grade from '@/models/Grade';
import Saving from '@/models/Saving';
import AdminUser from '@/models/AdminUser';
import School from '@/models/School';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { hashPassword } from '@/lib/password';

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
    throw new Error('Unauthorized: Sesi tidak ditemukan.');
  }
  const session = await verifySession(sessionToken);
  if (!session || !session.userId || !session.isAdmin) {
    throw new Error('Unauthorized: Akses ditolak. Halaman khusus Administrator.');
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

    // 2. Hitung total saldo tabungan di seluruh sistem
    const savings = await Saving.find({}).lean();
    let totalSavingsBalance = 0;
    savings.forEach((tx) => {
      totalSavingsBalance += tx.type === 'Kredit' ? tx.amount : -tx.amount;
    });

    // 3. Ambil data statistik per guru (kecuali admin)
    const teachers = await Teacher.find({ email: { $nin: adminEmails } }).sort({ name: 1 }).lean();
    const teacherStats = await Promise.all(
      teachers.map(async (t) => {
        const classStudentCount = await Student.countDocuments({ teacherId: t._id.toString() });
        const teacherSavings = await Saving.find({ teacherId: t._id.toString() }).lean();
        
        let classSavingsBalance = 0;
        teacherSavings.forEach((tx) => {
          classSavingsBalance += tx.type === 'Kredit' ? tx.amount : -tx.amount;
        });

        return {
          id: t._id.toString(),
          name: t.name,
          email: t.email,
          schoolName: t.schoolName || '-',
          className: t.className || '-',
          studentCount: classStudentCount,
          totalSavings: classSavingsBalance,
          createdAt: t.createdAt.toISOString(),
        };
      })
    );

    // 4. Dapatkan pengguna online (aktif dalam 5 menit terakhir)
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
      teacherStats,
      onlineUsers,
    };
  } catch (error: any) {
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

    await Teacher.findByIdAndUpdate(id, {
      name: name.trim(),
      email: normalizedEmail,
      schoolName: schoolName?.trim(),
      className: className?.trim(),
      role: role || 'Wali Kelas',
    });

    return { success: true };
  } catch (error: any) {
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

    const newTeacher = new Teacher({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      schoolName: schoolName.trim(),
      className: className.trim(),
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
        role: newTeacher.role,
        createdAt: newTeacher.createdAt.toISOString()
      } 
    };
  } catch (error: any) {
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
    // Case-insensitive check
    const exists = await School.findOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });
    if (exists) {
      throw new Error('Nama sekolah sudah terdaftar.');
    }

    const newSchool = await School.create({ name: trimmed });
    return { success: true, school: JSON.parse(JSON.stringify(newSchool)) };
  } catch (error: any) {
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
    console.error('Error deleting school:', error);
    return { success: false, error: error.message || 'Gagal menghapus sekolah.' };
  }
}
