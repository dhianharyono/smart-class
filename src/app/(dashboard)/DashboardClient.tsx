'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Wallet,
  AlertTriangle,
  TrendingUp,
  Download,
  AlertCircle,
  LogOut,
  BarChart3,
  BookMarked,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardClientProps {
  stats: {
    studentCount: number;
    monthlyAttendanceRate: number;
    totalSavingsBalance: number;
    lowGradeCount: number;
    lowGradeNotifications: Array<{
      gradeId: string;
      studentName: string;
      nis: string;
      className: string;
      subject: string;
      category: string;
      score: number;
    }>;
    savingsTrend: Array<{ date: string; Saldo: number }>;
    attendanceBreakdown: {
      Hadir: number;
      Sakit: number;
      Izin: number;
      Alfa: number;
    };
    attendanceChartData: Array<{ name: string; value: number; color: string }>;
    journalMonthlyStats?: Array<{
      month: string;
      Pertemuan: number;
      Sakit: number;
      Izin: number;
      Alpha: number;
    }>;
    totalJournalEntries?: number;
    enabledMenus?: string[];
    kkm: number;
  };
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  const [mounted, setMounted] = useState(false);
  const [kkm] = useState<number>(stats.kkm);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className='space-y-6'>
        <div className='h-10 w-48 bg-zinc-900 rounded animate-pulse' />
        <div className='grid gap-4 md:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className='h-28 bg-zinc-900 rounded-2xl animate-pulse'
            />
          ))}
        </div>
        <div className='grid gap-6 md:grid-cols-3'>
          <div className='h-96 md:col-span-2 bg-zinc-900 rounded-2xl animate-pulse' />
          <div className='h-96 bg-zinc-900 rounded-2xl animate-pulse' />
        </div>
      </div>
    );
  }

  // Format currency helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const enabled = stats.enabledMenus || ['/', '/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal'];

  const isSiswaEnabled = enabled.includes('/siswa');
  const isAbsensiEnabled = enabled.includes('/absensi');
  const isTabunganEnabled = enabled.includes('/tabungan');
  const isNilaiEnabled = enabled.includes('/nilai');
  const isJurnalEnabled = enabled.includes('/jurnal');

  const statCards = [
    {
      title: 'Total Siswa',
      value: stats.studentCount,
      description: 'Siswa aktif terdaftar',
      icon: Users,
      color:
        'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-950',
      visible: isSiswaEnabled,
    },
    {
      title: 'Rata-rata Kehadiran',
      value: `${stats.monthlyAttendanceRate}%`,
      description: 'Kehadiran bulan ini',
      icon: Calendar,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-950',
      visible: isAbsensiEnabled,
    },
    {
      title: 'Tabungan Kelas',
      value: formatIDR(stats.totalSavingsBalance),
      description: 'Total dana terkumpul',
      icon: Wallet,
      color:
        'from-amber-500/20 to-orange-500/10 text-amber-400 border-amber-950',
      visible: isTabunganEnabled,
    },
    {
      title: 'Evaluasi Nilai',
      value: stats.lowGradeCount,
      description: 'Siswa di bawah standar KKM',
      icon: AlertTriangle,
      color: 'from-rose-500/20 to-red-500/10 text-rose-400 border-rose-950',
      visible: isNilaiEnabled,
    },
  ].filter((c) => c.visible);

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900/50 pb-5'>
        <div>
          <h2 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent'>
            Dashboard Utama
          </h2>
          <p className='text-zinc-400 text-sm mt-1'>
            Ringkasan performa akademik, kehadiran, dan tabungan kelas Anda.
          </p>
        </div>
        <Link href='/'>
          <Button
            variant='outline'
            className='border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm'
          >
            <Home className='h-4 w-4 text-emerald-400' />
            <span>Kembali Ke Halaman Utama</span>
          </Button>
        </Link>
      </div>

      {/* Grid Stats */}
      {statCards.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 md:grid-cols-${statCards.length}`}>
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Card
                key={i}
                className={`bg-zinc-900/40 border backdrop-blur-sm shadow-xl rounded-2xl relative overflow-hidden bg-gradient-to-b ${card.color}`}
              >
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <CardTitle className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                    {card.title}
                  </CardTitle>
                  <div className='p-2 rounded-xl bg-zinc-950/60 border border-zinc-800'>
                    <Icon className='h-4 w-4' />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-bold tracking-tight text-white mb-1'>
                    {card.value}
                  </div>
                  <p className='text-[10px] text-zinc-500'>{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts Section */}
      {(isTabunganEnabled || isAbsensiEnabled) && (
        <div className='grid gap-6 md:grid-cols-3'>
          {/* Savings Growth Trend Chart */}
          {isTabunganEnabled && (
            <Card className={`bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl ${isAbsensiEnabled ? 'md:col-span-2' : 'md:col-span-3'}`}>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle className='text-md font-bold text-zinc-200'>
                    Tren Tabungan Kelas
                  </CardTitle>
                  <CardDescription className='text-xs text-zinc-500'>
                    Pertumbuhan total saldo tabungan kelas
                  </CardDescription>
                </div>
                <TrendingUp className='h-5 w-5 text-emerald-500' />
              </CardHeader>
              <CardContent className='h-80'>
                {stats.savingsTrend.length > 0 ? (
                  <ResponsiveContainer width='100%' height='100%'>
                    <AreaChart
                      data={stats.savingsTrend}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id='colorSaldo' x1='0' y1='0' x2='0' y2='1'>
                          <stop offset='5%' stopColor='#10b981' stopOpacity={0.2} />
                          <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey='date'
                        stroke='#52525b'
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke='#52525b'
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val: number) => `Rp ${val / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                        }}
                        labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                        itemStyle={{ color: '#10b981' }}
                        formatter={(value: any) => [
                          formatIDR(Number(value)),
                          'Saldo',
                        ]}
                      />
                      <Area
                        type='monotone'
                        dataKey='Saldo'
                        stroke='#10b981'
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill='url(#colorSaldo)'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='flex h-full items-center justify-center text-zinc-600 text-xs'>
                    Belum ada data tabungan.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendance Pie Chart */}
          {isAbsensiEnabled && (
            <Card className={`bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl ${isTabunganEnabled ? 'md:col-span-1' : 'md:col-span-3'}`}>
              <CardHeader>
                <CardTitle className='text-md font-bold text-zinc-200'>
                  Distribusi Kehadiran
                </CardTitle>
                <CardDescription className='text-xs text-zinc-500'>
                  Rincian status kehadiran bulan ini
                </CardDescription>
              </CardHeader>
              <CardContent className='h-80 flex flex-col justify-between'>
                <div className='h-56 relative'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                      <Pie
                        data={stats.attendanceChartData}
                        cx='50%'
                        cy='50%'
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey='value'
                      >
                        {stats.attendanceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '12px',
                        }}
                        formatter={(value: any, name: any) => [
                          `${value} Log Kehadiran`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Central text displaying Rate */}
                  <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                    <span className='text-3xl font-extrabold text-white'>
                      {stats.monthlyAttendanceRate}%
                    </span>
                    <span className='text-[10px] text-zinc-500 uppercase tracking-wider'>
                      Hadir
                    </span>
                  </div>
                </div>

                {/* Attendance Legends */}
                <div className='grid grid-cols-4 gap-1 text-center border-t border-zinc-900 pt-4'>
                  <div>
                    <p className='text-sm sm:text-base font-bold text-emerald-400'>
                      {stats.attendanceBreakdown.Hadir}
                    </p>
                    <p className='text-xs text-zinc-400'>Hadir</p>
                  </div>
                  <div>
                    <p className='text-sm sm:text-base font-bold text-blue-400'>
                      {stats.attendanceBreakdown.Sakit}
                    </p>
                    <p className='text-xs text-zinc-400'>Sakit</p>
                  </div>
                  <div>
                    <p className='text-sm sm:text-base font-bold text-amber-400'>
                      {stats.attendanceBreakdown.Izin}
                    </p>
                    <p className='text-xs text-zinc-400'>Izin</p>
                  </div>
                  <div>
                    <p className='text-sm sm:text-base font-bold text-red-400'>
                      {stats.attendanceBreakdown.Alfa}
                    </p>
                    <p className='text-xs text-zinc-400'>Alfa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Monthly Journal Meetings & Absence Analytics Chart */}
      {isJurnalEnabled && stats.journalMonthlyStats && stats.journalMonthlyStats.length > 0 && (
        <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl p-5 shadow-xl'>
          <CardHeader className='pb-2 flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='text-md font-bold text-zinc-200 flex items-center gap-2'>
                <BarChart3 className='h-5 w-5 text-emerald-400' />
                Statistik Pertemuan & Ketidakhadiran Siswa Per Bulan
              </CardTitle>
              <CardDescription className='text-xs text-zinc-500 mt-0.5'>
                Grafik intensitas agenda harian mengajar wali kelas dan rekapitulasi absensi per bulan
              </CardDescription>
            </div>
            <div className='text-right text-xs'>
              <span className='text-zinc-400 block font-semibold'>Total Agenda Jurnal:</span>
              <span className='text-emerald-400 font-extrabold text-sm'>
                {stats.totalJournalEntries || 0} Pertemuan
              </span>
            </div>
          </CardHeader>
          <CardContent className='h-72 pt-4'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={stats.journalMonthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#27272a' vertical={false} />
                <XAxis dataKey='month' stroke='#71717a' fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke='#71717a' fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey='Pertemuan' fill='#10b981' radius={[4, 4, 0, 0]} name='Sesi Pertemuan' />
                <Bar dataKey='Sakit' fill='#f59e0b' radius={[4, 4, 0, 0]} name='Sakit (S)' />
                <Bar dataKey='Izin' fill='#3b82f6' radius={[4, 4, 0, 0]} name='Izin (I)' />
                <Bar dataKey='Alpha' fill='#f43f5e' radius={[4, 4, 0, 0]} name='Alpha (A)' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Notifications Alert Center */}
      {isNilaiEnabled && (
        <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl'>
          <CardHeader className='flex flex-row items-center gap-3'>
            <div className='p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400'>
              <AlertCircle className='h-5 w-5' />
            </div>
            <div>
              <CardTitle className='text-md font-bold text-zinc-200'>
                Notifikasi Evaluasi Akademik (Di Bawah KKM &lt; {kkm})
              </CardTitle>
              <CardDescription className='text-xs text-zinc-500'>
                Siswa dengan pencapaian akademis yang memerlukan bimbingan lebih
                lanjut.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {stats.lowGradeNotifications.length > 0 ? (
              <div className='divide-y divide-zinc-900'>
                {stats.lowGradeNotifications.map((notif) => (
                  <div
                    key={notif.gradeId}
                    className='flex items-center justify-between py-3 group'
                  >
                    <div className='flex flex-col'>
                      <span className='text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors duration-150'>
                        {notif.studentName}
                      </span>
                      <span className='text-xs text-zinc-500'>
                        NIS: {notif.nis} • Kelas: {notif.className}
                      </span>
                    </div>
                    <div className='flex items-center gap-4'>
                      <div className='text-right'>
                        <span className='text-xs font-medium text-zinc-400 block'>
                          {notif.subject} ({notif.category})
                        </span>
                        <span className='text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-900/40 px-2.5 py-0.5 rounded-full'>
                          Skor: {notif.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-6 text-zinc-600 text-xs'>
                <span className='text-emerald-500 font-semibold mb-1'>
                  Semua Siswa Lulus KKM!
                </span>
                Tidak ada siswa dengan nilai di bawah standar saat ini.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
