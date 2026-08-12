'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProfile, updateAdminProfile } from '@/actions/adminActions';
import { changePassword } from '@/actions/profileActions';
import { toast } from 'sonner';
import {
  User,
  Mail,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Save,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AdminProfileClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  // Fetch admin profile
  const {
    data: adminProfile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['adminProfile'],
    queryFn: getAdminProfile,
  });

  // Admin Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    username: '',
    email: '',
  });

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync profile data to form once loaded
  useEffect(() => {
    if (adminProfile) {
      setProfileForm({
        name: adminProfile.name || '',
        username: adminProfile.username || '',
        email: adminProfile.email || '',
      });
    }
  }, [adminProfile]);

  // Update Admin Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: updateAdminProfile,
    onSuccess: (res) => {
      if (res.success) {
        toast.success('Profil Administrator berhasil diperbarui!');
        queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
        window.location.reload();
      } else {
        toast.error(res.error || 'Gagal memperbarui profil admin.');
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal memperbarui profil admin.');
    },
  });

  // Change Password Mutation
  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: (res) => {
      toast.success('Password Administrator berhasil diubah!');
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

  // Password Validation criteria
  const hasMinLength = passwordForm.newPassword.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(passwordForm.newPassword);
  const hasNumber = /\d/.test(passwordForm.newPassword);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  const isConfirmNotEmpty = passwordForm.confirmPassword.length > 0;
  const isPasswordMatching =
    isConfirmNotEmpty &&
    passwordForm.newPassword === passwordForm.confirmPassword;
  const isPasswordMismatch =
    isConfirmNotEmpty &&
    passwordForm.newPassword !== passwordForm.confirmPassword;

  // Submit Profile Changes
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.name.trim() || profileForm.name.trim().length < 3) {
      toast.error('Nama lengkap & gelar minimal 3 karakter.');
      return;
    }

    if (
      !profileForm.username.trim() ||
      profileForm.username.trim().length < 3
    ) {
      toast.error('Username minimal 3 karakter.');
      return;
    }

    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
    if (!USERNAME_REGEX.test(profileForm.username.trim().toLowerCase())) {
      toast.error(
        'Username hanya boleh berisi huruf, angka, dan garis bawah (_).',
      );
      return;
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      !profileForm.email.trim() ||
      !EMAIL_REGEX.test(profileForm.email.trim().toLowerCase())
    ) {
      toast.error('Format email tidak valid.');
      return;
    }

    updateProfileMutation.mutate(profileForm);
  };

  // Submit Password Change
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error('Password saat ini wajib diisi.');
      return;
    }

    if (!isPasswordValid) {
      toast.error(
        'Password baru minimal 6 karakter dan mengandung huruf & angka.',
      );
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok dengan password baru!');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isLoading) {
    return (
      <div className='min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-500'>
        <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
        <p className='text-xs font-semibold'>
          Memuat data profil administrator...
        </p>
      </div>
    );
  }

  if (error || !adminProfile) {
    return (
      <div className='min-h-[400px] flex flex-col items-center justify-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-3xl p-8 max-w-md mx-auto text-center'>
        <AlertCircle className='h-10 w-10 text-rose-500' />
        <h3 className='font-extrabold text-base'>Gagal Memuat Profil</h3>
        <p className='text-xs text-rose-700 font-medium'>
          {(error as any)?.message ||
            'Data pengguna admin tidak dapat ditemukan.'}
        </p>
      </div>
    );
  }

  const registeredDateStr = adminProfile.createdAt
    ? new Date(adminProfile.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <div className='space-y-6 sm:space-y-8 pb-12 animate-fade-in'>
      {/* Header Page Title */}
      <div className='flex flex-col gap-1'>
        <h1 className='text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight'>
          Profil & Pengaturan Administrator
        </h1>
        <p className='text-xs sm:text-sm text-slate-500 font-medium'>
          Kelola data akun administrator dan amankan kredensial sistem secara
          berkala.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div className='grid grid-cols-2 sm:flex sm:items-center sm:gap-2 border-b border-slate-200 pb-3 gap-2'>
        <Button
          onClick={() => setActiveTab('info')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-11 px-4 sm:px-5 gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center ${
            activeTab === 'info'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className='h-4 w-4 shrink-0' />
          <span>Informasi Admin</span>
        </Button>

        <Button
          onClick={() => setActiveTab('security')}
          variant='ghost'
          className={`rounded-xl text-xs font-semibold h-11 px-4 sm:px-5 gap-2 transition-all cursor-pointer w-full sm:w-auto justify-center ${
            activeTab === 'security'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className='h-4 w-4 shrink-0' />
          <span>Ubah Password</span>
        </Button>
      </div>

      {/* TAB 1: INFORMASI ADMIN */}
      {activeTab === 'info' && (
        <Card className='bg-white rounded-3xl border border-slate-200/90 shadow-xs max-w-3xl'>
          <CardHeader className='p-6 sm:p-8 pb-4 border-b border-slate-100'>
            <div className='flex items-center gap-3.5'>
              <div className='h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs'>
                <User className='h-5 w-5' />
              </div>
              <div>
                <CardTitle className='text-base sm:text-lg font-bold text-slate-900'>
                  Informasi Admin
                </CardTitle>
                <CardDescription className='text-xs text-slate-500 mt-0.5'>
                  Perbarui nama lengkap, username, dan alamat email akun
                  administrator
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className='p-6 sm:p-8 space-y-5'>
            <form
              id='admin-profile-form'
              onSubmit={handleProfileSubmit}
              className='space-y-5'
            >
              {/* Nama Lengkap */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                  NAMA LENGKAP & GELAR <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <User className='h-4 w-4' />
                  </div>
                  <input
                    type='text'
                    required
                    placeholder='Contoh: Admin Smart Class, M.Kom'
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    disabled={updateProfileMutation.isPending}
                    className='w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs disabled:opacity-50'
                  />
                </div>
              </div>

              {/* Username */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                  USERNAME <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <AtSign className='h-4 w-4' />
                  </div>
                  <input
                    type='text'
                    required
                    placeholder='username_admin'
                    value={profileForm.username}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        username: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, ''),
                      })
                    }
                    disabled={updateProfileMutation.isPending}
                    className='w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs disabled:opacity-50'
                  />
                </div>
                <p className='text-[11px] text-slate-400 font-medium'>
                  Huruf kecil, angka, dan garis bawah (_). Minimal 3-20
                  karakter.
                </p>
              </div>

              {/* Email */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                  ALAMAT EMAIL <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <Mail className='h-4 w-4' />
                  </div>
                  <input
                    type='email'
                    required
                    placeholder='admin@smartclass.sch.id'
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, email: e.target.value })
                    }
                    disabled={updateProfileMutation.isPending}
                    className='w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs disabled:opacity-50'
                  />
                </div>
              </div>
            </form>

            <div className='pt-3 border-t border-slate-100 flex justify-end'>
              <Button
                type='submit'
                form='admin-profile-form'
                disabled={updateProfileMutation.isPending}
                className='w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2'
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>MENYIMPAN PROFIL...</span>
                  </>
                ) : (
                  <>
                    <Save className='h-4 w-4' />
                    <span>SIMPAN PROFIL ADMIN</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: UBAH PASSWORD */}
      {activeTab === 'security' && (
        <Card className='bg-white rounded-3xl border border-slate-200/90 shadow-xs max-w-3xl'>
          <CardHeader className='p-6 sm:p-8 pb-4 border-b border-slate-100'>
            <div className='flex items-center gap-3.5'>
              <div className='h-11 w-11 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 shadow-xs'>
                <KeyRound className='h-5 w-5' />
              </div>
              <div>
                <CardTitle className='text-base sm:text-lg font-bold text-slate-900'>
                  Ubah Password
                </CardTitle>
                <CardDescription className='text-xs text-slate-500 mt-0.5'>
                  Perbarui kata sandi akun administrator Anda secara aman
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className='p-6 sm:p-8 space-y-5'>
            <form
              id='admin-password-form'
              onSubmit={handlePasswordSubmit}
              className='space-y-5'
            >
              {/* Password Saat Ini */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                  PASSWORD SAAT INI <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <Lock className='h-4 w-4' />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    placeholder='Masukkan password saat ini'
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    disabled={changePasswordMutation.isPending}
                    className='w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs disabled:opacity-50'
                  />
                  <button
                    type='button'
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                  >
                    {showCurrentPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Baru */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                  PASSWORD BARU <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <Lock className='h-4 w-4' />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder='Buat password baru (min. 6 karakter)'
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    disabled={changePasswordMutation.isPending}
                    className='w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs disabled:opacity-50'
                  />
                  <button
                    type='button'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                  >
                    {showNewPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>

                {/* Password Criteria Checklist */}
                {passwordForm.newPassword.length > 0 && (
                  <div className='grid grid-cols-3 gap-1 pt-1.5 text-[11px] text-slate-600'>
                    <div className='flex items-center gap-1'>
                      {hasMinLength ? (
                        <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                      ) : (
                        <X className='h-3.5 w-3.5 text-slate-300 shrink-0' />
                      )}
                      <span
                        className={
                          hasMinLength
                            ? 'text-emerald-700 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Min. 6 huruf
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      {hasLetter ? (
                        <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                      ) : (
                        <X className='h-3.5 w-3.5 text-slate-300 shrink-0' />
                      )}
                      <span
                        className={
                          hasLetter
                            ? 'text-emerald-700 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Huruf
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      {hasNumber ? (
                        <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                      ) : (
                        <X className='h-3.5 w-3.5 text-slate-300 shrink-0' />
                      )}
                      <span
                        className={
                          hasNumber
                            ? 'text-emerald-700 font-medium'
                            : 'text-slate-400'
                        }
                      >
                        Angka
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password Baru */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                  KONFIRMASI PASSWORD BARU{' '}
                  <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <Lock className='h-4 w-4' />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder='Ulangi password baru Anda'
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    disabled={changePasswordMutation.isPending}
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border ${
                      isPasswordMismatch
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                        : isPasswordMatching
                          ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/20'
                          : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                    } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs disabled:opacity-50`}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>

                {isPasswordMismatch && (
                  <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                    <X className='h-3.5 w-3.5 shrink-0' />
                    <span>Konfirmasi password tidak cocok.</span>
                  </p>
                )}
                {isPasswordMatching && (
                  <p className='text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1'>
                    <Check className='h-3.5 w-3.5 shrink-0' />
                    <span>Password baru cocok.</span>
                  </p>
                )}
              </div>
            </form>

            <div className='pt-3 border-t border-slate-100 flex justify-end'>
              <Button
                type='submit'
                form='admin-password-form'
                disabled={
                  changePasswordMutation.isPending ||
                  !passwordForm.currentPassword ||
                  !isPasswordValid ||
                  !isPasswordMatching
                }
                className='w-full sm:w-auto bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-md shadow-teal-600/20 transition-all text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2'
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>MEMPROSES...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className='h-4 w-4' />
                    <span>UBAH PASSWORD ADMIN</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
