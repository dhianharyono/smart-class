'use server';

import dbConnect from '@/lib/db';
import Feedback, { IFeedback } from '@/models/Feedback';
import Teacher from '@/models/Teacher';
import AdminUser from '@/models/AdminUser';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError, escapeRegExp } from '@/lib/utils';
import { feedbackSchema, respondFeedbackSchema, objectIdSchema } from '@/lib/validations';

/**
 * Authenticates teacher session and returns teacher user object.
 */
async function requireTeacherAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) {
    redirect('/sign-in');
  }
  const session = await verifySession(sessionToken);
  if (!session || !session.userId) {
    redirect('/sign-in');
  }

  await dbConnect();
  const teacher = await Teacher.findById(session.userId).lean();
  if (!teacher) {
    redirect('/sign-in?clear=1');
  }

  return {
    userId: session.userId,
    teacher,
  };
}

/**
 * Authenticates admin session and returns admin user object.
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

  await dbConnect();
  const adminUser = await Teacher.findById(session.userId).lean();
  if (!adminUser) {
    redirect('/sign-in?clear=1');
  }

  return {
    userId: session.userId,
    adminUser,
  };
}

// ----------------------------------------------------
// TEACHER / WALI KELAS ACTIONS
// ----------------------------------------------------

export async function createFeedback(data: {
  category: string;
  subject: string;
  content: string;
  rating?: number;
}) {
  try {
    const parsed = feedbackSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid.' };
    }

    const { userId, teacher } = await requireTeacherAuth();

    const activeClass = teacher.activeClass || teacher.className || '';
    const schoolName = teacher.schoolName || '';

    const newFeedback = await Feedback.create({
      teacherId: userId,
      teacherName: teacher.name || 'Guru Smart Class',
      teacherEmail: teacher.email,
      schoolName,
      className: activeClass,
      category: parsed.data.category,
      subject: parsed.data.subject,
      content: parsed.data.content,
      rating: parsed.data.rating,
      status: 'Pending',
    });

    revalidatePath('/feedback');
    revalidatePath('/admin/feedback');

    return {
      success: true,
      feedback: JSON.parse(JSON.stringify(newFeedback)),
    };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('Error creating feedback:', error);
    return { success: false, error: error.message || 'Gagal mengirim kritik dan saran.' };
  }
}

export async function getTeacherFeedbacks() {
  try {
    const { userId } = await requireTeacherAuth();

    const feedbacks = await Feedback.find({ teacherId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(feedbacks));
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('Error fetching teacher feedbacks:', error);
    return [];
  }
}

export async function deleteTeacherFeedback(feedbackId: string) {
  try {
    const validId = objectIdSchema.safeParse(feedbackId);
    if (!validId.success) {
      return { success: false, error: 'ID tidak valid.' };
    }

    const { userId } = await requireTeacherAuth();

    const feedback = await Feedback.findOne({ _id: feedbackId, teacherId: userId });
    if (!feedback) {
      return { success: false, error: 'Masukan tidak ditemukan.' };
    }

    if (feedback.status !== 'Pending') {
      return { success: false, error: 'Hanya masukan berstatus Pending yang dapat dihapus.' };
    }

    await Feedback.deleteOne({ _id: feedbackId, teacherId: userId });

    revalidatePath('/feedback');
    revalidatePath('/admin/feedback');

    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('Error deleting teacher feedback:', error);
    return { success: false, error: error.message || 'Gagal menghapus masukan.' };
  }
}

// ----------------------------------------------------
// ADMIN ACTIONS
// ----------------------------------------------------

export async function getAdminFeedbacks(options?: {
  status?: string;
  category?: string;
  search?: string;
}) {
  try {
    await requireAdminAuth();

    const filter: any = {};

    if (options?.status && options.status !== 'all') {
      filter.status = options.status;
    }

    if (options?.category && options.category !== 'all') {
      filter.category = options.category;
    }

    if (options?.search && options.search.trim()) {
      const searchRegex = new RegExp(escapeRegExp(options.search.trim()), 'i');
      filter.$or = [
        { subject: searchRegex },
        { content: searchRegex },
        { teacherName: searchRegex },
        { schoolName: searchRegex },
        { className: searchRegex },
      ];
    }

    const feedbacks = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return JSON.parse(JSON.stringify(feedbacks));
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('Error fetching admin feedbacks:', error);
    return [];
  }
}

export async function getAdminFeedbackStats() {
  try {
    await requireAdminAuth();

    const [total, pending, diproses, selesai] = await Promise.all([
      Feedback.countDocuments({}),
      Feedback.countDocuments({ status: 'Pending' }),
      Feedback.countDocuments({ status: 'Diproses' }),
      Feedback.countDocuments({ status: 'Selesai' }),
    ]);

    return {
      total,
      pending,
      diproses,
      selesai,
    };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('Error getting admin feedback stats:', error);
    return { total: 0, pending: 0, diproses: 0, selesai: 0 };
  }
}

export async function respondToFeedback(data: {
  feedbackId: string;
  status: 'Pending' | 'Diproses' | 'Selesai';
  adminResponse?: string;
}) {
  try {
    const parsed = respondFeedbackSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Data tidak valid.' };
    }

    const { adminUser } = await requireAdminAuth();

    const feedback = await Feedback.findById(parsed.data.feedbackId);
    if (!feedback) {
      return { success: false, error: 'Masukan tidak ditemukan.' };
    }

    feedback.status = parsed.data.status;
    if (parsed.data.adminResponse !== undefined) {
      feedback.adminResponse = parsed.data.adminResponse;
    }
    feedback.respondedAt = new Date();
    feedback.respondedBy = adminUser.name || 'Admin';

    await feedback.save();

    revalidatePath('/feedback');
    revalidatePath('/admin/feedback');

    return {
      success: true,
      feedback: JSON.parse(JSON.stringify(feedback)),
    };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('Error responding to feedback:', error);
    return { success: false, error: error.message || 'Gagal menyimpan tanggapan admin.' };
  }
}

export async function adminDeleteFeedback(feedbackId: string) {
  try {
    const validId = objectIdSchema.safeParse(feedbackId);
    if (!validId.success) {
      return { success: false, error: 'ID tidak valid.' };
    }

    await requireAdminAuth();

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
      return { success: false, error: 'Masukan tidak ditemukan.' };
    }

    await Feedback.deleteOne({ _id: feedbackId });

    revalidatePath('/feedback');
    revalidatePath('/admin/feedback');

    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) throw error;
    console.error('Error deleting feedback by admin:', error);
    return { success: false, error: error.message || 'Gagal menghapus masukan.' };
  }
}
