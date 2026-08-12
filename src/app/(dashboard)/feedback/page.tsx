import React from 'react';
import FeedbackClient from './FeedbackClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Kritik & Saran - Smart Class',
  description: 'Kirim masukan, saran, kritik, atau laporan bug ke administrator Smart Class',
};

export default function FeedbackPage() {
  return <FeedbackClient />;
}
