import React from 'react';
import { getAdminStats, getSchools, verifyAdminPage } from '@/actions/adminActions';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  await verifyAdminPage();
  const stats = await getAdminStats();
  const schools = await getSchools();

  return <AdminDashboardClient stats={stats} schools={schools} />;
}
