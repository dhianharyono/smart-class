'use server';

import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function loginTeacher(data: { email: string; password: string }) {
  try {
    await dbConnect();
    const { email, password } = data;

    if (!email || !password) {
      throw new Error('Email dan password wajib diisi.');
    }

    const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
    if (!teacher) {
      throw new Error('Email atau password salah.');
    }

    const isPasswordValid = verifyPassword(password, teacher.password);
    if (!isPasswordValid) {
      throw new Error('Email atau password salah.');
    }

    // Sign session token
    const token = await signSession({
      userId: teacher._id.toString(),
      email: teacher.email,
      name: teacher.name,
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

    return { success: true };
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
}) {
  try {
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

    const newTeacher = new Teacher({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      schoolName: schoolName?.trim(),
      className: className?.trim(),
    });

    await newTeacher.save();

    // Sign session token
    const token = await signSession({
      userId: newTeacher._id.toString(),
      email: newTeacher.email,
      name: newTeacher.name,
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

    return { success: true };
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
