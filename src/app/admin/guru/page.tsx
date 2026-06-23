import React from 'react';
import { getTeachers, getSchools, verifyAdminPage } from '@/actions/adminActions';
import ManageTeachersClient from './ManageTeachersClient';

export const dynamic = 'force-dynamic';

export default async function ManageTeachersPage() {
  await verifyAdminPage();
  const teachers = await getTeachers();
  const schools = await getSchools();

  return <ManageTeachersClient initialTeachers={teachers} schools={schools} />;
}
