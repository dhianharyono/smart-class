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
  Settings,
  Home,
  ChevronDown,
  ChevronRight,
  Calendar,
  School,
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

interface SidebarSubItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
}

interface SidebarItem {
  name: string;
  href?: string;
  icon: React.ComponentType<any>;
  children?: SidebarSubItem[];
}

interface SidebarGroup {
  category: string;
  items: SidebarItem[];
}

const sidebarMenuGroups: SidebarGroup[] = [
  {
    category: 'MENU UTAMA',
    items: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    category: 'AKADEMIK & KELAS',
    items: [
      {
        name: 'Kelola Siswa',
        icon: Users,
        children: [
          { name: 'Data Siswa', href: '/siswa', icon: Users },
          { name: 'Absensi Kelas', href: '/absensi', icon: CalendarCheck2 },
          { name: 'Nilai Akademik', href: '/nilai', icon: GraduationCap },
          { name: 'Tabungan Siswa', href: '/tabungan', icon: Wallet },
        ],
      },
      {
        name: 'Kelola Kelas',
        icon: School,
        children: [
          { name: 'Jadwal & Alokasi', href: '/jadwal', icon: Calendar },
          { name: 'Piket Kelas', href: '/piket', icon: CheckSquare },
        ],
      },
      { name: 'Jurnal Wali Kelas', href: '/jurnal', icon: BookMarked },
    ],
  },
  {
    category: 'PENGATURAN',
    items: [
      { name: 'Profil Saya', href: '/profile', icon: User },
      { name: 'Pengaturan', href: '/settings', icon: Settings },
    ],
  },
];

