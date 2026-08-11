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
import { useRouter, useSearchParams } from 'next/navigation';
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
  Calendar,
  School,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const ALL_MENUS = [
  {
    href: '/kelas',
    label: 'Daftar Kelas',
    desc: 'Kelola daftar kelas yang diampu (multi-kelas)',
    icon: School,
  },
  {
    href: '/siswa',
    label: 'Data Siswa',
    desc: 'Manajemen profil, data diri, dan direktori siswa',
    icon: Users,
  },
  {
    href: '/absensi',
    label: 'Absensi Kelas',
    desc: 'Pencatatan rekap kehadiran dan statistik kelas',
    icon: CalendarCheck2,
  },
  {
    href: '/nilai',
    label: 'Nilai Akademik',
    desc: 'Penginputan nilai mata pelajaran & standar KKM',
    icon: GraduationCap,
  },
  {
    href: '/tabungan',
    label: 'Tabungan Siswa',
    desc: 'Pencatatan setoran & penarikan kas tabungan',
    icon: Wallet,
  },
  {
    href: '/jadwal',
    label: 'Jadwal & Alokasi',
    desc: 'Plotting jadwal pelajaran mingguan kelas & piket',
    icon: Calendar,
  },
  {
    href: '/jurnal',
    label: 'Jurnal Wali Kelas',
    desc: 'Agenda harian mengajar guru & KBM',
    icon: BookMarked,
  },
];

