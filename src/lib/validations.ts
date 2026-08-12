import { z } from 'zod';

/**
 * MongoDB ObjectId string validation helper
 */
export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'ID tidak valid');

/**
 * Authentication Schemas
 */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Username/email wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
  recaptchaToken: z.string().trim().optional(),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(100, 'Nama terlalu panjang.'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-zA-Z0-9_]{3,20}$/, 'Username hanya boleh berisi huruf, angka, dan garis bawah (_) 3-20 karakter.'),
  email: z.string().trim().toLowerCase().email('Format email tidak valid.'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter.')
    .refine((val) => /[a-zA-Z]/.test(val), 'Password harus mengandung setidaknya 1 huruf.')
    .refine((val) => /\d/.test(val), 'Password harus mengandung setidaknya 1 angka.'),
  schoolName: z.string().trim().optional(),
  className: z.string().trim().optional(),
  recaptchaToken: z.string().trim().optional(),
});

export const verifyOTPSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi.'),
  otp: z.string().trim().length(6, 'Kode OTP harus 6 digit angka.'),
});

export const resendOTPSchema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi.'),
});

/**
 * Student Schemas
 */
export const studentSchema = z.object({
  nis: z.string().trim().min(1, 'NIS wajib diisi.'),
  name: z.string().trim().min(1, 'Nama siswa wajib diisi.'),
  gender: z.enum(['L', 'P'], { message: 'Jenis kelamin harus L atau P.' }),
  className: z.string().trim().optional(),
});

export const updateStudentSchema = studentSchema.partial();

/**
 * Profile & Password Schemas
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password saat ini wajib diisi.'),
  newPassword: z
    .string()
    .min(6, 'Password baru minimal 6 karakter.')
    .refine((val) => /[a-zA-Z]/.test(val), 'Password baru harus mengandung setidaknya 1 huruf.')
    .refine((val) => /\d/.test(val), 'Password baru harus mengandung setidaknya 1 angka.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi.').optional(),
  nip: z.string().trim().optional(),
  schoolName: z.string().trim().optional(),
  principalName: z.string().trim().optional(),
  principalNip: z.string().trim().optional(),
  kkm: z.number().min(0).max(100).optional(),
});

/**
 * Feedback / Kritik & Saran Schemas
 */
export const feedbackSchema = z.object({
  category: z.enum(['Kritik', 'Saran', 'Laporan Bug', 'Pertanyaan', 'Lainnya'], {
    message: 'Kategori masukan tidak valid',
  }),
  subject: z
    .string()
    .trim()
    .min(3, 'Judul minimal 3 karakter.')
    .max(150, 'Judul maksimal 150 karakter.'),
  content: z
    .string()
    .trim()
    .min(10, 'Isi masukan minimal 10 karakter.')
    .max(2000, 'Isi masukan terlalu panjang (maksimal 2000 karakter).'),
  rating: z.number().min(1).max(5).optional(),
});

export const respondFeedbackSchema = z.object({
  feedbackId: objectIdSchema,
  status: z.enum(['Pending', 'Diproses', 'Selesai']),
  adminResponse: z.string().trim().max(2000, 'Tanggapan terlalu panjang (maksimal 2000 karakter).').optional(),
});

