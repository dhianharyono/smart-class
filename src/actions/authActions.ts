'use server';

import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import AdminUser from '@/models/AdminUser';
import { hashPassword, verifyPassword } from '@/lib/password';
import { signSession, verifySession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';
import { verifyRecaptchaToken, isRecaptchaConfigured } from '@/lib/recaptcha';

import { sendVerificationEmail } from '@/lib/email';
import { ensureSchoolExists } from '@/actions/adminActions';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loginTeacher(data: {
  email: string;
  password: string;
  recaptchaToken?: string;
}) {
  try {
    // 1. Rate Limiting Check (Max 5 attempts per minute)
    const rateLimit = await checkRateLimit('login', 5, 60 * 1000);
    if (!rateLimit.allowed) {
      throw new Error(
        `Terlalu banyak percobaan login. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
      );
    }

    // 2. Strict Google reCAPTCHA Check for Login
    // If token is provided, ALWAYS verify it.
    // If token is omitted, enforce reCAPTCHA if failed attempt count >= 2 (matching client CAPTCHA_THRESHOLD)
    const recaptchaRequired = rateLimit.attemptCount >= 2;
    if (data.recaptchaToken || recaptchaRequired) {
      const recaptchaRes = await verifyRecaptchaToken(data.recaptchaToken);
      if (!recaptchaRes.success) {
        throw new Error(recaptchaRes.error || 'Verifikasi reCAPTCHA gagal.');
      }
    }

    await dbConnect();
    const { email: loginInput, password } = data;

    if (!loginInput || !password) {
      throw new Error('Username/email dan password wajib diisi.');
    }

    const normalizedInput = loginInput.toLowerCase().trim();

    // Query teacher by either email OR username
    const teacher = await Teacher.findOne({
      $or: [{ email: normalizedInput }, { username: normalizedInput }],
    });

    if (!teacher) {
      throw new Error('Username/email atau password salah.');
    }

    const isPasswordValid = verifyPassword(password, teacher.password);
    if (!isPasswordValid) {
      throw new Error('Username/email atau password salah.');
    }

    // Check if user's email is verified
    if (teacher.isEmailVerified === false && teacher.emailVerificationToken) {
      return {
        success: false,
        requiresEmailVerification: true,
        email: teacher.email,
        error:
          'Email Anda belum diverifikasi. Silakan masukkan kode OTP yang telah dikirim ke email Anda.',
      };
    }

    // Check if user is an admin
    const isAdminUser = await AdminUser.exists({
      $or: [{ username: teacher.email }, { username: teacher.username || '' }],
    });

    // Sign session token including tokenVersion for revocation support
    const token = await signSession({
      userId: teacher._id.toString(),
      email: teacher.email,
      name: teacher.name,
      isAdmin: !!isAdminUser,
      tokenVersion: teacher.tokenVersion || 0,
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
  username: string;
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
      throw new Error(
        `Terlalu banyak percobaan pendaftaran. Silakan coba lagi dalam ${rateLimit.retryAfterSeconds} detik.`,
      );
    }

    // 2. Google reCAPTCHA Check for Registration (Always required)
    const recaptchaRes = await verifyRecaptchaToken(data.recaptchaToken);
    if (!recaptchaRes.success) {
      throw new Error(recaptchaRes.error || 'Verifikasi reCAPTCHA gagal.');
    }

    await dbConnect();
    const { name, username, email, password, schoolName, className } = data;

    if (!name || !username || !email || !password) {
      throw new Error('Nama, username, email, dan password wajib diisi.');
    }

    const normalizedUsername = username.toLowerCase().trim();
    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
    if (!USERNAME_REGEX.test(normalizedUsername)) {
      throw new Error(
        'Username hanya boleh berisi huruf, angka, dan garis bawah (_) minimal 3-20 karakter.',
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      throw new Error(
        'Format email tidak valid. Silakan gunakan alamat email yang aktif (misal: nama@gmail.com).',
      );
    }

    if (password.length < 6) {
      throw new Error('Password minimal harus 6 karakter.');
    }

    if (!/[a-zA-Z]/.test(password)) {
      throw new Error('Password harus mengandung setidaknya 1 huruf.');
    }

    if (!/\d/.test(password)) {
      throw new Error('Password harus mengandung setidaknya 1 angka.');
    }

    // Check if username is already taken by another teacher
    const usernameExists = await Teacher.findOne({
      username: normalizedUsername,
    });
    if (usernameExists) {
      throw new Error(
        'Username ini sudah digunakan. Silakan pilih username lain.',
      );
    }

    const existingEmail = await Teacher.findOne({ email: normalizedEmail });
    if (existingEmail) {
      throw new Error('Email ini sudah terdaftar. Silakan login.');
    }

    const hashedPassword = hashPassword(password);

    let trimmedSchoolName = schoolName?.trim();
    if (trimmedSchoolName) {
      const schoolObj = await ensureSchoolExists(trimmedSchoolName);
      if (schoolObj?.name) {
        trimmedSchoolName = schoolObj.name;
      }
    }

    // Cryptographically secure 6-digit OTP code using Node.js CSPRNG (crypto.randomInt)
    const otpCode = crypto.randomInt(100000, 1000000).toString();

    const newTeacher = new Teacher({
      name: name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      schoolName: trimmedSchoolName,
      className: className?.trim(),
      isFirstLogin: true,
      isEmailVerified: false,
      emailVerificationToken: otpCode,
      emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      tokenVersion: 0,
      enabledMenus: [
        '/dashboard',
        '/siswa',
        '/absensi',
        '/nilai',
        '/tabungan',
        '/jurnal',
      ],
    });
    await newTeacher.save();

    // Kirim email verifikasi OTP via Nodemailer
    const emailResult = await sendVerificationEmail({
      to: newTeacher.email,
      name: newTeacher.name,
      otp: otpCode,
    });

    let message =
      'Pendaftaran berhasil! Silakan periksa inbox / folder Spam email Anda untuk kode OTP verifikasi.';
    if (!emailResult.success) {
      console.warn('Gagal mengirim email verifikasi:', emailResult.error);
      message = `Pendaftaran berhasil! Namun email OTP gagal terkirim: ${emailResult.error}. Silakan klik kirim ulang OTP.`;
    }

    return {
      success: true,
      requiresEmailVerification: true,
      email: newTeacher.email,
      message,
    };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal mendaftar.' };
  }
}

export async function verifyEmailOTP(data: { email: string; otp: string }) {
  try {
    const normalizedInput = data.email ? data.email.toLowerCase().trim() : '';

    // 1. IP-based Rate Limiting (Max 5 attempts / min)
    const ipRateLimit = await checkRateLimit('verify_otp_ip', 5, 60 * 1000);
    if (!ipRateLimit.allowed) {
      throw new Error(
        `Terlalu banyak percobaan verifikasi OTP. Silakan coba lagi dalam ${ipRateLimit.retryAfterSeconds} detik.`,
      );
    }

    // 2. Email-based Rate Limiting (Max 5 attempts / min per email account)
    if (normalizedInput) {
      const emailRateLimit = await checkRateLimit(`verify_otp_email:${normalizedInput}`, 5, 60 * 1000);
      if (!emailRateLimit.allowed) {
        throw new Error(
          `Terlalu banyak percobaan verifikasi OTP untuk akun ini. Silakan coba lagi dalam ${emailRateLimit.retryAfterSeconds} detik.`,
        );
      }
    }

    await dbConnect();
    const teacher = await Teacher.findOne({
      $or: [{ email: normalizedInput }, { username: normalizedInput }],
    });

    if (!teacher) {
      throw new Error(
        'Pengguna tidak ditemukan. Silakan periksa kembali email atau username Anda.',
      );
    }

    if (!teacher.isEmailVerified) {
      const dbOtp = String(teacher.emailVerificationToken || '').trim();
      const userOtp = String(data.otp || '').trim();

      if (!dbOtp || !userOtp || dbOtp.length !== userOtp.length) {
        throw new Error(
          'Kode OTP verifikasi tidak cocok. Periksa kembali email Anda.',
        );
      }

      // Timing-safe comparison to prevent timing side-channel attacks on OTP check
      const dbOtpBuf = Buffer.from(dbOtp);
      const userOtpBuf = Buffer.from(userOtp);
      if (!crypto.timingSafeEqual(dbOtpBuf, userOtpBuf)) {
        throw new Error(
          'Kode OTP verifikasi tidak cocok. Periksa kembali email Anda.',
        );
      }

      if (
        teacher.emailVerificationExpires &&
        new Date(teacher.emailVerificationExpires) < new Date()
      ) {
        throw new Error(
          'Kode OTP telah kadaluarsa. Silakan minta kode verifikasi baru.',
        );
      }

      // Mark as verified
      teacher.isEmailVerified = true;
      teacher.emailVerificationToken = undefined;
      teacher.emailVerificationExpires = undefined;
      await teacher.save();
    }

    // Check if user is an admin
    const isAdminUser = await AdminUser.exists({
      $or: [{ username: teacher.email }, { username: teacher.username || '' }],
    });

    // Sign session token including tokenVersion
    const token = await signSession({
      userId: teacher._id.toString(),
      email: teacher.email,
      name: teacher.name,
      isAdmin: !!isAdminUser,
      tokenVersion: teacher.tokenVersion || 0,
    });

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
    return {
      success: false,
      error: error.message || 'Gagal memverifikasi OTP.',
    };
  }
}

export async function resendVerificationOTP(data: { email: string }) {
  try {
    const normalizedInput = data.email ? data.email.toLowerCase().trim() : '';

    // 1. IP-based Rate Limiting for resend (Max 3 attempts per minute)
    const ipRateLimit = await checkRateLimit('resend_otp_ip', 3, 60 * 1000);
    if (!ipRateLimit.allowed) {
      throw new Error(
        `Terlalu banyak permintaan kode OTP. Silakan coba lagi dalam ${ipRateLimit.retryAfterSeconds} detik.`,
      );
    }

    // 2. Email-based Rate Limiting for resend (Max 3 attempts per minute per email)
    if (normalizedInput) {
      const emailRateLimit = await checkRateLimit(`resend_otp_email:${normalizedInput}`, 3, 60 * 1000);
      if (!emailRateLimit.allowed) {
        throw new Error(
          `Terlalu banyak permintaan kode OTP untuk email ini. Silakan coba lagi dalam ${emailRateLimit.retryAfterSeconds} detik.`,
        );
      }
    }

    await dbConnect();
    const teacher = await Teacher.findOne({
      $or: [{ email: normalizedInput }, { username: normalizedInput }],
    });

    if (!teacher) {
      throw new Error('Pengguna tidak ditemukan.');
    }

    if (teacher.isEmailVerified) {
      throw new Error('Email Anda sudah terverifikasi.');
    }

    // Cryptographically secure 6-digit OTP code using CSPRNG (crypto.randomInt)
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    teacher.emailVerificationToken = otpCode;
    teacher.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
    await teacher.save();

    const emailResult = await sendVerificationEmail({
      to: teacher.email,
      name: teacher.name,
      otp: otpCode,
    });
    if (!emailResult.success) {
      throw new Error(`Gagal mengirim email: ${emailResult.error}`);
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Gagal mengirim ulang kode OTP.',
    };
  }
}

export async function logoutTeacher() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (token) {
      const payload = await verifySession(token);
      if (payload?.userId) {
        await dbConnect();
        // Increment tokenVersion in database to invalidate all active JWT tokens for this user
        await Teacher.findByIdAndUpdate(payload.userId, { $inc: { tokenVersion: 1 } });
      }
    }
    cookieStore.delete('session');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Gagal logout.' };
  }
}

export async function getCurrentUserSession() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;
    const payload = await verifySession(token);
    if (!payload || !payload.userId) return null;
    return {
      userId: payload.userId as string,
      name: (payload.name as string) || '',
      email: (payload.email as string) || '',
      isAdmin: !!payload.isAdmin,
      tokenVersion: payload.tokenVersion ?? 0,
    };
  } catch (error) {
    return null;
  }
}
