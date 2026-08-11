import React from 'react';
import { getProfile } from '@/actions/profileActions';
import TambahSiswaClient from './TambahSiswaClient';

export const dynamic = 'force-dynamic';

export default async function TambahSiswaPage() {
  const profile = await getProfile();
  const activeClass = profile.activeClass || profile.className || '';
  return <TambahSiswaClient defaultClassName={activeClass} />;
}
