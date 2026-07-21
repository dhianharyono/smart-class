'use server';

import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import JournalHeader from '@/models/JournalHeader';
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

const DEFAULT_MENUS = ['/', '/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal'];

export async function getProfile() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const teacher = await Teacher.findById(teacherId).lean();
    if (!teacher) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    return JSON.parse(
      JSON.stringify({
        _id: teacher._id.toString(),
        name: teacher.name,
        email: teacher.email,
        schoolName: teacher.schoolName || '',
        className: teacher.className || '',
        nip: teacher.nip || '-',
        isFirstLogin: teacher.isFirstLogin ?? false,
        enabledMenus: teacher.enabledMenus && teacher.enabledMenus.length > 0 ? teacher.enabledMenus : DEFAULT_MENUS,
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
  nip?: string;
}) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    if (!data.name || !data.email) {
      throw new Error('Nama dan Email wajib diisi.');
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
          className: data.className?.trim() || '',
          nip: data.nip?.trim() || '-',
        },
      },
      { new: true }
    );

    // Sync teacher name & NIP to JournalHeader as well if it exists
    await JournalHeader.findOneAndUpdate(
      { teacherId },
      {
        $set: {
          teacherName: data.name.trim(),
          nip: data.nip?.trim() || '-',
          schoolName: data.schoolName?.trim() || '',
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
    revalidatePath('/profile');

    return { success: true, enabledMenus: finalMenus };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating menu preferences:', error);
    throw new Error(error.message || 'Gagal menyimpan pengaturan menu.');
  }
}
