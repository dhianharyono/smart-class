import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySession } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Teacher from '@/models/Teacher';
import AdminLayoutClient from './AdminLayoutClient';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Read session cookie
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  
  if (!sessionToken) {
    redirect('/sign-in');
  }

  const session = await verifySession(sessionToken);
  if (!session || !session.userId || !session.isAdmin) {
    redirect('/');
  }

  await dbConnect();
  await Teacher.findByIdAndUpdate(session.userId, { lastActiveAt: new Date() });
  const adminUser = await Teacher.findById(session.userId).lean();

  if (!adminUser) {
    redirect('/sign-in?clear=1');
  }

  return (
    <AdminLayoutClient 
      admin={{ 
        name: adminUser.name || 'Admin Smart Class', 
        email: adminUser.email 
      }}
    >
      {children}
    </AdminLayoutClient>
  );
}
