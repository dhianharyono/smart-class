import React from 'react';
import { getSchools, verifyAdminPage } from '@/actions/adminActions';
import ManageSchoolsClient from './ManageSchoolsClient';

export const dynamic = 'force-dynamic';

export default async function ManageSchoolsPage() {
  await verifyAdminPage();
  const schools = await getSchools();

  return <ManageSchoolsClient initialSchools={schools} />;
}
