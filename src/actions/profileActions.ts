'use server';

import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import JournalHeader from '@/models/JournalHeader';
import Student from '@/models/Student';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';
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

const DEFAULT_MENUS = ['/', '/kelas', '/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal'];

export async function getProfile() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const fallbackClassName = teacher.className || '';
    const rawClasses = Array.isArray(teacher.classes) && teacher.classes.length > 0
      ? teacher.classes.filter(Boolean)
      : (fallbackClassName ? [fallbackClassName] : []);
    const classes = Array.from(new Set(rawClasses));

    const activeClass = (teacher.activeClass && classes.includes(teacher.activeClass))
      ? teacher.activeClass
      : (classes[0] || fallbackClassName);

    const rawEnabled = teacher.enabledMenus && teacher.enabledMenus.length > 0 ? teacher.enabledMenus : DEFAULT_MENUS;
    const enabledMenus = rawEnabled.includes('/kelas') ? rawEnabled : [...rawEnabled, '/kelas'];

    return JSON.parse(
      JSON.stringify({
        _id: teacher._id.toString(),
        name: teacher.name,
        email: teacher.email,
        schoolName: teacher.schoolName || '',
        className: activeClass || fallbackClassName,
        classes,
        activeClass,
        nip: teacher.nip || '-',
        principalName: teacher.principalName || '',
        principalNip: teacher.principalNip || '-',
        isFirstLogin: teacher.isFirstLogin ?? false,
        enabledMenus,
      })
    );
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching profile:', error);
    throw new Error(error.message || 'Gagal mengambil data profil.');
  }
}

export async function updateProfile(data: {
  name: string;
  email: string;
  schoolName?: string;
  className?: string;
  classes?: string[];
  activeClass?: string;
  nip?: string;
  principalName?: string;
  principalNip?: string;
}) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    if (!data.name || data.name.trim().length < 3) {
      throw new Error('Nama lengkap & gelar minimal 3 karakter.');
    }

    if (!data.email || !data.email.trim()) {
      throw new Error('Alamat Email wajib diisi.');
    }

    if (!data.schoolName || data.schoolName.trim().length < 3) {
      throw new Error('Nama sekolah wajib diisi minimal 3 karakter.');
    }

    const rawClasses = Array.isArray(data.classes) && data.classes.length > 0
      ? data.classes.map((c) => c.trim()).filter(Boolean)
      : (data.className?.trim() ? [data.className.trim()] : []);
    
    const uniqueClasses = Array.from(new Set(rawClasses));
    if (uniqueClasses.length === 0) {
      throw new Error('Setidaknya 1 kelas diajar wajib dimasukkan.');
    }

    const selectedActiveClass = data.activeClass && uniqueClasses.includes(data.activeClass.trim())
      ? data.activeClass.trim()
      : uniqueClasses[0];

    if (!data.nip || data.nip.trim() === '-' || data.nip.trim().length < 3) {
      throw new Error('NIP/NUPTK Guru wajib diisi dengan NIP/NUPTK yang valid (tidak boleh "-").');
    }

    if (!data.principalName || data.principalName.trim().length < 3) {
      throw new Error('Nama Kepala Sekolah minimal 3 karakter.');
    }

    if (!data.principalNip || data.principalNip.trim() === '-' || data.principalNip.trim().length < 3) {
      throw new Error('NIP Kepala Sekolah wajib diisi dengan NIP yang valid (tidak boleh "-").');
    }

    const normalizedEmail = data.email.toLowerCase().trim();

    // Check email uniqueness if email changed
    const existing = await Teacher.findOne({
      email: normalizedEmail,
      _id: { $ne: teacherId },
    });
    if (existing) {
      throw new Error('Email sudah digunakan oleh akun lain.');
    }

    const updatedTeacher = await Teacher.findByIdAndUpdate(
      teacherId,
      {
        $set: {
          name: data.name.trim(),
          email: normalizedEmail,
          schoolName: data.schoolName?.trim() || '',
          className: selectedActiveClass,
          classes: uniqueClasses,
          activeClass: selectedActiveClass,
          nip: data.nip.trim(),
          principalName: data.principalName?.trim() || '',
          principalNip: data.principalNip.trim(),
        },
      },
      { new: true, runValidators: true }
    );

    // Sync teacher name, NIP & supervisor info to JournalHeader as well if it exists
    await JournalHeader.findOneAndUpdate(
      { teacherId },
      {
        $set: {
          teacherName: data.name.trim(),
          nip: data.nip.trim(),
          schoolName: data.schoolName?.trim() || '',
          supervisorName: data.principalName?.trim() || '',
          supervisorNip: data.principalNip.trim(),
        },
      }
    );

    revalidatePath('/profile');
    revalidatePath('/');
    revalidatePath('/jurnal');

    return {
      success: true,
      teacher: JSON.parse(JSON.stringify(updatedTeacher)),
    };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating profile:', error);
    throw new Error(error.message || 'Gagal memperbarui profil.');
  }
}

export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    if (!data.currentPassword || !data.newPassword) {
      throw new Error('Password lama dan password baru wajib diisi.');
    }

    if (data.newPassword.length < 6) {
      throw new Error('Password baru minimal 6 karakter.');
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const isValid = verifyPassword(data.currentPassword, teacher.password);
    if (!isValid) {
      throw new Error('Password saat ini salah.');
    }

    teacher.password = hashPassword(data.newPassword);
    await teacher.save();

    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error changing password:', error);
    throw new Error(error.message || 'Gagal mengubah password.');
  }
}

