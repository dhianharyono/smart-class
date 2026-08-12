import React from 'react';
import { verifyAdminPage } from '@/actions/adminActions';
import { getAdminFeedbacks, getAdminFeedbackStats } from '@/actions/feedbackActions';
import ManageFeedbackClient from './ManageFeedbackClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kelola Kritik & Saran - Smart Admin',
  description: 'Kelola masukan, kritik, dan saran dari para Wali Kelas Smart Class',
};

export default async function ManageFeedbackPage() {
  await verifyAdminPage();
  const initialFeedbacks = await getAdminFeedbacks();
  const initialStats = await getAdminFeedbackStats();

  return (
    <ManageFeedbackClient
      initialFeedbacks={initialFeedbacks}
      initialStats={initialStats}
    />
  );
}
