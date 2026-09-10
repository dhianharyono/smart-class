'use server';

import dbConnect from '@/lib/db';
import Student from '@/models/Student';
import Grade from '@/models/Grade';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from '@/lib/utils';

import Teacher from '@/models/Teacher';

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


const DEFAULT_SUBJECTS = [
  'Matematika',
  'IPA',
  'IPS',
  'Bahasa Indonesia',
  'Bahasa Inggris',
  'Pendidikan Pancasila',
];

export async function getSubjects() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      throw new Error('Data guru tidak ditemukan.');
    }

    if (teacher.subjects && teacher.subjects.length > 0) {
      return teacher.subjects;
    }

    const distinctGrades = await Grade.distinct('subject', { teacherId });
    const initialList = Array.from(new Set([...DEFAULT_SUBJECTS, ...distinctGrades]));
    teacher.subjects = initialList;
    await teacher.save();
    return teacher.subjects;
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching subjects:', error);
    throw new Error(error.message || 'Failed to fetch subjects.');
  }
}

export async function addSubject(name: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const trimmed = name.trim();
    if (!trimmed) {
      return { success: false, error: 'Nama mata pelajaran tidak boleh kosong.' };
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return { success: false, error: 'Data guru tidak ditemukan.' };
    }

    const currentSubjects =
      teacher.subjects && teacher.subjects.length > 0
        ? [...teacher.subjects]
        : [...DEFAULT_SUBJECTS];

    if (currentSubjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: `Mata pelajaran "${trimmed}" sudah ada.` };
    }

    currentSubjects.push(trimmed);
    teacher.subjects = currentSubjects;
    await teacher.save();

    revalidatePath('/nilai');
    return { success: true, subjects: teacher.subjects };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error adding subject:', error);
    return { success: false, error: error.message || 'Gagal menambahkan mata pelajaran.' };
  }
}

export async function renameSubject(oldName: string, newName: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();

    if (!trimmedOld || !trimmedNew) {
      return { success: false, error: 'Nama mata pelajaran tidak boleh kosong.' };
    }

    if (trimmedOld.toLowerCase() === trimmedNew.toLowerCase()) {
      return { success: true };
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return { success: false, error: 'Data guru tidak ditemukan.' };
    }

    const currentSubjects =
      teacher.subjects && teacher.subjects.length > 0
        ? [...teacher.subjects]
        : [...DEFAULT_SUBJECTS];

    if (
      currentSubjects.some(
        (s) =>
          s.toLowerCase() === trimmedNew.toLowerCase() &&
          s.toLowerCase() !== trimmedOld.toLowerCase()
      )
    ) {
      return { success: false, error: `Mata pelajaran "${trimmedNew}" sudah ada.` };
    }

    const updatedSubjects = currentSubjects.map((s) =>
      s === trimmedOld ? trimmedNew : s
    );
    teacher.subjects = updatedSubjects;
    await teacher.save();

    // Update all grades stored under this subject for this teacher
    await Grade.updateMany(
      { teacherId, subject: trimmedOld },
      { $set: { subject: trimmedNew } }
    );

    revalidatePath('/nilai');
    return { success: true, subjects: updatedSubjects };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error renaming subject:', error);
    return { success: false, error: error.message || 'Gagal mengubah nama mata pelajaran.' };
  }
}

export async function deleteSubject(subjectName: string) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const trimmed = subjectName.trim();

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return { success: false, error: 'Data guru tidak ditemukan.' };
    }

    const currentSubjects =
      teacher.subjects && teacher.subjects.length > 0
        ? [...teacher.subjects]
        : [...DEFAULT_SUBJECTS];

    const updatedSubjects = currentSubjects.filter((s) => s !== trimmed);
    teacher.subjects = updatedSubjects;
    await teacher.save();

    // Delete all grade records for this subject and teacher
    await Grade.deleteMany({ teacherId, subject: trimmed });

    revalidatePath('/nilai');
    return { success: true, subjects: updatedSubjects };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error deleting subject:', error);
    return { success: false, error: error.message || 'Gagal menghapus mata pelajaran.' };
  }
}

export async function getGradesByFilter(subject: string, category: 'Tugas' | 'UH' | 'UTS' | 'UAS') {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const teacher = await Teacher.findById(teacherId).lean();
    const activeClass = teacher?.activeClass || teacher?.className || '';

    const studentFilter: any = { teacherId };
    if (activeClass) {
      studentFilter.className = activeClass;
    }

    // Fetch students for active class
    const students = await Student.find(studentFilter).sort({ name: 1 }).lean();

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
    const teacher = await Teacher.findById(teacherId).lean();
    const activeClass = teacher?.activeClass || teacher?.className || '';

    const studentFilter: any = { teacherId };
    if (activeClass) {
      studentFilter.className = activeClass;
    }

    const students = await Student.find(studentFilter).sort({ name: 1 }).lean();

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
    const teacher = await Teacher.findById(teacherId).lean();
    const subjects =
      teacher?.subjects && teacher.subjects.length > 0
        ? teacher.subjects
        : DEFAULT_SUBJECTS;

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


