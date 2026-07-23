'use server';

import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import AdminUser from '@/models/AdminUser';
import School from '@/models/School';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { escapeRegExp } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyRecaptchaToken } from '@/lib/recaptcha';

export async function loginTeacher(data: { email: string; password: string; recaptchaToken?: string }) {
  try {
    // 1. Rate Limiting Check (Max 5 attempts per minute)
    const rateLimit = await checkRateLimit('login', 5, 60 * 1000);
    if (!rateLimit.allowed) {
      throw new Error(`Terlalu banyak percobaan login. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`);
    }

    // 2. Google reCAPTCHA Check
    const recaptchaRes = await verifyRecaptchaToken(data.recaptchaToken);
    if (!recaptchaRes.success) {
      throw new Error(recaptchaRes.error || 'Verifikasi reCAPTCHA gagal.');
    }

    await dbConnect();
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Email dan password wajib diisi.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const teacher = await Teacher.findOne({ email: normalizedEmail });
    if (!teacher) {
      throw new Error('Email atau password salah.');
    }

    const isPasswordValid = verifyPassword(password, teacher.password);
    if (!isPasswordValid) {
      throw new Error('Email atau password salah.');
    }

    // Check if user is an admin
    const isAdminUser = await AdminUser.exists({ username: normalizedEmail });

    // Sign session token
    const token = await signSession({
      userId: teacher._id.toString(),
      email: teacher.email,
      name: teacher.name,
      isAdmin: !!isAdminUser,
    });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true, isAdmin: !!isAdminUser };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal login.' };
  }
}

export async function registerTeacher(data: {
  name: string;
  email: string;
  password: string;
  schoolName?: string;
  className?: string;
  recaptchaToken?: string;
}) {
  try {
    // 1. Rate Limiting Check (Max 5 attempts per minute)
    const rateLimit = await checkRateLimit('register', 5, 60 * 1000);
    if (!rateLimit.allowed) {
      throw new Error(`Terlalu banyak percobaan pendaftaran. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`);
    }

    // 2. Google reCAPTCHA Check
    const recaptchaRes = await verifyRecaptchaToken(data.recaptchaToken);
    if (!recaptchaRes.success) {
      throw new Error(recaptchaRes.error || 'Verifikasi reCAPTCHA gagal.');
    }

    await dbConnect();
    const { name, email, password, schoolName, className } = data;

    if (!name || !email || !password) {
      throw new Error('Nama, email, dan password wajib diisi.');
    }

    if (password.length < 6) {
      throw new Error('Password minimal harus 6 karakter.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await Teacher.findOne({ email: normalizedEmail });
    if (existing) {
      throw new Error('Email sudah terdaftar. Silakan login.');
    }

    const hashedPassword = hashPassword(password);

    let trimmedSchoolName = schoolName?.trim();
    if (trimmedSchoolName) {
      // Check if school already exists (case-insensitive)
      const safePattern = escapeRegExp(trimmedSchoolName);
      const schoolExists = await School.findOne({ name: { $regex: new RegExp(`^${safePattern}$`, 'i') } });
      if (!schoolExists) {
        await School.create({ name: trimmedSchoolName });
      } else {
        trimmedSchoolName = schoolExists.name;
      }
    }

    const newTeacher = new Teacher({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      schoolName: trimmedSchoolName,
      className: className?.trim(),
      isFirstLogin: true,
      enabledMenus: ['/dashboard', '/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal'],
    });

    await newTeacher.save();

    // Check if user is an admin
    const isAdminUser = await AdminUser.exists({ username: normalizedEmail });

    // Sign session token
    const token = await signSession({
      userId: newTeacher._id.toString(),
      email: newTeacher.email,
      name: newTeacher.name,
      isAdmin: !!isAdminUser,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true, isAdmin: !!isAdminUser };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mendaftar.' };
  }
}

export async function logoutTeacher() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal logout.' };
  }
}