export async function updateMenuPreferences(
  enabledMenus: string[],
  isFirstLoginDone?: boolean
) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    // Ensure Dashboard '/' is always included
    const finalMenus = Array.from(new Set(['/', ...enabledMenus]));

    const updateObj: any = {
      enabledMenus: finalMenus,
    };

    if (isFirstLoginDone) {
      updateObj.isFirstLogin = false;
    }

    await Teacher.findByIdAndUpdate(teacherId, {
      $set: updateObj,
    });

    revalidatePath('/');
    return { success: true, enabledMenus: finalMenus };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating menu preferences:', error);
    throw new Error(error.message || 'Gagal menyimpan pengaturan menu.');
  }
}

/**
 * Mengganti kelas aktif saat ini untuk wali kelas/guru.
 */
export async function switchActiveClass(newClass: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const cleanClass = newClass?.trim();
    if (!cleanClass) {
      throw new Error('Nama kelas tidak boleh kosong.');
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const rawClasses = Array.isArray(teacher.classes) && teacher.classes.length > 0
      ? teacher.classes
      : (teacher.className ? [teacher.className] : []);
    const classes = Array.from(new Set(rawClasses));

    if (!classes.includes(cleanClass)) {
      classes.push(cleanClass);
    }

    teacher.className = cleanClass;
    teacher.activeClass = cleanClass;
    teacher.classes = classes;
    await teacher.save();

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/kelas');
    revalidatePath('/siswa');
    revalidatePath('/absensi');
    revalidatePath('/nilai');
    revalidatePath('/tabungan');
    revalidatePath('/jurnal');

    return { success: true, activeClass: cleanClass, classes };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error switching active class:', error);
    return { success: false, error: error.message || 'Gagal mengganti kelas aktif.' };
  }
}

/**
 * Menambahkan kelas baru ke daftar kelas yang diampu.
 */
export async function addClass(newClass: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const cleanClass = newClass?.trim();
    if (!cleanClass) {
      throw new Error('Nama kelas tidak boleh kosong.');
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const rawClasses = Array.isArray(teacher.classes) && teacher.classes.length > 0
      ? teacher.classes
      : (teacher.className ? [teacher.className] : []);
    
    const classes = Array.from(new Set([...rawClasses, cleanClass]));

    teacher.className = cleanClass;
    teacher.activeClass = cleanClass;
    teacher.classes = classes;
    await teacher.save();

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/kelas');
    revalidatePath('/siswa');
    revalidatePath('/absensi');
    revalidatePath('/nilai');
    revalidatePath('/tabungan');
    revalidatePath('/jurnal');

    return { success: true, activeClass: cleanClass, classes };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error adding class:', error);
    return { success: false, error: error.message || 'Gagal menambahkan kelas baru.' };
  }
}

/**
 * Menghapus kelas dari daftar kelas yang diampu.
 */
export async function deleteClass(classToDelete: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const cleanClass = classToDelete?.trim();
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const rawClasses = Array.isArray(teacher.classes) && teacher.classes.length > 0
      ? teacher.classes
      : (teacher.className ? [teacher.className] : []);
    
    const remainingClasses = rawClasses.filter((c) => c !== cleanClass);

    if (remainingClasses.length === 0) {
      throw new Error('Tidak dapat menghapus kelas terakhir. Minimal harus memiliki 1 kelas.');
    }

    let newActiveClass = teacher.activeClass;
    if (teacher.activeClass === cleanClass || !remainingClasses.includes(teacher.activeClass || '')) {
      newActiveClass = remainingClasses[0];
    }

    teacher.className = newActiveClass;
    teacher.activeClass = newActiveClass;
    teacher.classes = remainingClasses;
    await teacher.save();

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/kelas');
    revalidatePath('/siswa');
    revalidatePath('/absensi');
    revalidatePath('/nilai');
    revalidatePath('/tabungan');
    revalidatePath('/jurnal');

    return { success: true, activeClass: newActiveClass, classes: remainingClasses };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error deleting class:', error);
    return { success: false, error: error.message || 'Gagal menghapus kelas.' };
  }
}

/**
 * Mengubah nama kelas yang diampu dan memperbarui data siswa terkait.
 */
export async function updateClass(oldClassName: string, newClassName: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const oldClean = oldClassName?.trim();
    const newClean = newClassName?.trim();

    if (!oldClean || !newClean) {
      throw new Error('Nama kelas tidak boleh kosong.');
    }

    if (oldClean === newClean) {
      return { success: true, activeClass: newClean };
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    const rawClasses = Array.isArray(teacher.classes) && teacher.classes.length > 0
      ? teacher.classes
      : (teacher.className ? [teacher.className] : []);
    
    const classes = Array.from(new Set(rawClasses));

    if (!classes.includes(oldClean)) {
      throw new Error(`Kelas ${oldClean} tidak ditemukan.`);
    }

    if (classes.some((c) => c !== oldClean && c.toLowerCase() === newClean.toLowerCase())) {
      throw new Error(`Kelas "${newClean}" sudah ada dalam daftar kelas Anda.`);
    }

    // Replace oldClean with newClean in classes array
    const updatedClasses = classes.map((c) => (c === oldClean ? newClean : c));
    teacher.classes = updatedClasses;

    if (teacher.activeClass === oldClean) {
      teacher.activeClass = newClean;
    }
    if (teacher.className === oldClean) {
      teacher.className = newClean;
    }
    await teacher.save();

    // Synchronize Student model records for this teacher & class
    await Student.updateMany(
      { teacherId, className: oldClean },
      { className: newClean }
    );

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/kelas');
    revalidatePath('/siswa');
    revalidatePath('/absensi');
    revalidatePath('/nilai');
    revalidatePath('/tabungan');
    revalidatePath('/jurnal');

    return { success: true, activeClass: teacher.activeClass, classes: updatedClasses };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating class:', error);
    return { success: false, error: error.message || 'Gagal mengubah nama kelas.' };
  }
}

