'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  GraduationCap,
  Wallet,
  Menu,
  X,
  BookOpen,
  LogOut,
  BookMarked,
  User,
  CheckSquare,
  Sparkles,
  Sliders,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';
import { updateMenuPreferences } from '@/actions/profileActions';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

const allSidebarItems: SidebarItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Data Siswa', href: '/siswa', icon: Users },
  { name: 'Absensi Kelas', href: '/absensi', icon: CalendarCheck2 },
  { name: 'Nilai Akademik', href: '/nilai', icon: GraduationCap },
  { name: 'Tabungan Siswa', href: '/tabungan', icon: Wallet },
  { name: 'Jurnal Wali Kelas', href: '/jurnal', icon: BookMarked },
  { name: 'Profil Saya', href: '/profile', icon: User },
];

const CONFIGURABLE_MENUS = [
  { href: '/siswa', label: 'Data Siswa', desc: 'Manajemen data profil dan informasi siswa' },
  { href: '/absensi', label: 'Absensi Kelas', desc: 'Pencatatan daftar hadir & rekap absensi' },
  { href: '/nilai', label: 'Nilai Akademik', desc: 'Penginputan nilai mata pelajaran & KKM' },
  { href: '/tabungan', label: 'Tabungan Siswa', desc: 'Pencatatan setoran & penarikan kas siswa' },
  { href: '/jurnal', label: 'Jurnal Wali Kelas', desc: 'Agenda harian mengajar guru & KBM' },
];

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  teacher: {
    name: string;
    email: string;
    schoolName?: string;
    className?: string;
    nip?: string;
    isAdmin?: boolean;
    isFirstLogin?: boolean;
    enabledMenus?: string[];
  };
}

