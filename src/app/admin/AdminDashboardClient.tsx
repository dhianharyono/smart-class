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
        <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-white border border-slate-200 rounded-2xl animate-pulse" />
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
      color: 'bg-white border-slate-200/80 text-indigo-700 shadow-xs',
      iconColor: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    },
    {
      title: 'Sekolah Terdaftar',
      value: stats.schoolCount,
      description: 'Sekolah yang terdata',
      icon: School,
      color: 'bg-white border-slate-200/80 text-blue-700 shadow-xs',
      iconColor: 'bg-blue-50 border-blue-200 text-blue-700',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-indigo-700 tracking-wider uppercase block">
              Ringkasan Sistem
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Admin Command Center
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1">
            Ikhtisar operasional, statistik guru, dan sekolah terdaftar di seluruh sistem.
          </p>
        </div>
        <Link href="/" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Home className="h-4 w-4 text-indigo-600" />
            <span>Kembali Ke Halaman Utama</span>
          </Button>
        </Link>
      </div>

      {/* Grid Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className={`${card.color} rounded-2xl relative overflow-hidden p-1`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-xl border ${card.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
                  {card.value}
                </div>
                <p className="text-[10px] text-slate-500 font-medium">{card.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 2-Column Section for Statistik Sekolah & Pengguna Online */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Statistik Sekolah */}
        <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-md font-bold text-slate-900">Statistik Sekolah</CardTitle>
                <CardDescription className="text-xs text-slate-500">Jumlah guru dan siswa per sekolah.</CardDescription>
              </div>
              <Link href="/admin/sekolah" className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-bold transition-colors shrink-0">
                <span>Kelola Sekolah</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {schools.length > 0 ? (
                <div className="overflow-x-auto min-w-0 max-w-full">
                  <table className="w-full min-w-[400px] text-left text-sm text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider bg-slate-50">
                        <th className="py-3 px-3">Nama Sekolah</th>
                        <th className="py-3 px-3 text-center">Guru</th>
                        <th className="py-3 px-3 text-center">Siswa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schools.map((school) => (
                        <tr key={school._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="py-3 px-3 font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                            {school.name}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-medium">
                            {school.teacherCount || 0} Guru
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-medium">
                            {school.studentCount || 0} Siswa
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
                  Belum ada sekolah terdaftar.
                </div>
              )}
            </CardContent>
          </div>
        </Card>

        {/* Pengguna Online */}
        <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-md font-bold text-slate-900 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>Pengguna Online ({stats.onlineUsers?.length || 0})</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Pengguna aktif 5 menit terakhir beserta peran (role).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.onlineUsers && stats.onlineUsers.length > 0 ? (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                  {stats.onlineUsers.map((user) => {
                    let badgeColor = "bg-slate-100 border-slate-200 text-slate-600";
                    if (user.role === 'Admin') {
                      badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
                    } else if (user.role === 'Kepala Sekolah') {
                      badgeColor = "bg-violet-50 text-violet-700 border-violet-200";
                    } else if (user.role === 'Wali Kelas') {
                      badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    }

                    return (
                      <div key={user.id} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100/80 transition-colors">
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-slate-900 truncate">{user.name}</span>
                          <span className="text-[10px] text-slate-500 truncate">{user.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-md uppercase tracking-wider shrink-0 ml-2 ${badgeColor}`}>
                          {user.role}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
                  Tidak ada pengguna online.
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Detail & Statistik Wali Kelas (Guru) */}
      <Card className="bg-white border-slate-200/80 rounded-2xl shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-md font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-indigo-600" />
              <span>Statistik Wali Kelas (Guru)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Ringkasan aktivitas pembelajaran, tingkat kehadiran siswa, jurnal, nilai, dan total tabungan kelas.
            </CardDescription>
          </div>
          <Link href="/admin/guru" className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-800 font-bold transition-colors shrink-0">
            <span>Kelola Guru</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Mini KPI Ringkasan Aktivitas Sistem */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Siswa</p>
                <p className="text-base font-extrabold text-slate-900">{stats.studentCount} Siswa</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rata2 Presensi</p>
                <p className="text-base font-extrabold text-slate-900">{stats.overallAttendanceRate ?? 0}%</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Jurnal</p>
                <p className="text-base font-extrabold text-slate-900">{stats.totalJournalCount ?? 0} Entri</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Tabungan</p>
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">{formatIDR(stats.totalSavingsBalance || 0)}</p>
              </div>
            </div>
          </div>

          {/* Tabel Statistik Wali Kelas */}
          {stats.teacherStats.length > 0 ? (
            <div className="overflow-x-auto min-w-0 max-w-full rounded-xl border border-slate-200">
              <table className="w-full min-w-[650px] text-left text-sm text-slate-700 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Guru</th>
                    <th className="py-3 px-4">Sekolah / Kelas</th>
                    <th className="py-3 px-4 text-center">Siswa</th>
                    <th className="py-3 px-4 text-center">Tingkat Kehadiran</th>
                    <th className="py-3 px-4 text-center">Jurnal</th>
                    <th className="py-3 px-4 text-center">Nilai</th>
                    <th className="py-3 px-4 text-right">Tabungan Kelas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.teacherStats.map((teacher) => {
                    const rate = teacher.attendanceRate ?? 0;
                    const hasAttendance = (teacher.totalAttendance ?? 0) > 0;

                    let rateBadgeClass = "bg-slate-100 text-slate-600 border-slate-200";
                    if (hasAttendance) {
                      if (rate >= 85) {
                        rateBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      } else if (rate >= 70) {
                        rateBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                      } else {
                        rateBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                      }
                    }

                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                              {teacher.name}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {teacher.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-slate-800 font-semibold text-xs">{teacher.schoolName}</span>
                            <span className="bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono font-medium">
                              Kelas {teacher.className}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            <Users className="h-3 w-3 text-indigo-600" />
                            {teacher.studentCount}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {hasAttendance ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg border ${rateBadgeClass}`}>
                              {rate}% Hadir
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum Ada Log</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                            {teacher.journalCount || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-semibold bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                            <FileText className="h-3.5 w-3.5 text-violet-600" />
                            {teacher.gradeCount || 0}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
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
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
              <span className="text-indigo-600 font-bold mb-1">Belum Ada Wali Kelas</span>
              Wali kelas yang mendaftar akan muncul di sini beserta statistiknya.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