export default function ProfileClient() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>(() => {
    if (tabParam === 'security') return 'security';
    return 'profile';
  });

  React.useEffect(() => {
    if (tabParam === 'security' || tabParam === 'profile') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

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
    principalName: '',
    principalNip: '',
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
        className: profile.activeClass || profile.className || '',
        nip: profile.nip || '-',
        principalName: profile.principalName || '',
        principalNip: profile.principalNip || '-',
      });
      setSelectedMenus(
        profile.enabledMenus || [
          '/',
          '/kelas',
          '/siswa',
          '/absensi',
          '/nilai',
          '/tabungan',
          '/jadwal',
          '/jurnal',
        ],
      );
    }
  }, [profile]);

  // Update Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceHeaderInfo'] });
      queryClient.invalidateQueries({ queryKey: ['journalHeader'] });
      toast.success('Data profil berhasil diperbarui!');
      if (res?.teacher) {
        setProfileForm({
          name: res.teacher.name || '',
          email: res.teacher.email || '',
          schoolName: res.teacher.schoolName || '',
          className: res.teacher.className || '',
          nip: res.teacher.nip || '-',
          principalName: res.teacher.principalName || '',
          principalNip: res.teacher.principalNip || '-',
        });
      }
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
    if (!profileForm.name.trim() || profileForm.name.trim().length < 3) {
      toast.error('Nama lengkap & gelar minimal 3 karakter.');
      return;
    }
    if (
      !profileForm.schoolName.trim() ||
      profileForm.schoolName.trim().length < 3
    ) {
      toast.error('Nama sekolah wajib diisi minimal 3 karakter.');
      return;
    }
    if (!profileForm.className.trim()) {
      toast.error('Kelas diajar wajib diisi.');
      return;
    }
    if (
      !profileForm.nip.trim() ||
      profileForm.nip.trim() === '-' ||
      profileForm.nip.trim().length < 3
    ) {
      toast.error(
        'NIP/NUPTK Guru wajib diisi dengan NIP/NUPTK yang valid (tidak boleh "-").',
      );
      return;
    }
    if (
      !profileForm.principalName.trim() ||
      profileForm.principalName.trim().length < 3
    ) {
      toast.error('Nama kepala sekolah minimal 3 karakter.');
      return;
    }
    if (
      !profileForm.principalNip.trim() ||
      profileForm.principalNip.trim() === '-' ||
      profileForm.principalNip.trim().length < 3
    ) {
      toast.error(
        'NIP kepala sekolah wajib diisi dengan NIP yang valid (tidak boleh "-").',
      );
      return;
    }
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
      <div className='flex flex-col items-center justify-center py-32 text-slate-500 text-sm space-y-3 animate-fade-in'>
        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-xs'>
          <Loader2 className='h-6 w-6 animate-spin' />
        </div>
        <span className='font-bold text-slate-800 text-base'>
          {isReloading
            ? 'Menyesuaikan susunan menu sidebar...'
            : 'Memuat data profil...'}
        </span>
        <span className='text-xs text-slate-400'>
          {isReloading
            ? 'Memperbarui tampilan bilah navigasi Anda...'
            : 'Mohon tunggu sebentar'}
        </span>
      </div>
    );
  }

  const initialName = profileForm.name
    ? profileForm.name.charAt(0).toUpperCase()
    : 'G';

  return (
    <div className='space-y-6 sm:space-y-8 animate-fade-in'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between '>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900'>
            Profil & Pengaturan Akun
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Kelola informasi profil dan pengaturan akun Anda.
          </p>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className='grid grid-cols-1 sm:flex sm:items-center sm:gap-2 border-b border-slate-200 pb-3 gap-2'>
        <Button
          onClick={() => setActiveTab('profile')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center ${
            activeTab === 'profile'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className='h-4 w-4 shrink-0' />
          <span className='truncate'>Data Diri & Sekolah</span>
        </Button>

        <Button
          onClick={() => setActiveTab('security')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center ${
            activeTab === 'security'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className='h-4 w-4 shrink-0' />
          <span className='truncate'>Keamanan & Password</span>
        </Button>
      </div>

      {/* TAB 1: DATA PRIBADI & SEKOLAH */}
      {activeTab === 'profile' && (
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-6'>
          <CardHeader className='p-0 pb-6 border-b border-slate-200 mb-2'>
            <CardTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <User className='h-5 w-5 text-emerald-600' />
              Informasi Data Diri & Sekolah
            </CardTitle>
            <CardDescription className='text-xs text-slate-500 mt-1'>
              Kelola nama lengkap, email login, identitas sekolah, dan NIP/NUPTK
              Anda.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleProfileSubmit} className='space-y-4 pt-2'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
              <div className='space-y-1.5'>
                <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                  <User className='h-3.5 w-3.5 text-slate-400' />
                  <span>Nama Lengkap Guru</span>
                </Label>
                <Input
                  required
                  placeholder='Masukkan nama lengkap Anda'
                  value={profileForm.name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, name: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                  <Mail className='h-3.5 w-3.5 text-slate-400' />
                  <span>Email Akun Login</span>
                </Label>
                <Input
                  type='email'
                  required
                  placeholder='contoh@sekolah.sch.id'
                  value={profileForm.email}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, email: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
              <div className='space-y-1.5'>
                <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                  <Building className='h-3.5 w-3.5 text-slate-400' />
                  <span>Nama Sekolah</span>
                </Label>
                <Input
                  placeholder='Contoh: SMK 17 Seyegan'
                  value={profileForm.schoolName}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      schoolName: e.target.value,
                    })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                  <GraduationCap className='h-3.5 w-3.5 text-slate-400' />
                  <span>Kelas yang Diampu (Kelas Wali)</span>
                </Label>
                <Input
                  placeholder='Contoh: X TKJ 1'
                  value={profileForm.className}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      className: e.target.value,
                    })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
              <div className='space-y-1.5'>
                <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                  <FileCheck2 className='h-3.5 w-3.5 text-slate-400' />
                  <span>NIP/NUPTK Guru</span>{' '}
                  <span className='text-rose-500'>*</span>
                </Label>
                <Input
                  placeholder='Contoh: 19850101 201001 1 001 / NUPTK'
                  value={profileForm.nip}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, nip: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
                />
              </div>
            </div>

            {/* Sub-Section: Data Kepala Sekolah */}
            <div className='pt-5 mt-2 border-t border-slate-200 space-y-4'>
              <div>
                <h4 className='text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5'>
                  <Building className='h-3.5 w-3.5 text-emerald-600' />
                  <span>Data Kepala Sekolah</span>
                </h4>
                <p className='text-[11px] text-slate-500 mt-0.5'>
                  Data ini akan otomatis muncul pada kolom pengetahu/tanda
                  tangan Kepala Sekolah di pratinjau cetak PDF dan ekspor Excel.
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
                <div className='space-y-1.5'>
                  <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                    <User className='h-3.5 w-3.5 text-slate-400' />
                    <span>Nama Kepala Sekolah</span>{' '}
                    <span className='text-rose-500'>*</span>
                  </Label>
                  <Input
                    placeholder='Contoh: Drs. H. Ahmad Dahlan, M.Pd.'
                    value={profileForm.principalName}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        principalName: e.target.value,
                      })
                    }
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                    <FileCheck2 className='h-3.5 w-3.5 text-slate-400' />
                    <span>NIP Kepala Sekolah</span>{' '}
                    <span className='text-rose-500'>*</span>
                  </Label>
                  <Input
                    placeholder='Contoh: 19750812 200003 1 002'
                    value={profileForm.principalNip}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        principalNip: e.target.value,
                      })
                    }
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
                  />
                </div>
              </div>
            </div>

            <div className='pt-5 mt-2 flex justify-end border-t border-slate-200'>
              <Button
                type='submit'
                disabled={updateProfileMutation.isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 h-10 gap-2 shadow-xs'
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
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-6'>
          <CardHeader className='p-0 pb-6 border-b border-slate-200 mb-2'>
            <CardTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <Lock className='h-5 w-5 text-emerald-600' />
              Ganti Kata Sandi
            </CardTitle>
            <CardDescription className='text-xs text-slate-500 mt-1'>
              Perbarui kata sandi akun Anda secara berkala demi keamanan data.
            </CardDescription>
          </CardHeader>

          <form
            onSubmit={handlePasswordSubmit}
            className='space-y-4 max-w-md pt-2'
          >
            <div className='space-y-1.5'>
              <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                <KeyRound className='h-3.5 w-3.5 text-slate-400' />
                <span>Password Saat Ini</span>
              </Label>
              <Input
                type='password'
                required
                placeholder='Masukkan password lama'
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value,
                  })
                }
                className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                <Lock className='h-3.5 w-3.5 text-slate-400' />
                <span>Password Baru (Minimal 6 Karakter)</span>
              </Label>
              <Input
                type='password'
                required
                placeholder='Masukkan password baru'
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value,
                  })
                }
                className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                <Lock className='h-3.5 w-3.5 text-slate-400' />
                <span>Konfirmasi Password Baru</span>
              </Label>
              <Input
                type='password'
                required
                placeholder='Ulangi password baru'
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs sm:text-sm h-10 px-3.5'
              />
            </div>

            <div className='pt-4 flex justify-start border-t border-slate-200'>
              <Button
                type='submit'
                disabled={changePasswordMutation.isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 h-10 gap-2 shadow-xs'
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

    </div>
  );
}
