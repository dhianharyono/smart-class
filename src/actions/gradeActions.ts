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

export async function getAllGradesRecap(subject: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const students = await Student.find({ teacherId }).sort({ name: 1 }).lean();

    const grades = await Grade.find({
      teacherId,
      subject,
    }).lean();

    const gradeMap = new Map<string, { Tugas?: number; UH?: number; UTS?: number; UAS?: number }>();

    for (const g of grades) {
      const sId = g.studentId.toString();
      if (!gradeMap.has(sId)) {
        gradeMap.set(sId, {});
      }
      const item = gradeMap.get(sId)!;
      if (g.category === 'Tugas') item.Tugas = g.score;
      if (g.category === 'UH') item.UH = g.score;
      if (g.category === 'UTS') item.UTS = g.score;
      if (g.category === 'UAS') item.UAS = g.score;
    }

    const result = students.map((student) => {
      const sId = student._id.toString();
      const stGrades = gradeMap.get(sId) || {};

      const tugas = stGrades.Tugas ?? '';
      const uh = stGrades.UH ?? '';
      const uts = stGrades.UTS ?? '';
      const uas = stGrades.UAS ?? '';

      const validScores: number[] = [];
      if (tugas !== '') validScores.push(Number(tugas));
      if (uh !== '') validScores.push(Number(uh));
      if (uts !== '') validScores.push(Number(uts));
      if (uas !== '') validScores.push(Number(uas));

      const finalScore =
        validScores.length > 0
          ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1))
          : '';

      return {
        studentId: sId,
        name: student.name,
        nis: student.nis,
        className: student.className,
        tugas,
        uh,
        uts,
        uas,
        finalScore,
      };
    });

    return JSON.parse(JSON.stringify(result));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching grades recap:', error);
    throw new Error(error.message || 'Failed to fetch grades recap.');
  }
}

export async function getAllSubjectsGradesRecap() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const students = await Student.find({ teacherId }).sort({ name: 1 }).lean();

    const defaultSubjects = ['Matematika', 'IPA', 'IPS', 'Bahasa Indonesia', 'Bahasa Inggris', 'Pendidikan Pancasila'];
    const distinctSubjects = await Grade.distinct('subject', { teacherId });
    const subjects = Array.from(new Set([...defaultSubjects, ...distinctSubjects])).sort();

    const grades = await Grade.find({ teacherId }).lean();

    const studentSubjectMap = new Map<string, Map<string, number[]>>();

    for (const g of grades) {
      const sId = g.studentId.toString();
      const subj = g.subject;
      if (!studentSubjectMap.has(sId)) {
        studentSubjectMap.set(sId, new Map());
      }
      const subjMap = studentSubjectMap.get(sId)!;
      if (!subjMap.has(subj)) {
        subjMap.set(subj, []);
      }
      subjMap.get(subj)!.push(g.score);
    }

    const result = students.map((student) => {
      const sId = student._id.toString();
      const subjMap = studentSubjectMap.get(sId);

      const subjectScores: Record<string, number | ''> = {};
      const allSubjectFinalScores: number[] = [];

      for (const subj of subjects) {
        const scores = subjMap?.get(subj);
        if (scores && scores.length > 0) {
          const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1));
          subjectScores[subj] = avg;
          allSubjectFinalScores.push(avg);
        } else {
          subjectScores[subj] = '';
        }
      }

      const overallAverage =
        allSubjectFinalScores.length > 0
          ? Number((allSubjectFinalScores.reduce((a, b) => a + b, 0) / allSubjectFinalScores.length).toFixed(1))
          : '';

      return {
        studentId: sId,
        name: student.name,
        nis: student.nis,
        className: student.className,
        subjectScores,
        overallAverage,
      };
    });

    return JSON.parse(JSON.stringify({ subjects, recap: result }));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching all subjects grades recap:', error);
    throw new Error(error.message || 'Failed to fetch all subjects grades recap.');
  }
}


