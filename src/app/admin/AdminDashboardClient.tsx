'use client';

import React, { useState, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
}
import {
  Users,
  School,
  GraduationCap,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Home,
  Search,
  Clock,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export interface ActivityTrendItem {
  date: string;
  day: string;
  fullLabel: string;
  jurnal: number;
  presensi: number;
  nilai: number;
  tabungan: number;
  total: number;
}

export interface ClassStudentCount {
  className: string;
  count: number;
}

export interface ClassAttendanceRate {
  className: string;
  rate: number | null;
  total: number;
}

export interface ClassJournalCount {
  className: string;
  count: number;
}

export interface ClassGradeCount {
  className: string;
  count: number;
}

export interface ClassSaving {
  className: string;
  amount: number;
}

interface TeacherStat {
  id: string;
  name: string;
  email: string;
  schoolName: string;
  className: string;
  classes?: string[];
  classStudentCounts?: ClassStudentCount[];
  classAttendanceRates?: ClassAttendanceRate[];
  classJournalCounts?: ClassJournalCount[];
  classGradeCounts?: ClassGradeCount[];
  classSavings?: ClassSaving[];
  studentCount: number;
  totalSavings: number;
  journalCount?: number;
  gradeCount?: number;
  attendanceRate?: number;
  totalAttendance?: number;
  createdAt: string;
}

interface OnlineUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActiveAt: string;
}

interface SchoolStat {
  _id: string;
  name: string;
  teacherCount: number;
  studentCount: number;
  createdAt: string;
}

interface AttendanceBreakdown {
  hadir: number;
  sakit: number;
  izin: number;
  alfa: number;
  total: number;
  hadirPct: number;
  sakitPct: number;
  izinPct: number;
  alfaPct: number;
}

interface RecentJournal {
  id: string;
  teacherName: string;
  schoolName: string;
  className: string;
  subject: string;
  material: string;
  date: string;
}

interface AdminDashboardClientProps {
  stats: {
    teacherCount: number;
    schoolCount: number;
    studentCount: number;
    totalSavingsBalance: number;
    totalJournalCount?: number;
    totalGradeCount?: number;
    overallAttendanceRate?: number;
    attendanceBreakdown?: AttendanceBreakdown;
    recentJournals?: RecentJournal[];
    teacherStats: TeacherStat[];
    onlineUsers?: OnlineUser[];
    activityTrend?: ActivityTrendItem[];
  };
  schools: SchoolStat[];
}

