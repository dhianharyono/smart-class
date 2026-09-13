import React from 'react';
import JurnalClient from './JurnalClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Jurnal Mengajar | Smart Class',
  description:
    'Pencatatan agenda harian mengajar guru, materi, KBM, dan rekapitulasi ketidakhadiran siswa.',
};

export default function JurnalPage() {
  return <JurnalClient />;
}
