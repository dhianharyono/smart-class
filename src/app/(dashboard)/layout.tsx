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

  await dbConnect();
  const teacher = await Teacher.findById(session.userId).lean();

  if (!teacher) {
    redirect('/sign-in');
  }

  return (
    <DashboardLayoutClient 
      teacher={{ 
        name: teacher.name || 'Guru Smart Class', 
        email: teacher.email 
      }}
    >
      {children}
    </DashboardLayoutClient>
  );
}
