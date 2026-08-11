'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProfile, updateMenuPreferences } from '@/actions/profileActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  Settings,
  Sliders,
  Users,
  CalendarCheck2,
  GraduationCap,
  Wallet,
  BookMarked,
  Check,
  Save,
  Loader2,
  User,
  ShieldCheck,
  Sparkles,
  LayoutDashboard,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Monitor,
  Calendar,
  School,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';

const CONFIGURABLE_MENUS = [
  {
    href: '/kelas',
    label: 'Daftar Kelas',
    desc: 'Kelola daftar kelas yang diampu (multi-kelas)',
    icon: School,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  {
    href: '/siswa',
    label: 'Data Siswa',
    desc: 'Manajemen data profil, direktori, dan data induk siswa',
    icon: Users,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    href: '/absensi',
    label: 'Absensi Kelas',
    desc: 'Pencatatan daftar hadir harian & rekap presensi kelas',
    icon: CalendarCheck2,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    href: '/nilai',
    label: 'Nilai Akademik',
    desc: 'Penginputan nilai mata pelajaran, tugas, UTS, UAS & KKM',
    icon: GraduationCap,
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  {
    href: '/tabungan',
    label: 'Tabungan Siswa',
    desc: 'Pencatatan transaksi setoran, penarikan, & saldo kas siswa',
    icon: Wallet,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    href: '/jadwal',
    label: 'Jadwal & Alokasi Pelajaran',
    desc: 'Plotting jadwal pelajaran mingguan kelas & jadwal piket',
    icon: Calendar,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    href: '/piket',
    label: 'Piket Kelas',
    desc: 'Pengaturan kelompok petugas piket harian siswa',
    icon: CheckCircle2,
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  },
  {
    href: '/jurnal',
    label: 'Jurnal Wali Kelas',
    desc: 'Agenda harian mengajar guru & rekaman kegiatan KBM',
    icon: BookMarked,
    color: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  },
];

export default function SettingsClient() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query Profile Data for initial menu state
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });

  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);
  const [isReloading, setIsReloading] = useState(false);

  // Sync state when profile loads
  React.useEffect(() => {
    if (profile) {
      setSelectedMenus(
        profile.enabledMenus && profile.enabledMenus.length > 0
          ? profile.enabledMenus
          : [
              '/dashboard',
              '/kelas',
              '/siswa',
              '/absensi',
              '/nilai',
              '/tabungan',
              '/jadwal',
              '/piket',
              '/jurnal',
              '/profile',
              '/settings',
            ],
      );
    }
  }, [profile]);

  // Update Menu Preferences Mutation
  const updateMenusMutation = useMutation({
    mutationFn: (menus: string[]) => updateMenuPreferences(menus, true),
    onSuccess: () => {
      setIsReloading(true);
      toast.success('Pengaturan menu sidebar berhasil diperbarui!');
      window.location.reload();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan pengaturan menu.');
      setIsReloading(false);
    },
  });

  const ALL_CONFIGURABLE_HREFS = CONFIGURABLE_MENUS.map((m) => m.href);
  const isAllSelected = ALL_CONFIGURABLE_HREFS.every((href) =>
    selectedMenus.includes(href),
  );
  const activeConfigurableCount = selectedMenus.filter((href) =>
    ALL_CONFIGURABLE_HREFS.includes(href),
  ).length;

  const handleToggleMenu = (href: string) => {
    const activeConfigurable = selectedMenus.filter((m) =>
      ALL_CONFIGURABLE_HREFS.includes(m),
    );
    if (selectedMenus.includes(href)) {
      if (activeConfigurable.length <= 1) {
        toast.error('Pilih setidaknya 1 menu fitur utama.');
        return;
      }
      setSelectedMenus(selectedMenus.filter((m) => m !== href));
    } else {
      setSelectedMenus([...selectedMenus, href]);
    }
  };

  const handleToggleAll = () => {
    if (isAllSelected) {
      const nonConfigurable = selectedMenus.filter(
        (m) => !ALL_CONFIGURABLE_HREFS.includes(m),
      );
      setSelectedMenus([...nonConfigurable, ALL_CONFIGURABLE_HREFS[0]]);
      toast.info('Semua menu tambahan dinonaktifkan');
    } else {
      const nonConfigurable = selectedMenus.filter(
        (m) => !ALL_CONFIGURABLE_HREFS.includes(m),
      );
      setSelectedMenus([...nonConfigurable, ...ALL_CONFIGURABLE_HREFS]);
      toast.info('Seluruh menu tambahan diaktifkan');
    }
  };

  const handleResetDefault = () => {
    const nonConfigurable = selectedMenus.filter(
      (m) => !ALL_CONFIGURABLE_HREFS.includes(m),
    );
    setSelectedMenus([...nonConfigurable, ...ALL_CONFIGURABLE_HREFS]);
    toast.info('Pengaturan dikembalikan ke standar');
  };

  const handleSave = () => {
    const finalMenus = Array.from(
      new Set(['/', ...selectedMenus, '/profile', '/settings']),
    );
    updateMenusMutation.mutate(finalMenus);
  };

  if (isLoading || isReloading) {
    return (
      <div className='flex flex-col items-center justify-center py-32 text-slate-500 text-sm space-y-3 animate-fade-in'>
        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-xs'>
          <Loader2 className='h-6 w-6 animate-spin' />
        </div>
        <span className='font-bold text-slate-800 text-base'>
          {isReloading
            ? 'Menyesuaikan bilah navigasi Anda...'
            : 'Memuat pengaturan aplikasi...'}
        </span>
        <span className='text-xs text-slate-400'>
          {isReloading
            ? 'Halaman akan diperbarui otomatis...'
            : 'Mohon tunggu sebentar'}
        </span>
      </div>
    );
  }

  return (
    <div className='space-y-6 sm:space-y-6 animate-fade-in'>
      {/* Header */}
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between '>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900'>
            Pengaturan Aplikasi
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Kelola visibilitas menu navigasi sidebar dan preferensi tampilan
            dashboard Anda.
          </p>
        </div>
      </div>

      {/* Main Settings Card: Pengaturan Menu Sidebar */}
      <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs'>
        <CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5'>
          <div>
            <CardTitle className='text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2'>
              <span>Kustomisasi Menu Sidebar</span>
            </CardTitle>
            <CardDescription className='text-xs sm:text-sm text-slate-500 mt-1'>
              Pilih menu modul mana saja yang ingin Anda tampilkan pada bilah
              navigasi utama.
            </CardDescription>
          </div>

          <div className='flex items-center gap-2 shrink-0'>
            <Button
              type='button'
              variant='outline'
              onClick={handleResetDefault}
              className='bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs h-9 gap-1.5 shadow-xs font-semibold cursor-pointer'
            >
              <RotateCcw className='h-3.5 w-3.5' />
              <span>Reset</span>
            </Button>
            <Button
              type='button'
              variant='ghost'
              onClick={handleToggleAll}
              className={`text-xs rounded-lg h-8 px-2.5 font-bold cursor-pointer transition-colors ${
                isAllSelected
                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                  : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              {isAllSelected ? 'Nonaktifkan Semua' : 'Aktifkan Semua'}
            </Button>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4'>
            {/* Always Visible Menus Info */}
            <div className='md:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between'>
              <div className='flex items-center gap-3'>
                <div className='p-2.5 rounded-xl bg-white text-slate-500 border border-slate-200 shrink-0'>
                  <LayoutDashboard className='h-5 w-5' />
                </div>
                <div>
                  <span className='text-xs sm:text-sm font-bold text-slate-800 block'>
                    Dashboard Utama & Profil
                  </span>
                  <span className='text-[11px] sm:text-xs text-slate-500 block'>
                    Menu wajib sistem (selalu ditampilkan)
                  </span>
                </div>
              </div>
              <span className='px-2.5 py-1 text-[10px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md uppercase tracking-wider shrink-0'>
                Wajib
              </span>
            </div>

            {/* Configurable Menu Items */}
            {CONFIGURABLE_MENUS.map((menu) => {
              const isChecked = selectedMenus.includes(menu.href);
              const MenuIcon = menu.icon;
              return (
                <div
                  key={menu.href}
                  onClick={() => handleToggleMenu(menu.href)}
                  className={`flex items-start justify-between p-4 rounded-xl border transition-all cursor-pointer group ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900 shadow-xs'
                      : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/80'
                  }`}
                >
                  <div className='flex items-start gap-3.5 min-w-0 pr-2'>
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${menu.color}`}
                    >
                      <MenuIcon className='h-5 w-5' />
                    </div>
                    <div className='min-w-0'>
                      <span className='text-xs sm:text-sm font-bold text-slate-900 block group-hover:text-emerald-800 transition-colors'>
                        {menu.label}
                      </span>
                      <span className='text-xs text-slate-500 block mt-0.5 font-medium'>
                        {menu.desc}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-xs'
                        : 'border-slate-300 bg-white group-hover:border-slate-400'
                    }`}
                  >
                    {isChecked && <Check className='h-4 w-4 stroke-[3]' />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Save Action Footer */}
          <div className='pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 mt-6'>
            <span className='text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 font-medium'>
              <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0' />
              <span>
                <strong className='text-slate-900'>
                  {activeConfigurableCount}
                </strong>{' '}
                dari {CONFIGURABLE_MENUS.length} menu tambahan diaktifkan
              </span>
            </span>

            <Button
              type='button'
              onClick={handleSave}
              disabled={updateMenusMutation.isPending}
              className='w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm h-10 px-6 gap-2 shadow-xs cursor-pointer'
            >
              {updateMenusMutation.isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <>
                  <Save className='h-4 w-4' />
                  <span>Simpan Pengaturan Menu</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
