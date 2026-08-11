'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminProfile, updateAdminProfile } from '@/actions/adminActions';
import { changePassword } from '@/actions/profileActions';
import { toast } from 'sonner';
import {
  ShieldCheck,
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
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminProfileClient() {
  const queryClient = useQueryClient();

  // Fetch admin profile
  const { data: adminProfile, isLoading, error } = useQuery({
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
  const isPasswordMatching = isConfirmNotEmpty && passwordForm.newPassword === passwordForm.confirmPassword;
  const isPasswordMismatch = isConfirmNotEmpty && passwordForm.newPassword !== passwordForm.confirmPassword;

  // Submit Profile Changes
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profileForm.name.trim() || profileForm.name.trim().length < 3) {
      toast.error('Nama lengkap & gelar minimal 3 karakter.');
      return;
    }

    if (!profileForm.username.trim() || profileForm.username.trim().length < 3) {
      toast.error('Username minimal 3 karakter.');
      return;
    }

    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
    if (!USERNAME_REGEX.test(profileForm.username.trim().toLowerCase())) {
      toast.error('Username hanya boleh berisi huruf, angka, dan garis bawah (_).');
      return;
    }

    const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileForm.email.trim() || !EMAIL_REGEX.test(profileForm.email.trim().toLowerCase())) {
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
      toast.error('Password baru minimal 6 karakter dan mengandung huruf & angka.');
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
        <Loader2 className='h-8 w-8 animate-spin text-indigo-600' />
        <p className='text-xs font-semibold'>Memuat data profil administrator...</p>
      </div>
    );
  }

  if (error || !adminProfile) {
    return (
      <div className='min-h-[400px] flex flex-col items-center justify-center gap-3 text-rose-600 bg-rose-50 border border-rose-200 rounded-3xl p-8 max-w-md mx-auto text-center'>
        <AlertCircle className='h-10 w-10 text-rose-500' />
        <h3 className='font-extrabold text-base'>Gagal Memuat Profil</h3>
        <p className='text-xs text-rose-700 font-medium'>
          {(error as any)?.message || 'Data pengguna admin tidak dapat ditemukan.'}
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
    <div className='space-y-6 pb-12 animate-fade-in'>
      {/* Header Profile Badge Banner */}
      <div className='bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5'>
        <div className='absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none' />

        <div className='flex items-center gap-4 relative z-10'>
          <div className='h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-lg shrink-0'>
            {adminProfile.name ? adminProfile.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className='space-y-1 min-w-0'>
            <div className='inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/40 border border-white/20 text-[10px] font-extrabold uppercase tracking-wider text-indigo-100 backdrop-blur-md'>
              <ShieldCheck className='h-3.5 w-3.5 text-indigo-200' />
              <span>AKUN ADMINISTRATOR</span>
            </div>
            <h1 className='text-xl sm:text-2xl font-black tracking-tight text-white truncate'>
              {adminProfile.name || 'Administrator'}
            </h1>
            <p className='text-xs text-indigo-100 font-medium truncate flex items-center gap-2'>
              <span>@{adminProfile.username}</span>
              <span>•</span>
              <span>{adminProfile.email}</span>
            </p>
          </div>
        </div>

        <div className='inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-indigo-100 font-medium relative z-10 shrink-0'>
          <Calendar className='h-4 w-4 text-indigo-200' />
          <span>Terdaftar: {registeredDateStr}</span>
        </div>
      </div>

      {/* Main Grid Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* CARD 1: INFORMASI PROFIL ADMIN */}
        <div className='bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5 flex flex-col justify-between'>
          <div className='space-y-5'>
            <div className='flex items-center gap-3 pb-3 border-b border-slate-100'>
              <div className='h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0'>
                <User className='h-5 w-5' />
              </div>
              <div>
                <h2 className='text-base font-extrabold text-slate-900'>Informasi Admin</h2>
                <p className='text-xs text-slate-500 font-medium'>
                  Ubah nama lengkap, username, dan alamat email akun admin
                </p>
              </div>
            </div>

            <form id='admin-profile-form' onSubmit={handleProfileSubmit} className='space-y-4'>
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
                    placeholder='Contoh: Drs. Administrator, M.Kom'
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    disabled={updateProfileMutation.isPending}
                    className='w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs'
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
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                      })
                    }
                    disabled={updateProfileMutation.isPending}
                    className='w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs'
                  />
                </div>
                <p className='text-[11px] text-slate-400 font-medium'>
                  Huruf kecil, angka, dan garis bawah (_). Minimal 3-20 karakter.
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
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    disabled={updateProfileMutation.isPending}
                    className='w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs'
                  />
                </div>
              </div>
            </form>
          </div>

          <div className='pt-4 border-t border-slate-100'>
            <Button
              type='submit'
              form='admin-profile-form'
              disabled={updateProfileMutation.isPending}
              className='w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/20 transition-all text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2'
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
        </div>

        {/* CARD 2: UBAH PASSWORD ADMIN */}
        <div className='bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5 flex flex-col justify-between'>
          <div className='space-y-5'>
            <div className='flex items-center gap-3 pb-3 border-b border-slate-100'>
              <div className='h-10 w-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center shrink-0'>
                <KeyRound className='h-5 w-5' />
              </div>
              <div>
                <h2 className='text-base font-extrabold text-slate-900'>Ubah Password</h2>
                <p className='text-xs text-slate-500 font-medium'>
                  Perbarui kata sandi akun administrator Anda
                </p>
              </div>
            </div>

            <form id='admin-password-form' onSubmit={handlePasswordSubmit} className='space-y-4'>
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
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    disabled={changePasswordMutation.isPending}
                    className='w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs'
                  />
                  <button
                    type='button'
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                  >
                    {showCurrentPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
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
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    disabled={changePasswordMutation.isPending}
                    className='w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs'
                  />
                  <button
                    type='button'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                  >
                    {showNewPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
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
                      <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                        Min. 6 huruf
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      {hasLetter ? (
                        <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                      ) : (
                        <X className='h-3.5 w-3.5 text-slate-300 shrink-0' />
                      )}
                      <span className={hasLetter ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                        Huruf
                      </span>
                    </div>
                    <div className='flex items-center gap-1'>
                      {hasNumber ? (
                        <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                      ) : (
                        <X className='h-3.5 w-3.5 text-slate-300 shrink-0' />
                      )}
                      <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                        Angka
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password Baru */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                  KONFIRMASI PASSWORD BARU <span className='text-rose-500'>*</span>
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
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    disabled={changePasswordMutation.isPending}
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50/50 border ${
                      isPasswordMismatch
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                        : isPasswordMatching
                        ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20 bg-emerald-50/20'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                    } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs`}
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                  >
                    {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
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
          </div>

          <div className='pt-4 border-t border-slate-100'>
            <Button
              type='submit'
              form='admin-password-form'
              disabled={
                changePasswordMutation.isPending ||
                !passwordForm.currentPassword ||
                !isPasswordValid ||
                !isPasswordMatching
              }
              className='w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-violet-600/20 transition-all text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2'
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
        </div>
      </div>
    </div>
  );
}
