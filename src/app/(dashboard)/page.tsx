import React from 'react';
import { getDashboardStats } from '@/actions/dashboardActions';
import DashboardClient from './DashboardClient';

// Ensure the page is dynamically rendered to keep statistics real-time
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return <DashboardClient stats={stats} />;
}
