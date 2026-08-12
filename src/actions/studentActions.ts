'use server';

import dbConnect from '@/lib/db';
import Student, { IStudent } from '@/models/Student';
import Attendance from '@/models/Attendance';
import Grade from '@/models/Grade';
import Saving from '@/models/Saving';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from '@/lib/utils';
import Teacher from '@/models/Teacher';
import { studentSchema, updateStudentSchema, objectIdSchema } from '@/lib/validations';

// Helper to authenticate teacher and return teacherId
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

export async function getStudents() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    const teacher = await Teacher.findById(teacherId).lean();
    const activeClass = teacher?.activeClass || teacher?.className || '';

    const filter: any = { teacherId };
    if (activeClass) {
      filter.$or = [{ className: activeClass }, { className: { $exists: false } }, { className: '' }];
    }

    const students = await Student.find(filter).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(students));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching students:', error);
    throw new Error(error.message || 'Failed to fetch students.');
  }
}

export async function getStudentById(id: string) {
  try {
    const idValidation = objectIdSchema.safeParse(id);
    if (!idValidation.success) {
      throw new Error('ID siswa tidak valid.');
    }

    await dbConnect();
    const teacherId = await requireAuth();
    const student = await Student.findOne({ _id: id, teacherId }).lean();
    if (!student) {
      throw new Error('Siswa tidak ditemukan.');
    }
    return JSON.parse(JSON.stringify(student));
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error fetching student by ID:', error);
    throw new Error(error.message || 'Failed to fetch student details.');
  }
}

export async function createStudent(rawData: Partial<IStudent>) {
  try {
    const parseResult = studentSchema.safeParse(rawData);
    if (!parseResult.success) {
      throw new Error(parseResult.error.issues[0]?.message || 'Data siswa tidak valid.');
    }
    const data = parseResult.data;

    await dbConnect();
    const teacherId = await requireAuth();
    const teacher = await Teacher.findById(teacherId).lean();
    const activeClass = teacher?.activeClass || teacher?.className || data.className || '';

    // Check for NIS duplicate for this teacher in this class
    const existing = await Student.findOne({ teacherId, nis: data.nis, className: activeClass });
    if (existing) {
      throw new Error(`Siswa dengan NIS ${data.nis} sudah ada di Kelas ${activeClass}.`);
    }

    const newStudent = new Student({
      ...data,
      teacherId,
      className: data.className || activeClass,
    });

    await newStudent.save();
    revalidatePath('/siswa');
    revalidatePath('/');
    return { success: true, id: newStudent._id.toString() };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error creating student:', error);
    throw new Error(error.message || 'Failed to create student.');
  }
}

export async function updateStudent(id: string, rawData: Partial<IStudent>) {
  try {
    const idValidation = objectIdSchema.safeParse(id);
    if (!idValidation.success) {
      throw new Error('ID siswa tidak valid.');
    }

    const parseResult = updateStudentSchema.safeParse(rawData);
    if (!parseResult.success) {
      throw new Error(parseResult.error.issues[0]?.message || 'Data pembaharuan tidak valid.');
    }
    const data = parseResult.data;

    await dbConnect();
    const teacherId = await requireAuth();

    // Verify ownership
    const student = await Student.findOne({ _id: id, teacherId });
    if (!student) {
      throw new Error('Siswa tidak ditemukan atau Anda tidak memiliki akses.');
    }

    if (data.nis) {
      // Check for NIS duplicate on other students
      const existing = await Student.findOne({ teacherId, nis: data.nis, _id: { $ne: id } });
      if (existing) {
        throw new Error(`NIS ${data.nis} sudah digunakan oleh siswa lain.`);
      }
    }

    Object.assign(student, data);

    await student.save();
    revalidatePath('/siswa');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error updating student:', error);
    throw new Error(error.message || 'Failed to update student.');
  }
}

export async function deleteStudent(id: string) {
  try {
    const idValidation = objectIdSchema.safeParse(id);
    if (!idValidation.success) {
      throw new Error('ID siswa tidak valid.');
    }

    await dbConnect();
    const teacherId = await requireAuth();

    // Verify ownership
    const student = await Student.findOne({ _id: id, teacherId });
    if (!student) {
      throw new Error('Siswa tidak ditemukan atau Anda tidak memiliki akses.');
    }

    // Delete student
    await Student.deleteOne({ _id: id });

    // Cascading deletes for related collections
    await Attendance.deleteMany({ studentId: id });
    await Grade.deleteMany({ studentId: id });
    await Saving.deleteMany({ studentId: id });

    revalidatePath('/siswa');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    if (isRedirectError(error)) {
      throw error;
    }
    console.error('Error deleting student:', error);
    throw new Error(error.message || 'Failed to delete student.');
  }
}