const CONFIGURABLE_MENUS = [
  { href: '/siswa', label: 'Data Siswa', desc: 'Manajemen data profil dan informasi siswa' },
  { href: '/absensi', label: 'Absensi Kelas', desc: 'Pencatatan daftar hadir harian & rekap presensi kelas' },
  { href: '/nilai', label: 'Nilai Akademik', desc: 'Penginputan nilai mata pelajaran & KKM' },
  { href: '/tabungan', label: 'Tabungan Siswa', desc: 'Pencatatan setoran & penarikan kas siswa' },
  { href: '/jadwal', label: 'Jadwal & Alokasi', desc: 'Plotting jadwal pelajaran mingguan kelas' },
  { href: '/piket', label: 'Piket Kelas', desc: 'Pengaturan kelompok petugas piket harian siswa' },
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

  // Menu Preferences state (auto-includes /jadwal and /piket for existing profiles)
  const [enabledMenus, setEnabledMenus] = useState<string[]>(() => {
    const list =
      teacher.enabledMenus && teacher.enabledMenus.length > 0
        ? teacher.enabledMenus
        : ['/dashboard', '/siswa', '/absensi', '/nilai', '/tabungan', '/jadwal', '/piket', '/jurnal', '/settings'];
    let result = list.includes('/jadwal') ? list : [...list, '/jadwal'];
    return result.includes('/piket') ? result : [...result, '/piket'];
  });

  // Sync state if teacher prop changes
  React.useEffect(() => {
    if (teacher.enabledMenus && teacher.enabledMenus.length > 0) {
      let list = teacher.enabledMenus.includes('/jadwal')
        ? teacher.enabledMenus
        : [...teacher.enabledMenus, '/jadwal'];
      if (!list.includes('/piket')) {
        list = [...list, '/piket'];
      }
      setEnabledMenus(list);
    }
  }, [teacher.enabledMenus]);

  // Onboarding Modal state
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(
    !!teacher.isFirstLogin
  );
  const [selectedOnboardingMenus, setSelectedOnboardingMenus] = useState<string[]>(
    ['/siswa', '/absensi', '/nilai', '/tabungan', '/jadwal', '/jurnal']
  );
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Kelola Siswa': true,
    'Kelola Kelas': true,
  });

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
      const finalMenus = ['/dashboard', ...selectedOnboardingMenus, '/profile', '/settings'];
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

  const sidebarContent = (
    <div className='flex h-full flex-col justify-between p-4'>
      <div className='overflow-y-auto pr-1'>
        {/* Brand Header */}
        <div className='flex items-center gap-3 px-2 py-4 mb-5 border-b border-slate-200/80'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'>
            <BookOpen className='h-5 w-5' />
          </div>
          <div>
            <h1 className='text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'>
              Smart Class
            </h1>
            <p className='text-xs text-slate-500 font-medium'>Dashboard Wali Kelas</p>
          </div>
        </div>

        {/* Grouped Navigation Items */}
        <nav className='space-y-5'>
          {sidebarMenuGroups.map((group) => {
            const visibleItemsInGroup = group.items
              .map((item) => {
                if (item.children) {
                  const visibleChildren = item.children.filter((child) =>
                    enabledMenus.includes(child.href)
                  );
                  if (visibleChildren.length === 0) return null;
                  return { ...item, children: visibleChildren };
                }
                if (
                  item.href === '/dashboard' ||
                  item.href === '/' ||
                  item.href === '/profile' ||
                  item.href === '/settings' ||
                  (item.href && enabledMenus.includes(item.href))
                ) {
                  return item;
                }
                return null;
              })
              .filter(Boolean) as SidebarItem[];

            if (visibleItemsInGroup.length === 0) return null;

            return (
              <div key={group.category} className='space-y-1.5'>
                <div className='px-3 text-[10px] font-black uppercase tracking-wider text-slate-400/90'>
                  {group.category}
                </div>

                <div className='space-y-1'>
                  {visibleItemsInGroup.map((item) => {
                    if (item.children && item.children.length > 0) {
                      const isChildActive = item.children.some(
                        (child) => pathname === child.href
                      );
                      const isOpen = openMenus[item.name] ?? isChildActive;
                      const Icon = item.icon;

                      return (
                        <div key={item.name} className='space-y-1'>
                          <button
                            onClick={() =>
                              setOpenMenus((prev) => ({
                                ...prev,
                                [item.name]: !isOpen,
                              }))
                            }
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                              isChildActive
                                ? 'bg-emerald-50/70 text-emerald-900 border border-emerald-200/80 font-bold'
                                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
                            }`}
                          >
                            <div className='flex items-center gap-3'>
                              <Icon
                                className={`h-4.5 w-4.5 transition-transform duration-200 ${
                                  isChildActive ? 'text-emerald-600' : 'text-slate-400'
                                }`}
                              />
                              <span>{item.name}</span>
                            </div>
                            {isOpen ? (
                              <ChevronDown className='h-3.5 w-3.5 text-slate-400' />
                            ) : (
                              <ChevronRight className='h-3.5 w-3.5 text-slate-400' />
                            )}
                          </button>

                          {isOpen && (
                            <div className='pl-3.5 space-y-1 border-l-2 border-slate-200/80 ml-5 my-1'>
                              {item.children.map((child) => {
                                const isSubActive = pathname === child.href;
                                const SubIcon = child.icon;
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-200 ${
                                      isSubActive
                                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                                    }`}
                                  >
                                    <SubIcon
                                      className={`h-4 w-4 ${
                                        isSubActive ? 'text-white' : 'text-slate-400'
                                      }`}
                                    />
                                    <span>{child.name}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href!}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                          isActive
                            ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 shadow-xs font-bold'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${
                            isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span>{item.name}</span>
                        {isActive && <span className='ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600' />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer / User Profile section */}
      <div className='border-t border-slate-200/80 pt-4 px-1'>
        <div className='flex items-center justify-between p-2 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/60 transition-colors group'>
          <Link
            href='/profile'
            onClick={() => setMobileOpen(false)}
            className='flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer'
          >
            {/* Custom Avatar with Emerald gradient */}
            <div className='h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-xs border border-emerald-500/30 group-hover:scale-105 transition-transform'>
              {initialName}
            </div>
            <div className='flex flex-col min-w-0 flex-1'>
              <span className='text-xs font-bold text-slate-800 truncate group-hover:text-emerald-700 transition-colors'>
                {teacher.name || 'Guru Smart Class'}
              </span>
              <span className='text-[10px] text-slate-500 truncate font-medium'>
                {teacher.email || ''}
              </span>
            </div>
          </Link>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => setShowLogoutConfirm(true)}
            title='Keluar Aplikasi'
            className='h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl cursor-pointer shrink-0 transition-colors ml-1'
          >
            <LogOut className='h-4 w-4' />
            <span className='sr-only'>Keluar Aplikasi</span>
          </Button>
        </div>
      </div>
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
        {/* Mobile Top Header */}
        <header className='flex h-16 items-center justify-between border-b border-slate-200/80 px-4 md:hidden bg-white/90 backdrop-blur-md sticky top-0 z-40'>
          <div className='flex items-center gap-2'>
            <BookOpen className='h-5 w-5 text-emerald-600' />
            <span className='font-bold text-emerald-700 text-sm'>
              Smart Class
            </span>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleSidebar}
            className='text-slate-600 hover:text-slate-900'
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
              className='fixed inset-0 bg-slate-900/40 backdrop-blur-sm'
              onClick={toggleSidebar}
            />
            {/* Drawer */}
            <aside className='relative flex w-64 max-w-xs flex-col bg-white border-r border-slate-200 animate-in slide-in-from-left duration-200 shadow-xl'>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Workspace content */}
        <main className='flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in min-w-0 max-w-full overflow-hidden'>
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
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-lg p-6 shadow-2xl'>
          <DialogHeader className='pb-4 border-b border-slate-200'>
            <div className='flex items-center gap-2 text-emerald-600 mb-1'>
              <Sparkles className='h-5 w-5' />
              <span className='text-xs font-bold uppercase tracking-wider'>Selamat Datang</span>
            </div>
            <DialogTitle className='text-xl font-bold text-slate-900'>
              Pilih Menu Fitur Utama Anda
            </DialogTitle>
            <DialogDescription className='text-xs text-slate-500 mt-1'>
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
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                >
                  <div
                    className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${isChecked
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'border-slate-300 bg-white'
                      }`}
                  >
                    {isChecked && <Check className='h-3.5 w-3.5 stroke-[3]' />}
                  </div>
                  <div>
                    <span className='text-xs font-bold text-slate-800 block'>
                      {menu.label}
                    </span>
                    <span className='text-[10px] text-slate-500 block mt-0.5'>
                      {menu.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className='pt-3 border-t border-slate-200 flex items-center justify-between sm:justify-between w-full'>
            <span className='text-[10px] text-slate-500'>
              {selectedOnboardingMenus.length} menu terpilih
            </span>
            <Button
              type='button'
              onClick={handleSaveOnboarding}
              disabled={isSavingOnboarding}
              className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs px-5 h-9 gap-2 shadow-xs'
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
