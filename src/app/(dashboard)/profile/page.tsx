import React, { Suspense } from 'react';
import ProfileClient from './ProfileClient';
import LoadingScreen from '@/components/LoadingScreen';

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ProfileClient />
    </Suspense>
  );
}
