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
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface TeacherStat {
  id: string;
  name: string;
  email: string;
  schoolName: string;
  className: string;
  studentCount: number;
  totalSavings: number;
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
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
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

      {/* Detail Guru */}
      <Card className="bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-md font-bold text-zinc-200">Statistik Wali Kelas (Guru)</CardTitle>
            <CardDescription className="text-xs text-zinc-500">Performa kelas, sekolah, dan jumlah siswa per wali kelas.</CardDescription>
          </div>
          <Link href="/admin/guru" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            <span>Kelola Guru</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {stats.teacherStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-300 border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Nama Guru</th>
                    <th className="py-3 px-4">Sekolah</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4 text-center">Jumlah Siswa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {stats.teacherStats.map((teacher) => (
                    <tr key={teacher.id} className="hover:bg-zinc-900/20 transition-colors group">
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
                      <td className="py-3.5 px-4 text-zinc-300">{teacher.schoolName}</td>
                      <td className="py-3.5 px-4">
                        <span className="bg-zinc-800 border border-zinc-700/50 text-zinc-300 px-2 py-0.5 rounded text-xs font-mono">
                          {teacher.className}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-zinc-200 font-medium">
                        {teacher.studentCount} Siswa
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-600 text-xs">
              <span className="text-indigo-400 font-semibold mb-1">Belum Ada Wali Kelas</span>
              Wali kelas yang mendaftar akan muncul di sini beserta statistiknya.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
