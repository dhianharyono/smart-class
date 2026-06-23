'use server';

import dbConnect from '@/lib/db';
import Student, { IStudent } from '@/models/Student';
import Attendance from '@/models/Attendance';
import Grade from '@/models/Grade';
import Saving from '@/models/Saving';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Helper to authenticate teacher and return teacherId
async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized access. Please login first.');
  }
  return userId;
}

export async function getStudents() {
  try {
    await dbConnect();
    const teacherId = await requireAuth();
    const students = await Student.find({ teacherId }).sort({ name: 1 }).lean();
    return JSON.parse(JSON.stringify(students));
  } catch (error: any) {
    console.error('Error fetching students:', error);
    throw new Error(error.message || 'Failed to fetch students.');
  }
}

export async function createStudent(data: { nis: string; name: string; className: string; gender: 'L' | 'P' }) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    // Check for NIS duplicate for this teacher
    const existing = await Student.findOne({ teacherId, nis: data.nis });
    if (existing) {
      throw new Error(`Siswa dengan NIS ${data.nis} sudah ada di kelas Anda.`);
    }

    const newStudent = new Student({
      ...data,
      teacherId,
    });

    await newStudent.save();
    revalidatePath('/siswa');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating student:', error);
    throw new Error(error.message || 'Failed to create student.');
  }
}

export async function updateStudent(id: string, data: { nis: string; name: string; className: string; gender: 'L' | 'P' }) {
  try {
    await dbConnect();
    const teacherId = await requireAuth();

    // Verify ownership
    const student = await Student.findOne({ _id: id, teacherId });
    if (!student) {
      throw new Error('Siswa tidak ditemukan atau Anda tidak memiliki akses.');
    }

    // Check for NIS duplicate on other students
    const existing = await Student.findOne({ teacherId, nis: data.nis, _id: { $ne: id } });
    if (existing) {
      throw new Error(`NIS ${data.nis} sudah digunakan oleh siswa lain.`);
    }

    student.nis = data.nis;
    student.name = data.name;
    student.className = data.className;
    student.gender = data.gender;

    await student.save();
    revalidatePath('/siswa');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating student:', error);
    throw new Error(error.message || 'Failed to update student.');
  }
}

export async function deleteStudent(id: string) {
  try {
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
    console.error('Error deleting student:', error);
    throw new Error(error.message || 'Failed to delete student.');
  }
}
