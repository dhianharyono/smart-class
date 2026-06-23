import React from 'react';
import { getSubjects } from '@/actions/gradeActions';
import { getTeacherKkm } from '@/actions/dashboardActions';
import NilaiClient from './NilaiClient';

export const dynamic = 'force-dynamic';

export default async function NilaiPage() {
  const subjects = await getSubjects();
  const kkm = await getTeacherKkm();

  return <NilaiClient initialSubjects={subjects} initialKkm={kkm} />;
}
