'use client';

import React, { useState, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => { };
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
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
  CalendarCheck2,
  CheckSquare,
  GraduationCap,
  Sparkles,
  ArrowRight,
  LayoutGrid,
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
  const mounted = useIsMounted();
  const [kkm] = useState<number>(stats.kkm);

  if (!mounted) {
    return (
      <div className='space-y-6'>
        <div className='h-10 w-48 bg-slate-200 rounded animate-pulse' />
        <div className='grid gap-4 md:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className='h-28 bg-slate-200 rounded-2xl animate-pulse'
            />
          ))}
        </div>
        <div className='grid gap-6 md:grid-cols-3'>
          <div className='h-96 md:col-span-2 bg-slate-200 rounded-2xl animate-pulse' />
          <div className='h-96 bg-slate-200 rounded-2xl animate-pulse' />
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

  const enabled = stats.enabledMenus || ['/', '/siswa', '/absensi', '/nilai', '/tabungan', '/jadwal', '/piket', '/jurnal'];

  const isSiswaEnabled = enabled.includes('/siswa');
  const isAbsensiEnabled = enabled.includes('/siswa') || enabled.includes('/absensi');
  const isTabunganEnabled = enabled.includes('/tabungan');
  const isNilaiEnabled = enabled.includes('/nilai');
  const isJurnalEnabled = enabled.includes('/jurnal');
  const isJadwalEnabled = enabled.includes('/jadwal');
  const isPiketEnabled = enabled.includes('/piket');

  const statCards = [
    {
      title: 'Total Siswa',
      value: stats.studentCount,
      description: 'Siswa aktif terdaftar',
      icon: Users,
      color:
        'from-emerald-50 to-teal-50/30 text-emerald-700 border-emerald-200/70',
      visible: isSiswaEnabled,
    },
    {
      title: 'Rata-rata Kehadiran',
      value: `${stats.monthlyAttendanceRate}%`,
      description: 'Kehadiran bulan ini',
      icon: CalendarCheck2,
      color: 'from-blue-50 to-indigo-50/30 text-blue-700 border-blue-200/70',
      visible: isAbsensiEnabled,
    },
    {
      title: 'Tabungan Kelas',
      value: formatIDR(stats.totalSavingsBalance),
      description: 'Total dana terkumpul',
      icon: Wallet,
      color:
        'from-amber-50 to-orange-50/30 text-amber-700 border-amber-200/70',
      visible: isTabunganEnabled,
    },
    {
      title: 'Evaluasi Nilai',
      value: stats.lowGradeCount,
      description: `Siswa di bawah KKM < ${kkm}`,
      icon: AlertTriangle,
      color: 'from-rose-50 to-red-50/30 text-rose-700 border-rose-200/70',
      visible: isNilaiEnabled,
    },
  ].filter((c) => c.visible);

  return (
    <div className='space-y-8 animate-fade-in'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900'>
            Dashboard Utama
          </h2>
          <p className='text-slate-600 text-sm mt-1'>
            Ringkasan performa akademik, jadwal mengajar, presensi, dan tabungan kelas Anda.
          </p>
        </div>
        <Link href='/'>
          <Button
            variant='outline'
            className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs'
          >
            <Home className='h-4 w-4 text-emerald-600' />
            <span>Kembali Ke Halaman Utama</span>
          </Button>
        </Link>
      </div>

      {/* Empty State – when no modules are active */}
      {statCards.length === 0 && !isTabunganEnabled && !isAbsensiEnabled && !isJurnalEnabled && !isNilaiEnabled && (
        <div className='flex flex-col items-center justify-center py-20 text-center gap-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50'>
          <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-xs text-slate-300'>
            <LayoutGrid className='h-10 w-10' />
          </div>
          <div className='space-y-1.5 max-w-sm'>
            <h3 className='text-base font-extrabold text-slate-800'>Belum Ada Modul Aktif</h3>
            <p className='text-sm text-slate-500 leading-relaxed'>
              Anda belum mengaktifkan modul apapun pada dashboard. Aktifkan modul yang ingin ditampilkan melalui halaman pengaturan.
            </p>
          </div>
          <Link href='/settings'>
            <Button className='bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold gap-2 shadow-xs'>
              <Sparkles className='h-4 w-4' />
              Kelola Menu Modul
            </Button>
          </Link>
        </div>
      )}

      {/* Grid Stats */}
      {statCards.length > 0 && (
        <div className={`grid gap-4 sm:grid-cols-2 md:grid-cols-${statCards.length}`}>
          {statCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <Card
                key={i}
                className={`bg-white border backdrop-blur-sm shadow-xs rounded-2xl relative overflow-hidden bg-gradient-to-b ${card.color}`}
              >
                <CardHeader className='flex flex-row items-center justify-between pb-2'>
                  <CardTitle className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    {card.title}
                  </CardTitle>
                  <div className='p-2 rounded-xl bg-white border border-slate-200 shadow-xs'>
                    <Icon className='h-4 w-4' />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='text-2xl font-extrabold tracking-tight text-slate-900 mb-1'>
                    {card.value}
                  </div>
                  <p className='text-[10px] text-slate-500 font-medium'>{card.description}</p>
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
            <Card className={`bg-white border-slate-200/80 rounded-2xl shadow-xs ${isAbsensiEnabled ? 'md:col-span-2' : 'md:col-span-3'}`}>
              <CardHeader className='flex flex-row items-center justify-between'>
                <div>
                  <CardTitle className='text-md font-bold text-slate-900'>
                    Tren Tabungan Kelas
                  </CardTitle>
                  <CardDescription className='text-xs text-slate-500'>
                    Pertumbuhan total saldo tabungan kelas
                  </CardDescription>
                </div>
                <TrendingUp className='h-5 w-5 text-emerald-600' />
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
                          <stop offset='5%' stopColor='#10b981' stopOpacity={0.25} />
                          <stop offset='95%' stopColor='#10b981' stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey='date'
                        stroke='#64748b'
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke='#64748b'
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val: number) => `Rp ${val / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                        }}
                        labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        itemStyle={{ color: '#059669' }}
                        formatter={(value: any) => [
                          formatIDR(Number(value)),
                          'Saldo',
                        ]}
                      />
                      <Area
                        type='monotone'
                        dataKey='Saldo'
                        stroke='#059669'
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill='url(#colorSaldo)'
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className='flex h-full items-center justify-center text-slate-400 text-xs'>
                    Belum ada data tabungan.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendance Pie Chart */}
          {isAbsensiEnabled && (
            <Card className={`bg-white border-slate-200/80 rounded-2xl shadow-xs ${isTabunganEnabled ? 'md:col-span-1' : 'md:col-span-3'}`}>
              <CardHeader>
                <CardTitle className='text-md font-bold text-slate-900'>
                  Distribusi Kehadiran
                </CardTitle>
                <CardDescription className='text-xs text-slate-500'>
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
                          backgroundColor: '#ffffff',
                          borderColor: '#e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
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
                    <span className='text-3xl font-extrabold text-slate-900'>
                      {stats.monthlyAttendanceRate}%
                    </span>
                    <span className='text-[10px] text-slate-500 font-bold uppercase tracking-wider'>
                      Hadir
                    </span>
                  </div>
                </div>

                {/* Attendance Legends */}
                <div className='grid grid-cols-4 gap-1 text-center border-t border-slate-100 pt-4'>
                  <div>
                    <p className='text-sm sm:text-base font-bold text-emerald-600'>
                      {stats.attendanceBreakdown.Hadir}
                    </p>
                    <p className='text-xs text-slate-500 font-medium'>Hadir</p>
                  </div>
                  <div>
                    <p className='text-sm sm:text-base font-bold text-blue-600'>
                      {stats.attendanceBreakdown.Sakit}
                    </p>
                    <p className='text-xs text-slate-500 font-medium'>Sakit</p>
                  </div>
                  <div>
                    <p className='text-sm sm:text-base font-bold text-amber-600'>
                      {stats.attendanceBreakdown.Izin}
                    </p>
                    <p className='text-xs text-slate-500 font-medium'>Izin</p>
                  </div>
                  <div>
                    <p className='text-sm sm:text-base font-bold text-rose-600'>
                      {stats.attendanceBreakdown.Alfa}
                    </p>
                    <p className='text-xs text-slate-500 font-medium'>Alfa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Monthly Journal Meetings & Absence Analytics Chart */}
      {isJurnalEnabled && stats.journalMonthlyStats && stats.journalMonthlyStats.length > 0 && (
        <Card className='bg-white border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs'>
          <CardHeader className='pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-0 sm:p-6 sm:pb-2'>
            <div className='min-w-0 flex-1'>
              <CardTitle className='text-sm sm:text-md font-bold text-slate-900 flex items-center gap-2'>
                <BarChart3 className='h-5 w-5 text-emerald-600 shrink-0' />
                <span>Statistik Pertemuan & Ketidakhadiran Siswa Per Bulan</span>
              </CardTitle>
              <CardDescription className='text-xs text-slate-500 mt-1'>
                Grafik intensitas agenda harian mengajar wali kelas dan rekapitulasi absensi per bulan
              </CardDescription>
            </div>
            <div className='text-left sm:text-right text-xs bg-emerald-50/80 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-emerald-100 sm:border-none shrink-0'>
              <span className='text-slate-500 inline sm:block font-medium mr-1 sm:mr-0'>Total Agenda Jurnal:</span>
              <span className='text-emerald-700 font-extrabold text-xs sm:text-sm'>
                {stats.totalJournalEntries || 0} Pertemuan
              </span>
            </div>
          </CardHeader>
          <CardContent className='h-72 sm:h-80 pt-4 p-0 sm:p-6 sm:pt-4'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart data={stats.journalMonthlyStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' vertical={false} />
                <XAxis dataKey='month' stroke='#64748b' fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke='#64748b' fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
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
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs'>
          <CardHeader className='flex flex-row items-start gap-3 p-4 sm:p-6 pb-2 sm:pb-4'>
            <div className='p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shrink-0 mt-0.5'>
              <AlertCircle className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <CardTitle className='text-sm sm:text-md font-bold text-slate-900 leading-snug'>
                Notifikasi Evaluasi Akademik (Di Bawah KKM &lt; {kkm})
              </CardTitle>
              <CardDescription className='text-xs text-slate-500 mt-1'>
                Siswa dengan pencapaian akademis yang memerlukan bimbingan lebih lanjut.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='p-4 sm:p-6 pt-2 sm:pt-0'>
            {stats.lowGradeNotifications.length > 0 ? (
              <div className='divide-y divide-slate-100'>
                {stats.lowGradeNotifications.map((notif) => (
                  <div
                    key={notif.gradeId}
                    className='flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 group'
                  >
                    <div className='flex flex-col'>
                      <span className='text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors duration-150'>
                        {notif.studentName}
                      </span>
                      <span className='text-xs text-slate-500 font-medium'>
                        NIS: {notif.nis} • Kelas: {notif.className}
                      </span>
                    </div>
                    <div className='flex items-center gap-4 self-start sm:self-auto'>
                      <div className='text-left sm:text-right'>
                        <span className='text-xs font-semibold text-slate-600 block'>
                          {notif.subject} ({notif.category})
                        </span>
                        <span className='text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full inline-block mt-0.5'>
                          Skor: {notif.score}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex flex-col items-center justify-center py-8 text-slate-500 text-xs text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 my-1'>
                <span className='text-emerald-600 font-bold text-sm mb-1'>
                  Semua Siswa Lulus KKM!
                </span>
                <span className='text-slate-500'>
                  Tidak ada siswa dengan nilai di bawah standar saat ini.
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