export default function DashboardLayoutClient({
  children,
  teacher,
}: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Menu Preferences state
  const [enabledMenus, setEnabledMenus] = useState<string[]>(
    teacher.enabledMenus && teacher.enabledMenus.length > 0
      ? teacher.enabledMenus
      : ['/', '/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal']
  );

  // Sync state if teacher prop changes
  React.useEffect(() => {
    if (teacher.enabledMenus && teacher.enabledMenus.length > 0) {
      setEnabledMenus(teacher.enabledMenus);
    }
  }, [teacher.enabledMenus]);

  // Onboarding Modal state
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(
    !!teacher.isFirstLogin
  );
  const [selectedOnboardingMenus, setSelectedOnboardingMenus] = useState<string[]>(
    ['/siswa', '/absensi', '/nilai', '/tabungan', '/jurnal']
  );
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);

  const toggleSidebar = () => setMobileOpen(!mobileOpen);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleSaveOnboarding = async () => {
    setIsSavingOnboarding(true);
    try {
      const finalMenus = ['/', ...selectedOnboardingMenus, '/profile'];
      await updateMenuPreferences(finalMenus, true);
      setEnabledMenus(finalMenus);
      setOnboardingOpen(false);
      toast.success('Pengaturan menu aplikasi berhasil disimpan!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan menu.');
      setIsSavingOnboarding(false);
    }
  };

  const initialName = teacher.name ? teacher.name.charAt(0).toUpperCase() : 'G';

  // Filter visible sidebar items
  const visibleSidebarItems = allSidebarItems.filter((item) => {
    if (item.href === '/' || item.href === '/profile') return true;
    return enabledMenus.includes(item.href);
  });

  const sidebarContent = (
    <div className='flex h-full flex-col justify-between p-4'>
      <div>
        {/* Brand Header */}
        <div className='flex items-center gap-3 px-2 py-4 mb-6 border-b border-zinc-900'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20'>
            <BookOpen className='h-5 w-5' />
          </div>
          <div>
            <h1 className='text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent'>
              Smart Class
            </h1>
            <p className='text-xs text-zinc-500'>Dashboard Wali Kelas</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className='space-y-1.5'>
          {visibleSidebarItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/50 shadow-md shadow-emerald-950/20'
                  : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent'
                  }`}
              >
                <Icon
                  className={`h-5 w-5 transition-transform duration-200 group-hover:scale-110 ${isActive
                    ? 'text-emerald-400'
                    : 'text-zinc-500 group-hover:text-zinc-300'
                    }`}
                />
                <span>{item.name}</span>
                {isActive && (
                  <span className='ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400' />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile section */}
      <div className='border-t border-zinc-900 pt-4 flex flex-col gap-3 px-2'>
        <Link
          href='/profile'
          onClick={() => setMobileOpen(false)}
          className='flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900/80 transition-colors group cursor-pointer border border-transparent hover:border-zinc-800'
        >
          {/* Custom Avatar with Emerald gradient */}
          <div className='h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-emerald-500/20 border border-emerald-500/30 group-hover:scale-105 transition-transform'>
            {initialName}
          </div>
          <div className='flex flex-col max-w-[130px] flex-1'>
            <span className='text-xs font-semibold text-zinc-300 truncate group-hover:text-emerald-400 transition-colors'>
              {teacher.name || 'Guru Smart Class'}
            </span>
            <span className='text-[10px] text-zinc-500 truncate'>
              {teacher.email || ''}
            </span>
          </div>
        </Link>
        <Button
          variant='ghost'
          onClick={() => setShowLogoutConfirm(true)}
          className='w-full text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl h-9 text-xs justify-start gap-2 px-3 border border-transparent hover:border-rose-950/30 cursor-pointer'
        >
          <LogOut className='h-4 w-4' />
          <span>Keluar Aplikasi</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className='flex min-h-screen bg-zinc-950 text-zinc-100'>
      {/* Desktop Sidebar */}
      <aside className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-zinc-950/80 backdrop-blur-md border-r border-zinc-900'>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className='flex-1 md:pl-64 flex flex-col'>
        {/* Mobile Top Header */}
        <header className='flex h-16 items-center justify-between border-b border-zinc-900 px-4 md:hidden bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40'>
          <div className='flex items-center gap-2'>
            <BookOpen className='h-5 w-5 text-emerald-500' />
            <span className='font-bold text-emerald-400 text-sm'>
              Smart Class
            </span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleSidebar}
            className='text-zinc-400 hover:text-zinc-200'
          >
            {mobileOpen ? (
              <X className='h-6 w-6' />
            ) : (
              <Menu className='h-6 w-6' />
            )}
          </Button>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className='fixed inset-0 z-50 md:hidden flex'>
            {/* Backdrop overlay */}
            <div
              className='fixed inset-0 bg-black/60 backdrop-blur-sm'
              onClick={toggleSidebar}
            />
            {/* Drawer */}
            <aside className='relative flex w-64 max-w-xs flex-col bg-zinc-950 border-r border-zinc-900 animate-in slide-in-from-left duration-200'>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Workspace content */}
        <main className='flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in'>
          {children}
        </main>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari aplikasi Smart Class?"
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
        isLoading={isLoggingOut}
        onConfirm={handleLogoutSubmit}
      />

      {/* First-Login Menu Selector Onboarding Modal */}
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className='bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-lg p-6'>
          <DialogHeader className='pb-4 border-b border-zinc-800'>
            <div className='flex items-center gap-2 text-emerald-400 mb-1'>
              <Sparkles className='h-5 w-5' />
              <span className='text-xs font-bold uppercase tracking-wider'>Selamat Datang</span>
            </div>
            <DialogTitle className='text-xl font-bold text-zinc-100'>
              Pilih Menu Fitur Utama Anda
            </DialogTitle>
            <DialogDescription className='text-xs text-zinc-400 mt-1'>
              Halo <strong>{teacher.name}</strong>! Pilih menu fitur apa saja yang ingin ditampilkan pada bilah navigasi Anda. Pengaturan ini dapat diubah kapan saja di menu <strong>Profil Saya</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-3 py-4'>
            {CONFIGURABLE_MENUS.map((menu) => {
              const isChecked = selectedOnboardingMenus.includes(menu.href);
              return (
                <div
                  key={menu.href}
                  onClick={() => {
                    if (isChecked) {
                      if (selectedOnboardingMenus.length <= 1) {
                        toast.error('Pilih setidaknya 1 menu fitur.');
                        return;
                      }
                      setSelectedOnboardingMenus(
                        selectedOnboardingMenus.filter((m) => m !== menu.href)
                      );
                    } else {
                      setSelectedOnboardingMenus([...selectedOnboardingMenus, menu.href]);
                    }
                  }}
                  className={`flex items-start gap-3.5 p-3.5 rounded-xl border transition-all cursor-pointer ${isChecked
                    ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300 shadow-md shadow-emerald-950/20'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                >
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${isChecked
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-zinc-700 bg-zinc-900'
                      }`}
                  >
                    {isChecked && <Check className='h-3.5 w-3.5 stroke-[3]' />}
                  </div>
                  <div>
                    <span className='text-xs font-bold text-zinc-200 block'>
                      {menu.label}
                    </span>
                    <span className='text-[10px] text-zinc-500 block mt-0.5'>
                      {menu.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className='pt-3 border-t border-zinc-800 flex items-center justify-between sm:justify-between w-full'>
            <span className='text-[10px] text-zinc-500'>
              {selectedOnboardingMenus.length} menu terpilih
            </span>
            <Button
              type='button'
              onClick={handleSaveOnboarding}
              disabled={isSavingOnboarding}
              className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs px-5 h-9 gap-2'
            >
              {isSavingOnboarding ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <span>Simpan & Lanjutkan</span>
                  <Sliders className='h-3.5 w-3.5' />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
