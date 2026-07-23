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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

const CONFIGURABLE_MENUS = [
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
        profile.enabledMenus || ['/', '/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal']
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

  const handleToggleMenu = (href: string) => {
    if (selectedMenus.includes(href)) {
      if (selectedMenus.length <= 1) {
        toast.error('Pilih setidaknya 1 menu fitur utama.');
        return;
      }
      setSelectedMenus(selectedMenus.filter((m) => m !== href));
    } else {
      setSelectedMenus([...selectedMenus, href]);
    }
  };

  const handleSelectAll = () => {
    setSelectedMenus(['/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal']);
    toast.info('Seluruh menu dipilih');
  };

  const handleResetDefault = () => {
    setSelectedMenus(['/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal']);
    toast.info('Pengaturan dikembalikan ke standar');
  };

  const handleSave = () => {
    const finalMenus = Array.from(
      new Set(['/', ...selectedMenus, '/profile', '/settings'])
    );
    updateMenusMutation.mutate(finalMenus);
  };

  if (isLoading || isReloading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-400 text-sm space-y-3 animate-fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-900/60 text-emerald-400 shadow-xl shadow-emerald-950/40">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <span className="font-bold text-zinc-200 text-base">
          {isReloading
            ? 'Menyesuaikan bilah navigasi Anda...'
            : 'Memuat pengaturan aplikasi...'}
        </span>
        <span className="text-xs text-zinc-500">
          {isReloading
            ? 'Halaman akan diperbarui otomatis...'
            : 'Mohon tunggu sebentar'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-850 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            Pengaturan Aplikasi
          </h2>
          <p className="text-zinc-400 text-xs mt-1">
            Kelola visibilitas menu navigasi sidebar dan preferensi tampilan dashboard Anda.
          </p>
        </div>
      </div>

      {/* Main Settings Card: Pengaturan Menu Sidebar */}
      <Card className="bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-850 pb-5">
          <div>
            <CardTitle className="text-md font-bold text-zinc-100 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-emerald-400" />
              <span>Kustomisasi Menu Sidebar</span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400 mt-1">
              Pilih menu modul mana saja yang ingin Anda tampilkan pada bilah navigasi utama.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleResetDefault}
              className="bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl text-xs h-9 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSelectAll}
              className="text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 rounded-lg h-8 px-2.5 font-medium"
            >
              Aktifkan Semua
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          <div className="grid gap-3.5">
            {/* Always Visible Menus Info */}
            <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-center justify-between opacity-80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-900 text-zinc-400 border border-zinc-800">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-zinc-200 block">
                    Dashboard Utama & Profil
                  </span>
                  <span className="text-[11px] text-zinc-500 block">
                    Menu wajib sistem (selalu ditampilkan)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded-md uppercase tracking-wider">
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
                  className={`flex items-start justify-between p-4 rounded-xl border transition-all cursor-pointer group ${isChecked
                    ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300 shadow-md shadow-emerald-950/10'
                    : 'bg-zinc-950/50 border-zinc-850 text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/30'
                    }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl border ${menu.color}`}>
                      <MenuIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-zinc-100 block group-hover:text-white transition-colors">
                        {menu.label}
                      </span>
                      <span className="text-xs text-zinc-400 block mt-0.5">
                        {menu.desc}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${isChecked
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-600'
                      }`}
                  >
                    {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Save Action Footer */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-850 mt-6">
            <span className="text-xs text-zinc-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>
                <strong>{selectedMenus.length}</strong> dari {CONFIGURABLE_MENUS.length} menu tambahan diaktifkan
              </span>
            </span>

            <Button
              type="button"
              onClick={handleSave}
              disabled={updateMenusMutation.isPending}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs h-10 px-6 gap-2 shadow-lg shadow-emerald-950/40"
            >
              {updateMenusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
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
