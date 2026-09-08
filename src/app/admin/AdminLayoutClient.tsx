'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  School,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  User,
  MessageSquareText,
  ChevronDown,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
} from 'lucide-react';
import { updateAdminProfile } from '@/actions/adminActions';
import { changePassword } from '@/actions/profileActions';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ConfirmDialog';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface SidebarGroup {
  category: string;
  items: SidebarItem[];
}

const adminMenuGroups: SidebarGroup[] = [
  {
    category: 'MENU UTAMA',
    items: [{ name: 'Dashboard', href: '/admin', icon: LayoutDashboard }],
  },
  {
    category: 'MANAJEMEN MASTER',
    items: [
      { name: 'Kelola Sekolah', href: '/admin/sekolah', icon: School },
      { name: 'Kelola Wali Kelas', href: '/admin/guru', icon: Users },
      { name: 'Kelola Kritik & Saran', href: '/admin/feedback', icon: MessageSquareText },
    ],
  },
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  admin: {
    name: string;
    email: string;
    username?: string;
  };
}

export default function AdminLayoutClient({
  children,
  admin,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const toggleSidebar = () => setMobileOpen(!mobileOpen);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Admin Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<'profile' | 'security'>('profile');
  const [profileModalForm, setProfileModalForm] = useState({
    name: admin.name || 'Admin Smart Class',
    username: admin.username || '',
    email: admin.email || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  React.useEffect(() => {
    setProfileModalForm({
      name: admin.name || 'Admin Smart Class',
      username: admin.username || '',
      email: admin.email || '',
    });
  }, [admin]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileModalForm.name.trim() || profileModalForm.name.trim().length < 3) {
      toast.error('Nama admin minimal 3 karakter.');
      return;
    }
    if (!profileModalForm.username.trim()) {
      toast.error('Username wajib diisi.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await updateAdminProfile({
        name: profileModalForm.name.trim(),
        username: profileModalForm.username.trim(),
        email: profileModalForm.email.trim(),
      });
      if (res.success) {
        toast.success('Profil Administrator berhasil disimpan!');
        setIsProfileModalOpen(false);
        window.location.reload();
      } else {
        toast.error((res as any).error || 'Gagal menyimpan profil admin.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan profil admin.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword) {
      toast.error('Masukkan password saat ini.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi password baru tidak cocok.');
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.success) {
        toast.success('Password Administrator berhasil diubah!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setIsProfileModalOpen(false);
      } else {
        toast.error((res as any).error || 'Gagal mengubah password.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogoutSubmit = async () => {
    setIsLoggingOut(true);
    const res = await logoutTeacher();
    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    if (res.success) {
      toast.success('Berhasil keluar aplikasi');
      router.push('/sign-in');
      router.refresh();
    } else {
      toast.error(res.error || 'Gagal keluar aplikasi.');
    }
  };

  const initialName = admin.name ? admin.name.charAt(0).toUpperCase() : 'A';

  const sidebarContent = (
    <div className='flex h-full flex-col bg-white'>
      {/* Brand Header - Height 16 (64px) perfectly aligned with Desktop Top Header */}
      <div className='flex h-16 shrink-0 items-center justify-between gap-3 px-5 border-b border-slate-200/80'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs shadow-emerald-500/20'>
            <ShieldCheck className='h-4 w-4' />
          </div>
          <div className='min-w-0'>
            <h1 className='text-[15px] font-bold leading-none bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate'>
              Smart Admin
            </h1>
            <p className='text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-1 leading-none truncate'>
              Dashboard Admin
            </p>
          </div>
        </div>

        {/* Mobile Drawer Close Button */}
        <button
          type='button'
          onClick={() => setMobileOpen(false)}
          className='md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0'
          aria-label='Tutup Navigasi'
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      {/* Grouped Navigation Items */}
      <div className='flex-1 overflow-y-auto px-3.5 py-4'>
        <nav className='space-y-5'>
          {adminMenuGroups.map((group) => (
            <div key={group.category} className='space-y-1.5'>
              <div className='px-3 text-[10px] font-black uppercase tracking-wider text-slate-400'>
                {group.category}
              </div>

              <div className='space-y-1'>
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                        isActive
                          ? 'bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 shadow-xs font-bold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }`}
                    >
                      <Icon
                        className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                          isActive
                            ? 'text-emerald-600'
                            : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      <span>{item.name}</span>
                      {isActive && (
                        <span className='ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600' />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </div>
  );

  const renderProfileDropdown = (isMobile = false) => (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        className={`flex items-center ${
          isMobile ? 'gap-1 p-0.5' : 'gap-2.5 p-1 sm:px-2.5 sm:py-1.5'
        } rounded-full hover:bg-slate-100/80 text-left transition-all duration-200 cursor-pointer group`}
      >
        <div className='h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-xs border border-emerald-500/30 group-hover:scale-105 transition-transform'>
          {initialName}
        </div>
        {!isMobile && (
          <span className='hidden sm:block text-xs font-bold text-slate-900 truncate max-w-[160px] group-hover:text-emerald-700 transition-colors'>
            {admin.name || 'Admin Smart Class'}
          </span>
        )}
        <ChevronDown
          className={`${
            isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'
          } text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 mr-0.5 ${
            isProfileDropdownOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {isProfileDropdownOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsProfileDropdownOpen(false)}
          />
          <div className='absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 animate-in fade-in-50 zoom-in-95 duration-150 divide-y divide-slate-100'>
            <div className='p-2.5 pb-2'>
              <div className='flex items-center gap-2.5'>
                <div className='h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-xs border border-emerald-500/30'>
                  {initialName}
                </div>
                <div className='flex flex-col min-w-0 flex-1 leading-tight'>
                  <span className='text-xs font-bold text-slate-900 truncate'>
                    {admin.name || 'Admin Smart Class'}
                  </span>
                  <span className='text-[10px] text-emerald-600 font-semibold capitalize'>
                    Super Administrator
                  </span>
                </div>
              </div>
            </div>

            <div className='py-1.5 space-y-0.5'>
              <button
                type='button'
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className='w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left'
              >
                <User className='h-4 w-4 text-slate-400' />
                <span>Profil Admin</span>
              </button>
            </div>

            <div className='pt-1.5'>
              <button
                type='button'
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className='w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left'
              >
                <LogOut className='h-4 w-4 text-rose-500' />
                <span>Keluar Aplikasi</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className='flex min-h-screen bg-slate-50 text-slate-900'>
      {/* Desktop Sidebar */}
      <aside className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 shadow-xs'>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className='flex-1 md:pl-64 flex flex-col min-w-0 max-w-full'>
        {/* Desktop Top Header Bar */}
        <header className='hidden md:flex h-16 items-center justify-between border-b border-slate-200/80 px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30 print:hidden'>
          <div className='flex items-center gap-2 text-xs font-bold text-slate-500'>
            <span>Panel Manajemen Administrator</span>
          </div>
          <div className='flex items-center gap-3'>
            {renderProfileDropdown(false)}
          </div>
        </header>

        {/* Mobile Top Header */}
        <header className='flex h-16 items-center justify-between border-b border-slate-200/80 px-3 sm:px-4 md:hidden bg-white/95 backdrop-blur-md sticky top-0 z-40'>
          {/* Left: Hamburger Button */}
          <button
            type='button'
            onClick={toggleSidebar}
            aria-label='Buka Menu Navigasi'
            className='flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer shrink-0'
          >
            <Menu className='h-5 w-5' />
          </button>

          {/* Right: Profile Dropdown */}
          <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
            {renderProfileDropdown(true)}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className='fixed inset-0 z-50 md:hidden flex'>
            {/* Backdrop overlay */}
            <div
              className='fixed inset-0 bg-slate-900/40 backdrop-blur-xs'
              onClick={toggleSidebar}
            />
            {/* Drawer */}
            <aside className='relative flex w-64 max-w-xs flex-col bg-white border-r border-slate-200 animate-in slide-in-from-left duration-200'>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Workspace content */}
        <main className='flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto min-w-0 max-w-full overflow-hidden'>
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title='Konfirmasi Keluar Admin'
        description='Apakah Anda yakin ingin keluar dari sistem Smart Admin?'
        confirmText='Ya, Keluar'
        cancelText='Batal'
        variant='danger'
        isLoading={isLoggingOut}
        onConfirm={handleLogoutSubmit}
      />

      {/* ================================================================= */}
      {/* MODAL PROFIL ADMIN (Full Screen Backdrop Blur)                    */}
      {/* ================================================================= */}
      {isProfileModalOpen && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200'>
          <div
            className='fixed inset-0'
            onClick={() => setIsProfileModalOpen(false)}
          />
          <div className='relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 my-auto animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20'>
                  <ShieldCheck className='h-5 w-5' />
                </div>
                <div>
                  <h2 className='text-base sm:text-lg font-black text-slate-900 tracking-tight'>
                    Profil Administrator
                  </h2>
                  <p className='text-xs text-slate-500 font-medium'>
                    Kelola data identitas dan keamanan akun admin
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setIsProfileModalOpen(false)}
                className='p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Tabs */}
            <div className='flex border-b border-slate-200/80 px-6 pt-3 bg-white gap-2'>
              <button
                type='button'
                onClick={() => setProfileModalTab('profile')}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  profileModalTab === 'profile'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <User className='h-4 w-4' />
                <span>Informasi Admin</span>
              </button>
              <button
                type='button'
                onClick={() => setProfileModalTab('security')}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  profileModalTab === 'security'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Lock className='h-4 w-4' />
                <span>Keamanan (Ganti Password)</span>
              </button>
            </div>

            {/* Tab 1: Profile Form */}
            {profileModalTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className='p-6 space-y-4'>
                <div className='space-y-4'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Nama Lengkap Admin <span className='text-rose-500'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={profileModalForm.name}
                      onChange={(e) =>
                        setProfileModalForm({
                          ...profileModalForm,
                          name: e.target.value,
                        })
                      }
                      placeholder='Contoh: Admin Smart Class'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Username <span className='text-rose-500'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={profileModalForm.username}
                      onChange={(e) =>
                        setProfileModalForm({
                          ...profileModalForm,
                          username: e.target.value,
                        })
                      }
                      placeholder='Contoh: admin_smartclass'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                    <p className='text-[11px] text-slate-400'>
                      Huruf, angka, atau underscore (_) 3-20 karakter.
                    </p>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Alamat Email <span className='text-rose-500'>*</span>
                    </label>
                    <input
                      type='email'
                      required
                      value={profileModalForm.email}
                      onChange={(e) =>
                        setProfileModalForm({
                          ...profileModalForm,
                          email: e.target.value,
                        })
                      }
                      placeholder='admin@smartclass.id'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                  </div>
                </div>

                <div className='pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5'>
                  <button
                    type='button'
                    onClick={() => setIsProfileModalOpen(false)}
                    className='px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer'
                  >
                    Batal
                  </button>
                  <button
                    type='submit'
                    disabled={isSavingProfile}
                    className='flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50'
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className='h-3.5 w-3.5' />
                        <span>Simpan Profil</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Security Form */}
            {profileModalTab === 'security' && (
              <form onSubmit={handlePasswordSubmit} className='p-6 space-y-4'>
                <div className='space-y-3.5'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Password Saat Ini <span className='text-rose-500'>*</span>
                    </label>
                    <div className='relative'>
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        placeholder='Masukkan password saat ini'
                        className='w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setShowCurrentPassword(!showCurrentPassword)
                        }
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer'
                      >
                        {showCurrentPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Password Baru <span className='text-rose-500'>*</span>
                    </label>
                    <div className='relative'>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder='Minimal 6 karakter'
                        className='w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                      />
                      <button
                        type='button'
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer'
                      >
                        {showNewPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Konfirmasi Password Baru <span className='text-rose-500'>*</span>
                    </label>
                    <div className='relative'>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder='Ulangi password baru'
                        className='w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                      />
                      <button
                        type='button'
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer'
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='h-4 w-4' />
                        ) : (
                          <Eye className='h-4 w-4' />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className='pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5'>
                  <button
                    type='button'
                    onClick={() => setIsProfileModalOpen(false)}
                    className='px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer'
                  >
                    Batal
                  </button>
                  <button
                    type='submit'
                    disabled={isSavingPassword}
                    className='flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50'
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        <span>Memperbarui...</span>
                      </>
                    ) : (
                      <>
                        <Lock className='h-3.5 w-3.5' />
                        <span>Perbarui Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
