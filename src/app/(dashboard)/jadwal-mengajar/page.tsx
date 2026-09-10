import React from 'react';
import JadwalMengajarClient from './JadwalMengajarClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Jadwal Mengajar Guru | Smart Class',
  description: 'Manajemen jadwal mengajar tatap muka pribadi guru dan monitoring beban jam mengajar mingguan.',
};

export default function JadwalMengajarPage() {
  return <JadwalMengajarClient />;
}
