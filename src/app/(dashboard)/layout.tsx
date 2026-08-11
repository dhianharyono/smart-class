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
  const teacher = await Teacher.findByIdAndUpdate(
    session.userId,
    { lastActiveAt: new Date() },
    { returnDocument: 'after' }
  ).lean();

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
        classes:
          Array.isArray(teacher.classes) && teacher.classes.length > 0
            ? (teacher.classes as string[])
            : teacher.className
            ? [teacher.className]
            : [],
        activeClass: teacher.activeClass || teacher.className || '',
        nip: teacher.nip || '-',
        principalName: teacher.principalName || '',
        principalNip: teacher.principalNip || '-',
        isAdmin: !!session.isAdmin,
        isFirstLogin: teacher.isFirstLogin ?? false,
        enabledMenus: (() => {
          const base =
            teacher.enabledMenus && teacher.enabledMenus.length > 0
              ? (teacher.enabledMenus as string[])
              : ['/dashboard', '/kelas', '/siswa', '/absensi', '/nilai', '/tabungan', '/jadwal', '/piket', '/jurnal', '/profile', '/settings'];
          return base.includes('/kelas') ? base : [...base, '/kelas'];
        })(),
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
