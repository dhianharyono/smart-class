import React from 'react';
import { getSubjects } from '@/actions/gradeActions';
import NilaiClient from './NilaiClient';

export const dynamic = 'force-dynamic';

export default async function NilaiPage() {
  const subjects = await getSubjects();

  return <NilaiClient initialSubjects={subjects} />;
}
