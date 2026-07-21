'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateMenuPreferences,
} from '@/actions/profileActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Sliders,
  Building,
  GraduationCap,
  Mail,
  Lock,
  Loader2,
  Check,
  Save,
  KeyRound,
  FileCheck2,
  Users,
  CalendarCheck2,
  Wallet,
  BookMarked,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ALL_MENUS = [
  { href: '/siswa', label: 'Data Siswa', desc: 'Manajemen profil, data diri, dan direktori siswa', icon: Users },
  { href: '/absensi', label: 'Absensi Kelas', desc: 'Pencatatan rekap kehadiran dan statistik kelas', icon: CalendarCheck2 },
  { href: '/nilai', label: 'Nilai Akademik', desc: 'Penginputan nilai mata pelajaran & standar KKM', icon: GraduationCap },
  { href: '/tabungan', label: 'Tabungan Siswa', desc: 'Pencatatan setoran & penarikan kas tabungan', icon: Wallet },
  { href: '/jurnal', label: 'Jurnal Wali Kelas', desc: 'Agenda harian mengajar guru & KBM', icon: BookMarked },
];

export default function ProfileClient() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'menus'>('profile');

  // Query Profile Data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    schoolName: '',
    className: '',
    nip: '',
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Enabled Menus State
  const [selectedMenus, setSelectedMenus] = useState<string[]>([]);

  // Sync state when profile is loaded
  React.useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || '',
        email: profile.email || '',
        schoolName: profile.schoolName || '',
        className: profile.className || '',
        nip: profile.nip || '-',
      });
      setSelectedMenus(profile.enabledMenus || ['/', '/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal']);
    }
  }, [profile]);

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Data profil berhasil diperbarui!');
      router.refresh();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui profil.');
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password berhasil diubah!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal mengubah password.');
    },
  });

  const [isReloading, setIsReloading] = useState(false);

  // Update Menu Preferences Mutation
  const updateMenusMutation = useMutation({
    mutationFn: (menus: string[]) => updateMenuPreferences(menus, true),
    onSuccess: (res) => {
      setIsReloading(true);
      toast.success('Pengaturan menu sidebar berhasil disimpan!');
      window.location.reload();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan menu.');
      setIsReloading(false);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok!');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleMenuToggle = (href: string) => {
    if (selectedMenus.includes(href)) {
      if (selectedMenus.length <= 1) {
        toast.error('Pilih setidaknya 1 menu fitur.');
        return;
      }
      setSelectedMenus(selectedMenus.filter((m) => m !== href));
    } else {
      setSelectedMenus([...selectedMenus, href]);
    }
  };

  const handleSaveMenus = () => {
    const finalMenus = Array.from(new Set(['/', ...selectedMenus, '/profile']));
    updateMenusMutation.mutate(finalMenus);
  };

  if (isLoading || isReloading) {
    return (
      <div className='flex flex-col items-center justify-center py-32 text-zinc-400 text-sm space-y-3 animate-fade-in'>
        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-950/80 border border-emerald-900/60 text-emerald-400 shadow-xl shadow-emerald-950/40'>
          <Loader2 className='h-6 w-6 animate-spin' />
        </div>
        <span className='font-bold text-zinc-200 text-base'>
          {isReloading ? 'Menyesuaikan susunan menu sidebar...' : 'Memuat data profil...'}
        </span>
        <span className='text-xs text-zinc-500'>
          {isReloading ? 'Memperbarui tampilan bilah navigasi Anda...' : 'Mohon tunggu sebentar'}
        </span>
      </div>
    );
  }

  const initialName = profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'G';

  return (
    <div className='space-y-6 max-w-4xl mx-auto animate-fade-in'>
      {/* Top Banner Header */}
      <Card className='bg-zinc-900/50 border-zinc-800 shadow-xl rounded-2xl overflow-hidden relative'>
        <div className='h-24 bg-gradient-to-r from-emerald-950 via-teal-950 to-zinc-950 border-b border-zinc-850/80 relative' />
        <div className='px-6 pb-6 pt-0 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 relative z-10'>
          <div className='flex items-end gap-4'>
            <div className='h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-xl shadow-emerald-500/20 border-2 border-zinc-900'>
              {initialName}
            </div>
            <div className='pb-1'>
              <h2 className='text-2xl font-bold text-white'>{profileForm.name || 'Guru Smart Class'}</h2>
              <p className='text-xs text-zinc-400 flex items-center gap-2 mt-0.5'>
                <span>{profileForm.email}</span>
                {profileForm.schoolName && (
                  <>
                    <span>•</span>
                    <span className='text-emerald-400 font-medium'>{profileForm.schoolName}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Switcher */}
      <div className='flex items-center gap-2 border-b border-zinc-800 pb-3 overflow-x-auto'>
        <Button
          onClick={() => setActiveTab('profile')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-10 px-4 gap-2 transition-all ${
            activeTab === 'profile'
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 shadow-md shadow-emerald-950/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <User className='h-4 w-4' />
          <span>Data Pribadi & Sekolah</span>
        </Button>

        <Button
          onClick={() => setActiveTab('security')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-10 px-4 gap-2 transition-all ${
            activeTab === 'security'
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 shadow-md shadow-emerald-950/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <ShieldCheck className='h-4 w-4' />
          <span>Keamanan & Password</span>
        </Button>

        <Button
          onClick={() => setActiveTab('menus')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-10 px-4 gap-2 transition-all ${
            activeTab === 'menus'
              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/60 shadow-md shadow-emerald-950/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
          }`}
        >
          <Sliders className='h-4 w-4' />
          <span>Pengaturan Menu Sidebar</span>
        </Button>
      </div>

      {/* TAB 1: DATA PRIBADI & SEKOLAH */}
      {activeTab === 'profile' && (
        <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl p-6'>
          <CardHeader className='p-0 pb-6 border-b border-zinc-800/80 mb-6'>
            <CardTitle className='text-lg font-bold text-zinc-100 flex items-center gap-2'>
              <User className='h-5 w-5 text-emerald-500' />
              Informasi Data Diri & Sekolah
            </CardTitle>
            <CardDescription className='text-xs text-zinc-400 mt-1'>
              Kelola nama lengkap, email login, identitas sekolah, dan NIP Anda.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleProfileSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-zinc-300 text-xs font-semibold flex items-center gap-2'>
                  <User className='h-3.5 w-3.5 text-zinc-500' />
                  <span>Nama Lengkap Guru</span>
                </Label>
                <Input
                  required
                  placeholder='Masukkan nama lengkap Anda'
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-zinc-300 text-xs font-semibold flex items-center gap-2'>
                  <Mail className='h-3.5 w-3.5 text-zinc-500' />
                  <span>Email Akun Login</span>
                </Label>
                <Input
                  type='email'
                  required
                  placeholder='contoh@sekolah.sch.id'
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-zinc-300 text-xs font-semibold flex items-center gap-2'>
                  <Building className='h-3.5 w-3.5 text-zinc-500' />
                  <span>Nama Sekolah</span>
                </Label>
                <Input
                  placeholder='Contoh: SMK 17 Seyegan'
                  value={profileForm.schoolName}
                  onChange={(e) => setProfileForm({ ...profileForm, schoolName: e.target.value })}
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-zinc-300 text-xs font-semibold flex items-center gap-2'>
                  <GraduationCap className='h-3.5 w-3.5 text-zinc-500' />
                  <span>Kelas yang Diampu (Kelas Wali)</span>
                </Label>
                <Input
                  placeholder='Contoh: X TKJ 1'
                  value={profileForm.className}
                  onChange={(e) => setProfileForm({ ...profileForm, className: e.target.value })}
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
                />
              </div>
            </div>

            <div className='space-y-1.5 sm:w-1/2'>
              <Label className='text-zinc-300 text-xs font-semibold flex items-center gap-2'>
                <FileCheck2 className='h-3.5 w-3.5 text-zinc-500' />
                <span>NIP Guru</span>
              </Label>
              <Input
                placeholder='-'
                value={profileForm.nip}
                onChange={(e) => setProfileForm({ ...profileForm, nip: e.target.value })}
                className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
              />
            </div>

            <div className='pt-4 flex justify-end border-t border-zinc-800/80'>
              <Button
                type='submit'
                disabled={updateProfileMutation.isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 h-10 gap-2 shadow-lg shadow-emerald-950/30'
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <>
                    <Save className='h-4 w-4' />
                    <span>Simpan Perubahan Profil</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: KEAMANAN & PASSWORD */}
      {activeTab === 'security' && (
        <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl p-6'>
          <CardHeader className='p-0 pb-6 border-b border-zinc-800/80 mb-6'>
            <CardTitle className='text-lg font-bold text-zinc-100 flex items-center gap-2'>
              <Lock className='h-5 w-5 text-emerald-500' />
              Ganti Kata Sandi
            </CardTitle>
            <CardDescription className='text-xs text-zinc-400 mt-1'>
              Perbarui kata sandi akun Anda secara berkala demi keamanan data.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handlePasswordSubmit} className='space-y-4 max-w-md'>
            <div className='space-y-1.5'>
              <Label className='text-zinc-300 text-xs font-semibold flex items-center gap-2'>
                <KeyRound className='h-3.5 w-3.5 text-zinc-500' />
                <span>Password Saat Ini</span>
              </Label>
              <Input
                type='password'
                required
                placeholder='Masukkan password lama'
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-zinc-300 text-xs font-semibold flex items-center gap-2'>
                <Lock className='h-3.5 w-3.5 text-zinc-500' />
                <span>Password Baru (Minimal 6 Karakter)</span>
              </Label>
              <Input
                type='password'
                required
                placeholder='Masukkan password baru'
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-zinc-300 text-xs font-semibold flex items-center gap-2'>
                <Lock className='h-3.5 w-3.5 text-zinc-500' />
                <span>Konfirmasi Password Baru</span>
              </Label>
              <Input
                type='password'
                required
                placeholder='Ulangi password baru'
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
              />
            </div>

            <div className='pt-4 flex justify-start border-t border-zinc-800/80'>
              <Button
                type='submit'
                disabled={changePasswordMutation.isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 h-10 gap-2 shadow-lg shadow-emerald-950/30'
              >
                {changePasswordMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <>
                    <ShieldCheck className='h-4 w-4' />
                    <span>Perbarui Password</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: PENGATURAN MENU SIDEBAR */}
      {activeTab === 'menus' && (
        <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl p-6'>
          <CardHeader className='p-0 pb-6 border-b border-zinc-800/80 mb-6'>
            <CardTitle className='text-lg font-bold text-zinc-100 flex items-center gap-2'>
              <Sliders className='h-5 w-5 text-emerald-500' />
              Kustomisasi Menu Navigation Sidebar
            </CardTitle>
            <CardDescription className='text-xs text-zinc-400 mt-1'>
              Pilih menu fitur mana saja yang ingin Anda tampilkan di bilah samping (sidebar). Menu <strong>Dashboard</strong> dan <strong>Profil Saya</strong> akan selalu tampil.
            </CardDescription>
          </CardHeader>

          <div className='space-y-3 mb-6'>
            {ALL_MENUS.map((menu) => {
              const isChecked = selectedMenus.includes(menu.href);
              const MenuIcon = menu.icon;
              return (
                <div
                  key={menu.href}
                  onClick={() => handleMenuToggle(menu.href)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300'
                      : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                  }`}
                >
                  <div className='flex items-center gap-3.5'>
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isChecked
                          ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50'
                          : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                      }`}
                    >
                      <MenuIcon className='h-5 w-5' />
                    </div>
                    <div>
                      <span className='text-sm font-bold text-zinc-200 block'>
                        {menu.label}
                      </span>
                      <span className='text-xs text-zinc-500 block mt-0.5'>
                        {menu.desc}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`h-6 w-6 rounded-lg border flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    {isChecked && <Check className='h-4 w-4 stroke-[3]' />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className='pt-4 flex items-center justify-between border-t border-zinc-800/80'>
            <span className='text-xs text-zinc-500'>
              {selectedMenus.length} dari {ALL_MENUS.length} menu modul diaktifkan
            </span>
            <Button
              type='button'
              onClick={handleSaveMenus}
              disabled={updateMenusMutation.isPending}
              className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 h-10 gap-2 shadow-lg shadow-emerald-950/30'
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
        </Card>
      )}
    </div>
  );
}
