'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  School,
  Wallet,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  CheckCircle2,
  FileText,
  Home,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface TeacherStat {
  id: string;
  name: string;
  email: string;
  schoolName: string;
  className: string;
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

interface AdminDashboardClientProps {
  stats: {
    teacherCount: number;
    schoolCount: number;
    studentCount: number;
    totalSavingsBalance: number;
    totalJournalCount?: number;
    overallAttendanceRate?: number;
    teacherStats: TeacherStat[];
    onlineUsers?: OnlineUser[];
  };
  schools: SchoolStat[];
}

export default function AdminDashboardClient({ stats, schools }: AdminDashboardClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-zinc-900 rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 bg-zinc-900 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-zinc-900 rounded-2xl animate-pulse" />
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

  const statCards = [
    {
      title: 'Total Wali Kelas',
      value: stats.teacherCount,
      description: 'Guru aktif terdaftar',
      icon: GraduationCap,
      color: 'from-indigo-500/20 to-violet-500/10 text-indigo-400 border-indigo-950',
    },
    {
      title: 'Sekolah Terdaftar',
      value: stats.schoolCount,
      description: 'Sekolah yang terdata',
      icon: School,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-400 border-blue-950',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase block">
              Ringkasan Sistem
            </span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            Admin Command Center
          </h2>
          <p className="text-zinc-400 text-sm">
            Ikhtisar operasional, statistik guru, dan sekolah terdaftar di seluruh sistem.
          </p>
        </div>
        <Link href="/">
          <Button
            variant="outline"
            className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-sm"
          >
            <Home className="h-4 w-4 text-indigo-400" />
            <span>Kembali Ke Halaman Utama</span>
          </Button>
        </Link>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className={`bg-zinc-900/40 border backdrop-blur-sm shadow-xl rounded-2xl relative overflow-hidden bg-gradient-to-b ${card.color}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {card.title}
                </CardTitle>
                <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight text-white mb-1">
                  {card.value}
                </div>
                <p className="text-[10px] text-zinc-500">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 2-Column Section for Statistik Sekolah & Pengguna Online */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Statistik Sekolah */}
        <Card className="bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold text-zinc-200">Statistik Sekolah</CardTitle>
                <CardDescription className="text-xs text-zinc-500">Jumlah guru dan siswa per sekolah.</CardDescription>
              </div>
              <Link href="/admin/sekolah" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
                <span>Kelola Sekolah</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {schools.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-zinc-300 border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                        <th className="py-3 px-2">Nama Sekolah</th>
                        <th className="py-3 px-2 text-center">Guru</th>
                        <th className="py-3 px-2 text-center">Siswa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {schools.map((school) => (
                        <tr key={school._id} className="hover:bg-zinc-900/20 transition-colors group">
                          <td className="py-3 px-2 font-semibold text-zinc-200 group-hover:text-white transition-colors">
                            {school.name}
                          </td>
                          <td className="py-3 px-2 text-center text-zinc-300">
                            {school.teacherCount || 0} Guru
                          </td>
                          <td className="py-3 px-2 text-center text-zinc-300">
                            {school.studentCount || 0} Siswa
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-650 text-xs">
                  Belum ada sekolah terdaftar.
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Pengguna Online */}
        <Card className="bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-md font-bold text-zinc-200 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Pengguna Online ({stats.onlineUsers?.length || 0})</span>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-500">
                Pengguna aktif 5 menit terakhir beserta peran (role).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.onlineUsers && stats.onlineUsers.length > 0 ? (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {stats.onlineUsers.map((user) => {
                    let badgeColor = "bg-zinc-800 border-zinc-700 text-zinc-400";
                    if (user.role === 'Admin') {
                      badgeColor = "bg-indigo-950/40 text-indigo-400 border-indigo-900/30";
                    } else if (user.role === 'Kepala Sekolah') {
                      badgeColor = "bg-violet-950/40 text-violet-400 border-violet-900/30";
                    } else if (user.role === 'Wali Kelas') {
                      badgeColor = "bg-emerald-950/40 text-emerald-400 border-emerald-900/30";
                    }

                    return (
                      <div key={user.id} className="flex items-center justify-between p-2.5 bg-zinc-950/40 border border-zinc-850 rounded-xl hover:bg-zinc-900/10 transition-colors">
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-zinc-200 truncate">{user.name}</span>
                          <span className="text-[10px] text-zinc-500 truncate">{user.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 border text-[9px] font-semibold rounded-md uppercase tracking-wider shrink-0 ml-2 ${badgeColor}`}>
                          {user.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-650 text-xs">
                  Tidak ada pengguna online.
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Detail & Statistik Wali Kelas (Guru) */}
      <Card className="bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-md font-bold text-zinc-200 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-400" />
              <span>Statistik Wali Kelas (Guru)</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 mt-1">
              Ringkasan aktivitas pembelajaran, tingkat kehadiran siswa, jurnal, nilai, dan total tabungan kelas.
            </CardDescription>
          </div>
          <Link href="/admin/guru" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors shrink-0">
            <span>Kelola Guru</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mini KPI Ringkasan Aktivitas Sistem */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Total Siswa</p>
                <p className="text-base font-bold text-zinc-100">{stats.studentCount} Siswa</p>
              </div>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Rata2 Presensi</p>
                <p className="text-base font-bold text-zinc-100">{stats.overallAttendanceRate ?? 0}%</p>
              </div>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Total Jurnal</p>
                <p className="text-base font-bold text-zinc-100">{stats.totalJournalCount ?? 0} Entri</p>
              </div>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Total Tabungan</p>
                <p className="text-xs sm:text-sm font-bold text-zinc-100 truncate">{formatIDR(stats.totalSavingsBalance || 0)}</p>
              </div>
            </div>
          </div>

          {/* Tabel Statistik Wali Kelas */}
          {stats.teacherStats.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-zinc-850">
              <table className="w-full text-left text-sm text-zinc-300 border-collapse">
                <thead>
                  <tr className="bg-zinc-950/70 border-b border-zinc-800 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Guru</th>
                    <th className="py-3 px-4">Sekolah / Kelas</th>
                    <th className="py-3 px-4 text-center">Siswa</th>
                    <th className="py-3 px-4 text-center">Tingkat Kehadiran</th>
                    <th className="py-3 px-4 text-center">Jurnal</th>
                    <th className="py-3 px-4 text-center">Nilai</th>
                    <th className="py-3 px-4 text-right">Tabungan Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {stats.teacherStats.map((teacher) => {
                    const rate = teacher.attendanceRate ?? 0;
                    const hasAttendance = (teacher.totalAttendance ?? 0) > 0;

                    let rateBadgeClass = "bg-zinc-800 text-zinc-400 border-zinc-700";
                    if (hasAttendance) {
                      if (rate >= 85) {
                        rateBadgeClass = "bg-emerald-950/40 text-emerald-400 border-emerald-900/50";
                      } else if (rate >= 70) {
                        rateBadgeClass = "bg-amber-950/40 text-amber-400 border-amber-900/50";
                      } else {
                        rateBadgeClass = "bg-rose-950/40 text-rose-400 border-rose-900/50";
                      }
                    }

                    return (
                      <tr key={teacher.id} className="hover:bg-zinc-900/40 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors">
                              {teacher.name}
                            </span>
                            <span className="text-xs text-zinc-500">
                              {teacher.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-zinc-300 font-medium text-xs">{teacher.schoolName}</span>
                            <span className="bg-zinc-850 border border-zinc-750 text-zinc-300 px-2 py-0.5 rounded text-[11px] font-mono">
                              Kelas {teacher.className}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-200 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                            <Users className="h-3 w-3 text-indigo-400" />
                            {teacher.studentCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {hasAttendance ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border ${rateBadgeClass}`}>
                              {rate}% Hadir
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-500 italic">Belum Ada Log</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300 font-medium bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-lg">
                            <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                            {teacher.journalCount || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs text-zinc-300 font-medium bg-zinc-900/80 border border-zinc-800 px-2.5 py-1 rounded-lg">
                            <FileText className="h-3.5 w-3.5 text-violet-400" />
                            {teacher.gradeCount || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-1 rounded-lg">
                            {formatIDR(teacher.totalSavings || 0)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600 text-xs border border-dashed border-zinc-800 rounded-xl">
              <span className="text-indigo-400 font-semibold mb-1">Belum Ada Wali Kelas</span>
              Wali kelas yang mendaftar akan muncul di sini beserta statistiknya.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

