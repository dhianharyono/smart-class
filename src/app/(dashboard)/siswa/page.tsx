import React from 'react';
import { getStudents } from '@/actions/studentActions';
import SiswaClient from './SiswaClient';

export const dynamic = 'force-dynamic';

export default async function SiswaPage() {
  const students = await getStudents();

  return <SiswaClient initialStudents={students} />;
}
