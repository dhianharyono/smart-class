'use server';

import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Grade from '@/models/Grade';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
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


export async function getSubjects() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const subjects = await Grade.distinct('subject', { teacherId });
    // Return default subjects if none exist to get the user started
    if (subjects.length === 0) {
      return ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pendidikan Pancasila'];
    }
    return subjects.sort();
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching subjects:', error);
    throw new Error(error.message || 'Failed to fetch subjects.');
  }
}

export async function getGradesByFilter(subject: string, category: 'Tugas' | 'UH' | 'UTS' | 'UAS') {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    // Fetch all students
    const students = await Student.find({ teacherId }).sort({ name: 1 }).lean();

    // Fetch grades matching subject and category
    const grades = await Grade.find({
      teacherId,
      subject,
      category,
    }).lean();

    const gradeMap = new Map(
      grades.map((g) => [g.studentId.toString(), g.score])
    );

    const result = students.map((student) => ({
      studentId: student._id.toString(),
      name: student.name,
      nis: student.nis,
      className: student.className,
      score: gradeMap.has(student._id.toString()) ? gradeMap.get(student._id.toString()) : '',
    }));

    return JSON.parse(JSON.stringify(result));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching grades:', error);
    throw new Error(error.message || 'Failed to fetch grades.');
  }
}

export async function saveBulkGrades(
  subject: string,
  category: 'Tugas' | 'UH' | 'UTS' | 'UAS',
  grades: { studentId: string; score: number | '' }[]
) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    // Verify student ownership to prevent cross-tenant parameter tampering
    const teacherStudents = await Student.find({ teacherId }).select('_id').lean();
    const validStudentSet = new Set(teacherStudents.map((s) => s._id.toString()));

    const bulkOps = [];
    const deleteIds: string[] = [];

    for (const rec of grades) {
      if (!validStudentSet.has(rec.studentId)) {
        continue;
      }
      if (rec.score === '') {
        // If score is cleared, delete the entry
        deleteIds.push(rec.studentId);
      } else {
        const scoreVal = Number(rec.score);
        if (scoreVal < 0 || scoreVal > 100 || isNaN(scoreVal)) {
          throw new Error('Semua nilai harus berupa angka antara 0 dan 100.');
        }

        bulkOps.push({
          updateOne: {
            filter: { studentId: rec.studentId, subject, category, teacherId },
            update: {
              $set: {
                score: scoreVal,
                date: new Date(),
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Grade.bulkWrite(bulkOps);
    }

    if (deleteIds.length > 0) {
      await Grade.deleteMany({
        studentId: { $in: deleteIds },
        subject,
        category,
        teacherId,
      });
    }

    revalidatePath('/nilai');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error saving grades:', error);
    throw new Error(error.message || 'Failed to save grades.');
  }
}