export default function AdminDashboardClient({
  stats,
  schools,
}: AdminDashboardClientProps) {
  const mounted = useIsMounted();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeacherIds, setExpandedTeacherIds] = useState<string[]>([]);

  const toggleExpandTeacher = (teacherId: string) => {
    setExpandedTeacherIds((prev) =>
      prev.includes(teacherId)
        ? prev.filter((id) => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  if (!mounted) {
    return (
      <div className='space-y-6'>
        <div className='h-10 w-48 bg-slate-200 rounded animate-pulse' />
        <div className='grid gap-4 sm:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className='h-28 bg-white border border-slate-200 rounded-2xl animate-pulse'
            />
          ))}
        </div>
        <div className='h-96 bg-white border border-slate-200 rounded-2xl animate-pulse' />
      </div>
    );
  }

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatCompactIDR = (amount: number) => {
    if (Math.abs(amount) >= 1_000_000) {
      const val = amount / 1_000_000;
      return `Rp ${val % 1 === 0 ? val : val.toFixed(1)}jt`;
    }
    if (Math.abs(amount) >= 1_000) {
      const val = amount / 1_000;
      return `Rp ${val % 1 === 0 ? val : val.toFixed(0)}rb`;
    }
    return `Rp ${amount}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  const statCards = [
    {
      title: 'Total Wali Kelas',
      value: stats.teacherCount,
      description: 'Guru aktif terdaftar',
      icon: GraduationCap,
      color: 'bg-white border-slate-200/80 text-emerald-700 shadow-xs',
      iconColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
    {
      title: 'Sekolah Terdaftar',
      value: stats.schoolCount,
      description: 'Sekolah terdata',
      icon: School,
      color: 'bg-white border-slate-200/80 text-teal-700 shadow-xs',
      iconColor: 'bg-teal-50 border-teal-200 text-teal-700',
    },
  ];

  // Filtered teachers list based on search term
  const filteredTeacherStats = stats.teacherStats.filter((teacher) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    const matchesClass =
      (teacher.classes &&
        teacher.classes.some((c) => c.toLowerCase().includes(q))) ||
      teacher.className.toLowerCase().includes(q);
    return (
      teacher.name.toLowerCase().includes(q) ||
      teacher.email.toLowerCase().includes(q) ||
      teacher.schoolName.toLowerCase().includes(q) ||
      matchesClass
    );
  });

  const breakdown = stats.attendanceBreakdown || {
    hadir: 0,
    sakit: 0,
    izin: 0,
    alfa: 0,
    total: 0,
    hadirPct: 0,
    sakitPct: 0,
    izinPct: 0,
    alfaPct: 0,
  };

  // Activity trend metrics
  const trendData = stats.activityTrend || [];
  const totalTrend7Days = trendData.reduce((acc, curr) => acc + curr.total, 0);
  const peakDay =
    trendData.length > 0
      ? [...trendData].sort((a, b) => b.total - a.total)[0]
      : null;
  const peakDayLabel = peakDay ? peakDay.day : '-';
  const peakDayTotal = peakDay ? peakDay.total : 0;

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight'>
            Dashboard Administrator
          </h1>
          <p className='text-xs sm:text-sm text-slate-500 font-medium mt-1'>
            Ikhtisar operasional, tren aktivitas wali kelas, presensi, dan
            sekolah terdaftar di seluruh sistem.
          </p>
        </div>
        <Link href='/' className='w-full sm:w-auto'>
          <Button
            variant='outline'
            className='w-full sm:w-auto border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 hover:text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors'
          >
            <Home className='h-4 w-4 text-emerald-600' />
            <span>Halaman Utama</span>
          </Button>
        </Link>
      </div>

      {/* Grid Utama 4 Stat Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-2'>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`${card.color} rounded-2xl relative overflow-hidden p-4 sm:p-4.5 flex flex-col justify-between border border-slate-200/70 shadow-xs transition-all duration-200 hover:shadow-sm`}
            >
              <div className='flex items-center justify-between gap-2 mb-3'>
                <span className='text-xs font-extrabold text-slate-500 uppercase tracking-wider truncate'>
                  {card.title}
                </span>
                <div className={`p-2 rounded-xl border ${card.iconColor}`}>
                  <Icon className='h-4 w-4' />
                </div>
              </div>
              <div>
                <div className='font-black tracking-tight text-slate-900 mb-1 leading-none text-2xl sm:text-3xl'>
                  {card.value}
                </div>
                <p className='text-[11px] text-slate-500 font-medium truncate'>
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Column Section for Statistik Sekolah & Pengguna Online */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Statistik Sekolah */}
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between'>
          <div>
            <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6 pb-4'>
              <div>
                <CardTitle className='text-md font-bold text-slate-900'>
                  Statistik Sekolah
                </CardTitle>
                <CardDescription className='text-xs text-slate-500 mt-1'>
                  Jumlah guru dan siswa per sekolah terdaftar.
                </CardDescription>
              </div>
              <Link
                href='/admin/sekolah'
                className='flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold transition-colors shrink-0'
              >
                <span>Kelola Sekolah</span>
                <ArrowRight className='h-3.5 w-3.5' />
              </Link>
            </CardHeader>
            <CardContent className='px-6 pb-6'>
              {schools.length > 0 ? (
                <div className='overflow-x-auto min-w-0 max-w-full'>
                  <table className='w-full text-left text-xs text-slate-700 border-collapse'>
                    <thead>
                      <tr className='border-b border-slate-200/80 text-slate-700 uppercase tracking-wider text-[10px] font-bold'>
                        <th className='py-2.5 px-2'>Nama Sekolah</th>
                        <th className='py-2.5 px-2 text-center'>Guru</th>
                        <th className='py-2.5 px-2 text-right'>Siswa</th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-slate-100'>
                      {schools.map((school) => (
                        <tr
                          key={school._id}
                          className='hover:bg-slate-50/80 transition-colors group'
                        >
                          <td className='py-2.5 px-2 font-bold text-slate-900 truncate max-w-[150px]'>
                            {school.name}
                          </td>
                          <td className='py-2.5 px-2 text-center font-medium'>
                            {school.teacherCount || 0} Guru
                          </td>
                          <td className='py-2.5 px-2 text-right font-bold text-emerald-700'>
                            {school.studentCount || 0} Siswa
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-slate-400 text-xs'>
                  Belum ada sekolah terdaftar.
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Pengguna Online */}
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between'>
          <div>
            <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-6 pb-4'>
              <div>
                <CardTitle className='text-md font-bold text-slate-900 flex items-center gap-2'>
                  <span className='relative flex h-2.5 w-2.5'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500'></span>
                  </span>
                  <span>
                    Wali Kelas Online ({stats.onlineUsers?.length || 0})
                  </span>
                </CardTitle>
                <CardDescription className='text-xs text-slate-500 mt-1'>
                  Wali kelas aktif 5 menit terakhir beserta peran (role).
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className='px-6 pb-6'>
              {stats.onlineUsers && stats.onlineUsers.length > 0 ? (
                <div className='space-y-2.5 max-h-[220px] overflow-y-auto pr-1'>
                  {stats.onlineUsers.map((user) => {
                    let badgeColor =
                      'bg-emerald-50 text-emerald-700 border-emerald-200';
                    if (user.role === 'Kepala Sekolah') {
                      badgeColor =
                        'bg-violet-50 text-violet-700 border-violet-200';
                    }

                    return (
                      <div
                        key={user.id}
                        className='flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 transition-colors'
                      >
                        <div className='flex flex-col min-w-0'>
                          <span className='font-bold text-xs text-slate-900 truncate'>
                            {user.name}
                          </span>
                          <span className='text-[10px] text-slate-500 truncate'>
                            {user.email}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 border text-[9px] font-bold rounded-md uppercase tracking-wider shrink-0 ml-2 ${badgeColor}`}
                        >
                          {user.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-8 text-slate-400 text-xs'>
                  Belum ada wali kelas yang online.
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Section Grafik Tren Aktivitas Wali Kelas */}
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs'>
          <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 pb-2'>
            <div>
              <CardTitle className='text-md font-bold text-slate-900 flex items-center gap-2'>
                <span>Tren Aktivitas Wali Kelas (7 Hari Terakhir)</span>
              </CardTitle>
              <CardDescription className='text-xs text-slate-500 mt-1'>
                Grafik penginputan Jurnal KBM, Presensi Siswa, Nilai Akademik, &
                Tabungan oleh seluruh wali kelas.
              </CardDescription>
            </div>

            <div className='flex items-center gap-2 flex-wrap'>
              <div className='bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2'>
                <span className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                  Total 7 Hari
                </span>
                <span className='text-xs font-black text-slate-900'>
                  {totalTrend7Days} Aktivitas
                </span>
              </div>
              <div className='bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 flex items-center gap-2'>
                <span className='text-[10px] font-bold text-emerald-700 uppercase tracking-wider'>
                  Puncak
                </span>
                <span className='text-xs font-black text-emerald-800'>
                  {peakDayLabel} ({peakDayTotal})
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className='p-6 pt-2'>
            <div className='h-[280px] w-full pt-4'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id='colorJurnal'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#059669' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#059669' stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id='colorPresensi'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#0d9488' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#0d9488' stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id='colorNilai' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#0284c7' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#0284c7' stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id='colorTabungan'
                      x1='0'
                      y1='0'
                      x2='0'
                      y2='1'
                    >
                      <stop offset='5%' stopColor='#8b5cf6' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#8b5cf6' stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray='3 3'
                    vertical={false}
                    stroke='#e2e8f0'
                  />
                  <XAxis
                    dataKey='fullLabel'
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    labelStyle={{
                      fontWeight: 'bold',
                      color: '#0f172a',
                      marginBottom: '4px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    iconType='circle'
                    wrapperStyle={{ paddingTop: '12px', fontSize: '11px' }}
                  />
                  <Area
                    type='monotone'
                    dataKey='jurnal'
                    name='Jurnal KBM'
                    stroke='#059669'
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill='url(#colorJurnal)'
                  />
                  <Area
                    type='monotone'
                    dataKey='presensi'
                    name='Presensi Siswa'
                    stroke='#0d9488'
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill='url(#colorPresensi)'
                  />
                  <Area
                    type='monotone'
                    dataKey='nilai'
                    name='Input Nilai'
                    stroke='#0284c7'
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill='url(#colorNilai)'
                  />
                  <Area
                    type='monotone'
                    dataKey='tabungan'
                    name='Tabungan'
                    stroke='#8b5cf6'
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill='url(#colorTabungan)'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Section Data Baru & Fitur Pemantauan: Aktivitas KBM Terkini */}
        <div className='grid gap-6 md:grid-cols-1'>
          {/* Umpan Aktivitas KBM (Jurnal Pembelajaran Terbaru) */}
          <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between'>
            <div>
              <CardHeader className='flex flex-row items-center justify-between p-6 pb-4'>
                <div>
                  <CardTitle className='text-md font-bold text-slate-900 flex items-center gap-2'>
                    <span>Aktivitas KBM Terkini</span>
                  </CardTitle>
                  <CardDescription className='text-xs text-slate-500 mt-1'>
                    Entri jurnal mengajar terbaru yang diinput oleh wali kelas.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className='px-6 pb-6'>
                {stats.recentJournals && stats.recentJournals.length > 0 ? (
                  <div className='space-y-2.5 max-h-[220px] overflow-y-auto pr-1'>
                    {stats.recentJournals.map((journal) => (
                      <div
                        key={journal.id}
                        className='p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl hover:border-teal-300 hover:bg-teal-50/30 transition-colors'
                      >
                        <div className='flex items-center justify-between mb-1'>
                          <div className='flex items-center gap-2 min-w-0'>
                            <span className='font-bold text-xs text-slate-900 truncate'>
                              {journal.teacherName}
                            </span>
                            <span className='bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0'>
                              {journal.className}
                            </span>
                          </div>
                          <span className='text-[10px] text-slate-500 flex items-center gap-1 shrink-0'>
                            <Clock className='h-3 w-3 text-slate-400' />
                            {formatDate(journal.date)}
                          </span>
                        </div>
                        <p className='text-xs text-slate-700 font-semibold truncate'>
                          {journal.subject} &bull;{' '}
                          <span className='font-normal text-slate-600'>
                            {journal.material}
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-8 text-slate-400 text-xs'>
                    Belum ada aktivitas jurnal mengajar.
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </div>
      </div>

      {/* Detail & Statistik Wali Kelas (Guru) dengan Search Bar */}
      <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs'>
        <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 pb-4'>
          <div>
            <CardTitle className='text-md font-bold text-slate-900 flex items-center gap-2'>
              <span>Statistik & Pemantauan Wali Kelas</span>
            </CardTitle>
            <CardDescription className='text-xs text-slate-500 mt-1'>
              Ringkasan aktivitas pembelajaran, tingkat kehadiran siswa, jurnal,
              nilai, dan total tabungan kelas.
            </CardDescription>
          </div>
          <div className='flex items-center gap-3 w-full sm:w-auto'>
            {/* Search input for teachers */}
            <div className='relative flex-1 sm:w-64'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400' />
              <input
                type='text'
                placeholder='Cari guru, sekolah, kelas...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors'
              />
            </div>
            <Link
              href='/admin/guru'
              className='flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold transition-colors shrink-0'
            >
              <span>Kelola Guru</span>
              <ArrowRight className='h-3.5 w-3.5' />
            </Link>
          </div>
        </CardHeader>
        <CardContent className='space-y-6 px-6 pb-6'>
          {/* Mini KPI Ringkasan Aktivitas Sistem */}
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
            <div className='bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0'>
                <Users className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                  Total Siswa
                </p>
                <p className='text-base font-extrabold text-slate-900'>
                  {stats.studentCount} Siswa
                </p>
              </div>
            </div>

            <div className='bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 shrink-0'>
                <CheckCircle2 className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                  Rata2 Presensi
                </p>
                <p className='text-base font-extrabold text-slate-900'>
                  {stats.overallAttendanceRate ?? 0}%
                </p>
              </div>
            </div>

            <div className='bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 shrink-0'>
                <BookOpen className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                  Total Jurnal
                </p>
                <p className='text-base font-extrabold text-slate-900'>
                  {stats.totalJournalCount ?? 0} Entri
                </p>
              </div>
            </div>

            <div className='bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3'>
              <div className='p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0'>
                <FileText className='h-4 w-4' />
              </div>
              <div className='min-w-0'>
                <p className='text-[10px] font-bold text-slate-500 uppercase tracking-wider'>
                  Total Nilai
                </p>
                <p className='text-base font-extrabold text-slate-900'>
                  {stats.totalGradeCount ?? 0} Nilai
                </p>
              </div>
            </div>
          </div>

          {/* Tabel Statistik Wali Kelas */}
          {filteredTeacherStats.length > 0 ? (
            <div className='overflow-x-auto min-w-0 max-w-full rounded-xl border border-slate-200'>
              <table className='w-full min-w-[750px] text-left text-sm text-slate-700 border-collapse'>
                <thead>
                  <tr className='bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider'>
                    <th className='py-3 px-4'>Nama Guru</th>
                    <th className='py-3 px-4'>Sekolah / Kelas</th>
                    <th className='py-3 px-4 text-center'>Siswa</th>
                    <th className='py-3 px-4 text-center'>Tingkat Kehadiran</th>
                    <th className='py-3 px-4 text-center'>Jurnal</th>
                    <th className='py-3 px-4 text-center'>Nilai</th>
                    <th className='py-3 px-4 text-right'>Tabungan Kelas</th>
                    <th className='py-3 px-4 text-center'>Rincian</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {filteredTeacherStats.map((teacher) => {
                    const rate = teacher.attendanceRate ?? 0;
                    const hasAttendance = (teacher.totalAttendance ?? 0) > 0;
                    const isExpanded = expandedTeacherIds.includes(teacher.id);

                    const teacherClasses = teacher.classes && teacher.classes.length > 0
                      ? teacher.classes
                      : [teacher.className || '-'];

                    const isMultiClass = teacherClasses.length > 1;

                    let rateBadgeClass =
                      'bg-slate-100 text-slate-600 border-slate-200';
                    if (hasAttendance) {
                      if (rate >= 85) {
                        rateBadgeClass =
                          'bg-emerald-50 text-emerald-700 border-emerald-200';
                      } else if (rate >= 70) {
                        rateBadgeClass =
                          'bg-amber-50 text-amber-700 border-amber-200';
                      } else {
                        rateBadgeClass =
                          'bg-rose-50 text-rose-700 border-rose-200';
                      }
                    }

                    const teacherClassesData = teacherClasses.map((clsName) => {
                      const sCount = teacher.classStudentCounts?.find((c) => c.className === clsName)?.count ?? 0;
                      const attData = teacher.classAttendanceRates?.find((c) => c.className === clsName);
                      const jCount = teacher.classJournalCounts?.find((c) => c.className === clsName)?.count ?? 0;
                      const gCount = teacher.classGradeCounts?.find((c) => c.className === clsName)?.count ?? 0;
                      const savAmt = teacher.classSavings?.find((c) => c.className === clsName)?.amount ?? 0;

                      return {
                        className: clsName,
                        studentCount: sCount,
                        attendanceRate: attData?.rate ?? null,
                        journalCount: jCount,
                        gradeCount: gCount,
                        savings: savAmt,
                      };
                    });

                    return (
                      <React.Fragment key={teacher.id}>
                        <tr
                          className={cn(
                            'hover:bg-slate-50/80 transition-colors group',
                            isExpanded && 'bg-slate-50/50'
                          )}
                        >
                          <td className='py-3.5 px-4'>
                            <div className='flex flex-col'>
                              <span className='font-bold text-slate-900 group-hover:text-emerald-700 transition-colors'>
                                {teacher.name}
                              </span>
                              <span className='text-xs text-slate-500 font-medium'>
                                {teacher.email}
                              </span>
                            </div>
                          </td>
                          <td className='py-3.5 px-4'>
                            <div className='flex flex-col gap-1 items-start'>
                              <span className='text-slate-800 font-semibold text-xs'>
                                {teacher.schoolName}
                              </span>
                              <div className='flex flex-wrap gap-1 items-center'>
                                {teacherClasses.length > 0 ? (
                                  <>
                                    {teacherClasses.slice(0, 2).map((cls, idx) => (
                                      <span
                                        key={idx}
                                        className='bg-emerald-50 border border-emerald-200/90 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-mono font-bold'
                                      >
                                        Kelas {cls}
                                      </span>
                                    ))}
                                    {teacherClasses.length > 2 && (
                                      <span
                                        className='bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium cursor-help'
                                        title={`Semua Kelas (${teacherClasses.length}): ${teacherClasses.map((c) => `Kelas ${c}`).join(', ')}`}
                                      >
                                        +{teacherClasses.length - 2} kelas
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className='bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono font-medium'>
                                    Kelas -
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className='py-3.5 px-4 text-center'>
                            <div className='inline-flex items-center gap-1.5'>
                              <span className='inline-flex items-center gap-1 text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200'>
                                <Users className='h-3.5 w-3.5 text-emerald-600' />
                                {teacher.studentCount} Siswa
                              </span>
                              {isMultiClass && (
                                <span
                                  className='bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded cursor-help'
                                  title={teacherClassesData.map(c => `Kelas ${c.className}: ${c.studentCount} siswa`).join('\n')}
                                >
                                  {teacherClasses.length} Kelas
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='py-3.5 px-4 text-center'>
                            {hasAttendance ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border ${rateBadgeClass}`}
                              >
                                {rate}% Hadir
                              </span>
                            ) : (
                              <span className='text-xs text-slate-400 italic'>
                                Belum Ada Log
                              </span>
                            )}
                          </td>
                          <td className='py-3.5 px-4 text-center'>
                            <span className='inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg'>
                              <BookOpen className='h-3.5 w-3.5 text-teal-600' />
                              {teacher.journalCount || 0}
                            </span>
                          </td>
                          <td className='py-3.5 px-4 text-center'>
                            <span className='inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg'>
                              <FileText className='h-3.5 w-3.5 text-emerald-600' />
                              {teacher.gradeCount || 0}
                            </span>
                          </td>
                          <td className='py-3.5 px-4 text-right'>
                            <span className='text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg'>
                              {formatIDR(teacher.totalSavings || 0)}
                            </span>
                          </td>
                          <td className='py-3.5 px-4 text-center'>
                            {isMultiClass ? (
                              <button
                                type='button'
                                onClick={() => toggleExpandTeacher(teacher.id)}
                                className={cn(
                                  'inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer',
                                  isExpanded
                                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100/90'
                                )}
                              >
                                <span>{isExpanded ? 'Tutup' : 'Rincian'}</span>
                                <ChevronDown
                                  className={cn(
                                    'h-3.5 w-3.5 transition-transform duration-200',
                                    isExpanded && 'rotate-180'
                                  )}
                                />
                              </button>
                            ) : (
                              <span className='text-[11px] text-slate-400 font-medium'>
                                1 Kelas
                              </span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className='bg-slate-50/80 border-b border-slate-200'>
                            <td colSpan={8} className='p-3 sm:p-4 pl-4 sm:pl-8'>
                              <div className='bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-sm space-y-3'>
                                <div className='flex items-center justify-between border-b border-slate-100 pb-2.5'>
                                  <div className='flex items-center gap-2'>
                                    <div className='p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700'>
                                      <Layers className='h-4 w-4' />
                                    </div>
                                    <div>
                                      <h4 className='text-xs font-bold text-slate-900'>
                                        Rincian Statistik Per Kelas — {teacher.name}
                                      </h4>
                                      <p className='text-[11px] text-slate-500'>
                                        {teacher.schoolName} • Total {teacherClasses.length} Kelas
                                      </p>
                                    </div>
                                  </div>
                                  <span className='text-xs font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg'>
                                    Total {teacher.studentCount} Siswa
                                  </span>
                                </div>

                                <div className='overflow-x-auto rounded-lg border border-slate-200/80'>
                                  <table className='w-full text-left text-xs'>
                                    <thead>
                                      <tr className='bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200'>
                                        <th className='py-2.5 px-3.5'>Nama Kelas</th>
                                        <th className='py-2.5 px-3.5 text-center'>Jumlah Siswa</th>
                                        <th className='py-2.5 px-3.5 text-center'>Tingkat Kehadiran</th>
                                        <th className='py-2.5 px-3.5 text-center'>Jurnal Mengajar</th>
                                        <th className='py-2.5 px-3.5 text-center'>Input Nilai</th>
                                        <th className='py-2.5 px-3.5 text-right'>Tabungan Kelas</th>
                                      </tr>
                                    </thead>
                                    <tbody className='divide-y divide-slate-100 text-slate-700'>
                                      {teacherClassesData.map((clsData) => (
                                        <tr key={clsData.className} className='hover:bg-slate-50/70 transition-colors'>
                                          <td className='py-2.5 px-3.5 font-bold text-slate-900 font-mono'>
                                            <span className='bg-emerald-50 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-bold'>
                                              Kelas {clsData.className}
                                            </span>
                                          </td>
                                          <td className='py-2.5 px-3.5 text-center'>
                                            <span className='inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-bold text-slate-800'>
                                              <Users className='h-3 w-3 text-emerald-600' />
                                              {clsData.studentCount} Siswa
                                            </span>
                                          </td>
                                          <td className='py-2.5 px-3.5 text-center'>
                                            {clsData.attendanceRate !== null ? (
                                              <span className='inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-bold'>
                                                {clsData.attendanceRate}% Hadir
                                              </span>
                                            ) : (
                                              <span className='text-slate-400 italic text-[11px]'>Belum Ada Log</span>
                                            )}
                                          </td>
                                          <td className='py-2.5 px-3.5 text-center'>
                                            <span className='inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700'>
                                              <BookOpen className='h-3 w-3 text-teal-600' />
                                              {clsData.journalCount} Entri
                                            </span>
                                          </td>
                                          <td className='py-2.5 px-3.5 text-center'>
                                            <span className='inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold text-slate-700'>
                                              <FileText className='h-3 w-3 text-emerald-600' />
                                              {clsData.gradeCount} Nilai
                                            </span>
                                          </td>
                                          <td className='py-2.5 px-3.5 text-right font-extrabold text-emerald-700'>
                                            {formatIDR(clsData.savings)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl'>
              <span className='text-emerald-700 font-bold mb-1'>
                {searchTerm
                  ? 'Tidak ada guru yang cocok dengan pencarian'
                  : 'Belum Ada Wali Kelas'}
              </span>
              {searchTerm
                ? 'Coba ubah kata kunci pencarian Anda.'
                : 'Wali kelas yang mendaftar akan muncul di sini beserta statistiknya.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
