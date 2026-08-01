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
        nip: teacher.nip || '-',
        isAdmin: !!session.isAdmin,
        isFirstLogin: teacher.isFirstLogin ?? false,
        enabledMenus: (() => {
          const list =
            teacher.enabledMenus && teacher.enabledMenus.length > 0
              ? teacher.enabledMenus
              : ['/', '/siswa', '/absensi', '/nilai', '/tabungan', '/jadwal', '/piket', '/jurnal'];
          let res = list.includes('/jadwal') ? list : [...list, '/jadwal'];
          return res.includes('/piket') ? res : [...res, '/piket'];
        })(),
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
