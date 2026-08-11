import React from 'react';
import { verifyAdminPage } from '@/actions/adminActions';
import AdminProfileClient from './AdminProfileClient';

export const dynamic = 'force-dynamic';

export default async function AdminProfilePage() {
  await verifyAdminPage();
  return <AdminProfileClient />;
}
