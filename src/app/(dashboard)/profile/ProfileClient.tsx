'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  updateProfile,
  changePassword,
  updateMenuPreferences,
  addClass,
  deleteClass,
  switchActiveClass,
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
  Plus,
  Trash2,
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
import ConfirmDialog from '@/components/ConfirmDialog';

const ALL_MENUS = [
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

  const [activeTab, setActiveTab] = useState<'profile' | 'classes' | 'security'>(() => {
    if (tabParam === 'classes' || tabParam === 'security') return tabParam;
    return 'profile';
  });

  React.useEffect(() => {
    if (tabParam === 'classes' || tabParam === 'security' || tabParam === 'profile') {
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

  // Multi-Class Management State on Profile
  const [newClassInput, setNewClassInput] = useState('');
  const [isClassActionPending, setIsClassActionPending] = useState(false);

  const handleAddClassOnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newClassInput.trim();
    if (!clean) {
      toast.error('Nama kelas tidak boleh kosong.');
      return;
    }
    setIsClassActionPending(true);
    try {
      const res = await addClass(clean);
      if (res.success) {
        toast.success(`Kelas ${clean} berhasil ditambahkan!`);
        setNewClassInput('');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menambahkan kelas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan kelas.');
    } finally {
      setIsClassActionPending(false);
    }
  };

  const [deleteClassConfirm, setDeleteClassConfirm] = useState<{ open: boolean; className: string }>({
    open: false,
    className: '',
  });

  const promptDeleteClassOnProfile = (clsToDelete: string) => {
    if (isClassActionPending) return;
    setDeleteClassConfirm({ open: true, className: clsToDelete });
  };

  const handleConfirmDeleteClassOnProfile = async () => {
    const clsToDelete = deleteClassConfirm.className;
    if (!clsToDelete || isClassActionPending) return;
    setIsClassActionPending(true);
    try {
      const res = await deleteClass(clsToDelete);
      if (res.success) {
        toast.success(`Kelas ${clsToDelete} berhasil dihapus.`);
        setDeleteClassConfirm({ open: false, className: '' });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        window.location.reload();
      } else {
        toast.error(res.error || 'Gagal menghapus kelas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kelas.');
    } finally {
      setIsClassActionPending(false);
    }
  };

  const handleSwitchClassOnProfile = async (targetClass: string) => {
    if (isClassActionPending) return;
    setIsClassActionPending(true);
    try {
      const res = await switchActiveClass(targetClass);
      if (res.success) {
        toast.success(`Berhasil mengganti kelas aktif ke Kelas ${targetClass}`);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengganti kelas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengganti kelas.');
    } finally {
      setIsClassActionPending(false);
    }
  };

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
    if (!profileForm.schoolName.trim() || profileForm.schoolName.trim().length < 3) {
      toast.error('Nama sekolah wajib diisi minimal 3 karakter.');
      return;
    }
    if (!profileForm.className.trim()) {
      toast.error('Kelas diajar wajib diisi.');
      return;
    }
    if (!profileForm.nip.trim() || profileForm.nip.trim() === '-' || profileForm.nip.trim().length < 3) {
      toast.error('NIP/NUPTK Guru wajib diisi dengan NIP/NUPTK yang valid (tidak boleh "-").');
      return;
    }
    if (!profileForm.principalName.trim() || profileForm.principalName.trim().length < 3) {
      toast.error('Nama kepala sekolah minimal 3 karakter.');
      return;
    }
    if (!profileForm.principalNip.trim() || profileForm.principalNip.trim() === '-' || profileForm.principalNip.trim().length < 3) {
      toast.error('NIP kepala sekolah wajib diisi dengan NIP yang valid (tidak boleh "-").');
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
    <div className='space-y-6 max-w-4xl mx-auto animate-fade-in'>
      {/* Top Banner Header */}
      <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl overflow-hidden relative'>
        <div className='h-24 sm:h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border-b border-emerald-500/20 relative' />
        <div className='px-4 sm:px-6 pb-5 pt-0 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 sm:gap-4 -mt-10 relative z-10 text-center sm:text-left'>
          <div className='flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-4 w-full'>
            <div className='h-20 w-20 shrink-0 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-extrabold text-3xl shadow-md border-4 border-white'>
              {initialName}
            </div>
            <div className='pb-1 min-w-0 flex-1 w-full text-center sm:text-left'>
              <h2 className='text-xl sm:text-2xl font-extrabold text-slate-900 truncate'>
                {profileForm.name || 'Guru Smart Class'}
              </h2>
              <div className='text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1 font-medium justify-center sm:justify-start'>
                <span className='truncate'>{profileForm.email}</span>
                {profileForm.schoolName && (
                  <>
                    <span className='hidden sm:inline text-slate-300'>•</span>
                    <span className='text-emerald-700 font-bold truncate'>
                      {profileForm.schoolName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs Switcher */}
      <div className='grid grid-cols-1 sm:flex sm:items-center sm:gap-2 border-b border-slate-200 pb-3 gap-2'>
        <Button
          onClick={() => setActiveTab('profile')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center ${activeTab === 'profile'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <User className='h-4 w-4 shrink-0' />
          <span className='truncate'>Data Diri & Sekolah</span>
        </Button>

        <Button
          onClick={() => setActiveTab('classes')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center ${activeTab === 'classes'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <School className='h-4 w-4 shrink-0' />
          <span className='truncate'>Daftar Kelas Diampu</span>
        </Button>

        <Button
          onClick={() => setActiveTab('security')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center ${activeTab === 'security'
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
              Kelola nama lengkap, email login, identitas sekolah, dan NIP/NUPTK Anda.
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
                  <span>NIP/NUPTK Guru</span> <span className='text-rose-500'>*</span>
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
                  Data ini akan otomatis muncul pada kolom pengetahu/tanda tangan Kepala Sekolah di pratinjau cetak PDF dan ekspor Excel.
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5'>
                <div className='space-y-1.5'>
                  <Label className='text-slate-700 text-xs font-semibold flex items-center gap-2'>
                    <User className='h-3.5 w-3.5 text-slate-400' />
                    <span>Nama Kepala Sekolah</span> <span className='text-rose-500'>*</span>
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
                    <span>NIP Kepala Sekolah</span> <span className='text-rose-500'>*</span>
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

      {/* TAB 2: DAFTAR KELAS YANG DIAMPU */}
      {activeTab === 'classes' && (
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-6'>
          <CardHeader className='p-0 pb-5 border-b border-slate-200 mb-4'>
            <CardTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <School className='h-5 w-5 text-emerald-600' />
              Daftar Kelas yang Diampu (Multi-Kelas)
            </CardTitle>
            <CardDescription className='text-xs text-slate-500 mt-1'>
              Kelola seluruh kelas yang Anda ampu. Klik badge kelas untuk mengaktifkan konteks data kelas tersebut.
            </CardDescription>
          </CardHeader>

          <div className='space-y-4'>
            {/* Active / Available Classes List */}
            <div className='space-y-2'>
              <Label className='text-slate-700 text-xs font-semibold block'>
                DAFTAR KELAS SAAT INI
              </Label>
              <div className='flex flex-wrap gap-2'>
                {((profile?.classes && profile.classes.length > 0) ? profile.classes : [profile?.className || '5A']).map((cls: string) => {
                  const isActive = cls === (profile?.activeClass || profile?.className);
                  return (
                    <div
                      key={cls}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${isActive
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-emerald-600/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                    >
                      <button
                        type='button'
                        onClick={() => handleSwitchClassOnProfile(cls)}
                        disabled={isClassActionPending}
                        className='cursor-pointer hover:underline flex items-center gap-1.5'
                        title={isActive ? 'Kelas Sedang Aktif' : `Beralih ke Kelas ${cls}`}
                      >
                        <School className='h-3.5 w-3.5 shrink-0' />
                        <span>Kelas {cls}</span>
                        {isActive && (
                          <span className='text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded-md font-extrabold'>
                            AKTIF
                          </span>
                        )}
                      </button>

                      {/* Delete button (only if more than 1 class) */}
                      {((profile?.classes?.length || 1) > 1) && (
                        <button
                          type='button'
                          onClick={() => promptDeleteClassOnProfile(cls)}
                          disabled={isClassActionPending}
                          title={`Hapus Kelas ${cls}`}
                          className={`ml-1 hover:scale-110 transition-transform cursor-pointer ${isActive ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-rose-600'
                            }`}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Form Tambah Kelas Baru di Halaman Profile */}
            <form onSubmit={handleAddClassOnProfile} className='pt-2 border-t border-slate-100 space-y-2'>
              <Label className='text-slate-700 text-xs font-semibold block'>
                TAMBAH KELAS BARU
              </Label>
              <div className='flex gap-2 max-w-md'>
                <Input
                  placeholder='Contoh: 5B, 6A, VII C'
                  value={newClassInput}
                  onChange={(e) => setNewClassInput(e.target.value)}
                  disabled={isClassActionPending}
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-10'
                />
                <Button
                  type='submit'
                  disabled={isClassActionPending || !newClassInput.trim()}
                  className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-4 h-10 shrink-0 gap-1.5 cursor-pointer shadow-2xs'
                >
                  {isClassActionPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <>
                      <Plus className='h-4 w-4' />
                      <span>Tambah Kelas</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
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

          <form onSubmit={handlePasswordSubmit} className='space-y-4 max-w-md pt-2'>
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

      {/* Modal Confirm Hapus Kelas di Profile */}
      <ConfirmDialog
        open={deleteClassConfirm.open}
        onOpenChange={(open) => setDeleteClassConfirm((prev) => ({ ...prev, open }))}
        title="Hapus Kelas"
        description={`Apakah Anda yakin ingin menghapus Kelas ${deleteClassConfirm.className} dari daftar kelas Anda?`}
        confirmText="Hapus Kelas"
        cancelText="Batal"
        variant="danger"
        isLoading={isClassActionPending}
        onConfirm={handleConfirmDeleteClassOnProfile}
      />
    </div>
  );
}
