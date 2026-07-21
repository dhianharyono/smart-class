import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import DashboardLayoutClient from './DashboardLayoutClient';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Read session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  
  if (!sessionToken) {
    redirect('/sign-in');
  }

  const session = await verifySession(sessionToken);
  if (!session || !session.userId) {
    redirect('/sign-in');
  }

  if (session.isAdmin) {
    redirect('/admin');
  }

  await dbConnect();
  await Teacher.findByIdAndUpdate(session.userId, { lastActiveAt: new Date() });
  const teacher = await Teacher.findById(session.userId).lean();

  if (!teacher) {
    redirect('/sign-in?clear=1');
  }

  return (
    <DashboardLayoutClient 
      teacher={{ 
        name: teacher.name || 'Guru Smart Class', 
        email: teacher.email,
        schoolName: teacher.schoolName || '',
        className: teacher.className || '',
        nip: teacher.nip || '-',
        isAdmin: !!session.isAdmin,
        isFirstLogin: teacher.isFirstLogin ?? false,
        enabledMenus: teacher.enabledMenus || ['/', '/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal'],
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
