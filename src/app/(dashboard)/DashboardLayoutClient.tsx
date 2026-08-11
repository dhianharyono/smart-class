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
  ArrowRight,
  ArrowLeft,
  IdCard,
  UserCheck,
  AlertCircle,
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
import { updateMenuPreferences, updateProfile } from '@/actions/profileActions';
import { getSchools } from '@/actions/adminActions';

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
      { name: 'Profile dan Sekolah', href: '/profile', icon: User },
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
    principalName?: string;
    principalNip?: string;
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
  const [enabledMenus, setEnabledMenus] = useState<string[]>(
    teacher.enabledMenus && teacher.enabledMenus.length > 0
      ? teacher.enabledMenus
      : ['/dashboard', '/siswa', '/absensi', '/nilai', '/tabungan', '/jadwal', '/piket', '/jurnal', '/profile', '/settings']
  );


  // Sync state if teacher prop changes
  React.useEffect(() => {
    if (teacher.enabledMenus && teacher.enabledMenus.length > 0) {
      setEnabledMenus(teacher.enabledMenus);
    }
  }, [teacher.enabledMenus]);

  // Check if teacher profile data is incomplete (including NIP & Principal info)
  const isProfileIncomplete = React.useMemo(() => {
    const isNipInvalid = !teacher.nip || teacher.nip.trim() === '' || teacher.nip.trim() === '-';
    const isPrincipalNameInvalid = !teacher.principalName || teacher.principalName.trim() === '';
    const isPrincipalNipInvalid = !teacher.principalNip || teacher.principalNip.trim() === '' || teacher.principalNip.trim() === '-';
    const isBasicInfoInvalid = !teacher.name || !teacher.schoolName || !teacher.className;

    return !!teacher.isFirstLogin || isNipInvalid || isPrincipalNameInvalid || isPrincipalNipInvalid || isBasicInfoInvalid;
  }, [teacher]);

  // Onboarding Modal state
  const ALL_CONFIGURABLE_HREFS = CONFIGURABLE_MENUS.map((m) => m.href);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(isProfileIncomplete);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [onboardingName, setOnboardingName] = useState(teacher.name || '');
  const [onboardingSchool, setOnboardingSchool] = useState(teacher.schoolName || '');
  const [onboardingCustomSchool, setOnboardingCustomSchool] = useState('');
  const [onboardingClass, setOnboardingClass] = useState(teacher.className || '');
  const [onboardingNip, setOnboardingNip] = useState(
    teacher.nip && teacher.nip !== '-' ? teacher.nip : ''
  );
  const [onboardingPrincipalName, setOnboardingPrincipalName] = useState(
    teacher.principalName || ''
  );
  const [onboardingPrincipalNip, setOnboardingPrincipalNip] = useState(
    teacher.principalNip && teacher.principalNip !== '-' ? teacher.principalNip : ''
  );
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [onboardingErrors, setOnboardingErrors] = useState<Record<string, string>>({});

  const [selectedOnboardingMenus, setSelectedOnboardingMenus] = useState<string[]>(
    ALL_CONFIGURABLE_HREFS
  );
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);

  const validateOnboardingStep1 = (): boolean => {
    const errors: Record<string, string> = {};

    const cleanName = onboardingName.trim();
    if (!cleanName) {
      errors.name = 'Nama lengkap & gelar wajib diisi.';
    } else if (cleanName.length < 3) {
      errors.name = 'Nama lengkap & gelar minimal 3 karakter.';
    }

    const cleanNip = onboardingNip.trim();
    if (!cleanNip || cleanNip === '-') {
      errors.nip = 'NIP/NUPTK wajib diisi dengan NIP/NUPTK yang valid (tidak boleh "-").';
    } else if (cleanNip.length < 3) {
      errors.nip = 'NIP/NUPTK minimal 3 karakter.';
    }

    const finalSchoolName =
      onboardingSchool === '__NEW_SCHOOL__'
        ? onboardingCustomSchool.trim()
        : onboardingSchool.trim();

    if (onboardingSchool === '__NEW_SCHOOL__') {
      if (!onboardingCustomSchool.trim()) {
        errors.school = 'Nama sekolah baru wajib diisi.';
      } else if (onboardingCustomSchool.trim().length < 3) {
        errors.school = 'Nama sekolah baru minimal 3 karakter.';
      }
    } else if (!finalSchoolName) {
      errors.school = 'Silakan pilih atau isi nama sekolah Anda.';
    }

    const cleanClass = onboardingClass.trim();
    if (!cleanClass) {
      errors.className = 'Kelas diajar wajib diisi (contoh: 5A / VI B).';
    }

    const cleanPrincipalName = onboardingPrincipalName.trim();
    if (!cleanPrincipalName) {
      errors.principalName = 'Nama kepala sekolah wajib diisi.';
    } else if (cleanPrincipalName.length < 3) {
      errors.principalName = 'Nama kepala sekolah minimal 3 karakter.';
    }

    const cleanPrincipalNip = onboardingPrincipalNip.trim();
    if (!cleanPrincipalNip || cleanPrincipalNip === '-') {
      errors.principalNip = 'NIP kepala sekolah wajib diisi dengan NIP yang valid (tidak boleh "-").';
    } else if (cleanPrincipalNip.length < 3) {
      errors.principalNip = 'NIP kepala sekolah minimal 3 karakter.';
    }

    setOnboardingErrors(errors);
    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      const firstErrorMsg = Object.values(errors)[0];
      toast.error(firstErrorMsg);
    }

    return isValid;
  };

  React.useEffect(() => {
    if (isProfileIncomplete) {
      setOnboardingOpen(true);
    }
  }, [isProfileIncomplete]);

  React.useEffect(() => {
    if (onboardingOpen) {
      async function loadSchoolOptions() {
        setLoadingSchools(true);
        try {
          const list = await getSchools();
          setSchoolsList(list);
          if (!teacher.schoolName && list.length > 0) {
            setOnboardingSchool(list[0].name);
          }
        } catch (err) {
          console.error('Gagal memuat daftar sekolah:', err);
        } finally {
          setLoadingSchools(false);
        }
      }
      loadSchoolOptions();
    }
  }, [onboardingOpen, teacher.schoolName]);

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

  const handleNextStep = () => {
    if (!validateOnboardingStep1()) return;
    setOnboardingStep(2);
  };

  const handleSaveOnboarding = async () => {
    if (!validateOnboardingStep1()) {
      setOnboardingStep(1);
      return;
    }

    const finalSchoolName =
      onboardingSchool === '__NEW_SCHOOL__'
        ? onboardingCustomSchool.trim()
        : onboardingSchool.trim();

    if (selectedOnboardingMenus.length === 0) {
      toast.error('Pilih setidaknya 1 menu fitur.');
      setOnboardingStep(2);
      return;
    }

    setIsSavingOnboarding(true);
    try {
      // 1. Update Profile (Nama, Sekolah, Kelas, NIP, Principal Name & NIP)
      await updateProfile({
        name: onboardingName.trim(),
        email: teacher.email,
        schoolName: finalSchoolName,
        className: onboardingClass.trim(),
        nip: onboardingNip.trim() || '-',
        principalName: onboardingPrincipalName.trim(),
        principalNip: onboardingPrincipalNip.trim(),
      });

      // 2. Update Menu Preferences & mark first login done
      const finalMenus = ['/dashboard', ...selectedOnboardingMenus, '/profile', '/settings'];
      await updateMenuPreferences(finalMenus, true);

      setEnabledMenus(finalMenus);
      setOnboardingOpen(false);
      toast.success('Profil dan kustomisasi menu berhasil disimpan!');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan.');
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
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${isChildActive
                              ? 'bg-emerald-50/70 text-emerald-900 border border-emerald-200/80 font-bold'
                              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
                              }`}
                          >
                            <div className='flex items-center gap-3'>
                              <Icon
                                className={`h-4.5 w-4.5 transition-transform duration-200 ${isChildActive ? 'text-emerald-600' : 'text-slate-400'
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
                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-200 ${isSubActive
                                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                                      }`}
                                  >
                                    <SubIcon
                                      className={`h-4 w-4 ${isSubActive ? 'text-white' : 'text-slate-400'
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
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${isActive
                          ? 'bg-emerald-50/90 text-emerald-800 border border-emerald-200/80 shadow-xs font-bold'
                          : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 border border-transparent'
                          }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
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
            className='h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-xl cursor-pointer shrink-0 transition-colors ml-1'
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
      <aside className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 shadow-xs print:hidden'>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className='flex-1 md:pl-64 flex flex-col min-w-0 max-w-full print:pl-0 print:m-0'>
        {/* Mobile Top Header */}
        <header className='flex h-16 items-center justify-between border-b border-slate-200/80 px-4 md:hidden bg-white/90 backdrop-blur-md sticky top-0 z-40 print:hidden'>
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
          <div className='fixed inset-0 z-50 md:hidden flex print:hidden'>
            {/* Backdrop overlay */}
            <div
              className='fixed inset-0 bg-slate-900/40 backdrop-blur-sm'
              onClick={toggleSidebar}
            />
            {/* Drawer */}
            <aside className='relative flex w-64 max-w-xs flex-col bg-white border-r border-slate-200 animate-in slide-in-from-left duration-200 shadow-xl print:hidden'>
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

      {/* First-Login / Incomplete Profile Mandatory Modal */}
      <Dialog
        open={onboardingOpen}
        onOpenChange={(open) => {
          if (isProfileIncomplete) return; // Prevent closing if profile data is incomplete
          setOnboardingOpen(open);
        }}
      >
        <DialogContent showCloseButton={false} className='bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-2xl sm:max-w-2xl p-5 sm:p-7 shadow-2xl overflow-hidden'>
          <DialogHeader className='pb-3 border-b border-slate-100'>
            {/* Top Bar with Badge & Logout Option */}
            <div className='flex items-center justify-between gap-2 pb-1 flex-wrap'>
              <div className='flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-2xs shrink-0'>
                <Sparkles className='h-3.5 w-3.5 text-emerald-600 shrink-0' />
                <span className='text-[11px] font-extrabold uppercase tracking-wide whitespace-nowrap'>
                  {teacher.isFirstLogin ? 'Aktivasi Akun Wali Kelas' : 'Lengkapi Data Profil & Sekolah'}
                </span>
              </div>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setShowLogoutConfirm(true)}
                className='text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-rose-300 rounded-xl px-3 py-1.5 h-8 gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-2xs'
              >
                <LogOut className='h-3.5 w-3.5 shrink-0' />
                <span>Keluar</span>
              </Button>
            </div>

            <div className='pt-2 space-y-1 text-left'>
              <DialogTitle className='text-xl sm:text-2xl font-black text-slate-900 tracking-tight'>
                {onboardingStep === 1
                  ? 'Lengkapi Informasi Diri & Sekolah'
                  : 'Pilih Menu Fitur Utama Sidebar'}
              </DialogTitle>
              <DialogDescription className='text-xs sm:text-sm text-slate-500 font-medium leading-relaxed'>
                {onboardingStep === 1
                  ? 'Harap melengkapi data profil dan sekolah Anda. Data ini wajib diisi sebelum Anda dapat mengakses dashboard utama.'
                  : 'Pilih menu fitur yang ingin Anda tampilkan pada sidebar navigasi. Anda dapat mengubah pilihan ini kapan saja melalui menu Profil.'}
              </DialogDescription>
            </div>

            {/* Step Wizard Tabs */}
            <div className='flex items-center gap-2 pt-3 pb-0.5'>
              <button
                type='button'
                onClick={() => setOnboardingStep(1)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer min-w-0 ${onboardingStep === 1
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
              >
                <span
                  className={`h-5 w-5 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${onboardingStep === 1 ? 'bg-white/25 text-white' : 'bg-emerald-600 text-white'
                    }`}
                >
                  1
                </span>
                <span className='whitespace-nowrap'>Data Profil & Sekolah</span>
              </button>
              <ChevronRight className='h-3.5 w-3.5 text-slate-300 shrink-0' />
              <button
                type='button'
                onClick={() => handleNextStep()}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer min-w-0 ${onboardingStep === 2
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                  }`}
              >
                <span
                  className={`h-5 w-5 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${onboardingStep === 2 ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                >
                  2
                </span>
                <span className='whitespace-nowrap'>Kustomisasi Sidebar</span>
              </button>
            </div>
          </DialogHeader>

          {/* STEP 1: INFORMASI DIRI & SEKOLAH */}
          {onboardingStep === 1 && (
            <div className='space-y-4 py-4 max-h-[55vh] overflow-y-auto pr-1 text-left'>
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
                    placeholder='Contoh: Drs. Ahmad Dahlan, M.Pd'
                    value={onboardingName}
                    onChange={(e) => {
                      setOnboardingName(e.target.value);
                      if (onboardingErrors.name) setOnboardingErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${onboardingErrors.name
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all`}
                  />
                </div>
                {onboardingErrors.name && (
                  <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                    <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                    <span>{onboardingErrors.name}</span>
                  </p>
                )}
              </div>

              {/* NIP / NUPTK */}
              <div className='space-y-1.5'>
                <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                  NIP / NUPTK <span className='text-rose-500'>*</span>
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <IdCard className='h-4 w-4' />
                  </div>
                  <input
                    type='text'
                    required
                    placeholder='Misal: 19850101 201001 1 001 / NUPTK'
                    value={onboardingNip}
                    onChange={(e) => {
                      setOnboardingNip(e.target.value);
                      if (onboardingErrors.nip) setOnboardingErrors((prev) => ({ ...prev, nip: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${onboardingErrors.nip
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all`}
                  />
                </div>
                {onboardingErrors.nip && (
                  <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                    <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                    <span>{onboardingErrors.nip}</span>
                  </p>
                )}
              </div>

              {/* Sekolah & Kelas – 2 column grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                    SEKOLAH <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                      <School className='h-4 w-4' />
                    </div>
                    <select
                      value={onboardingSchool}
                      onChange={(e) => {
                        setOnboardingSchool(e.target.value);
                        if (onboardingErrors.school) setOnboardingErrors((prev) => ({ ...prev, school: '' }));
                      }}
                      disabled={loadingSchools}
                      className={`w-full pl-10 pr-8 py-2.5 bg-slate-50/50 border ${onboardingErrors.school
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                        } text-slate-900 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium appearance-none cursor-pointer transition-all`}
                    >
                      {loadingSchools ? (
                        <option value=''>Memuat...</option>
                      ) : (
                        <>
                          {schoolsList.map((s) => (
                            <option key={s._id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                          <option value='__NEW_SCHOOL__'>+ Tambah Baru...</option>
                        </>
                      )}
                    </select>
                    <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400'>
                      <ChevronDown className='h-4 w-4' />
                    </div>
                  </div>
                  {onboardingErrors.school && (
                    <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                      <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                      <span>{onboardingErrors.school}</span>
                    </p>
                  )}
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                    KELAS DIAJAR <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                      <GraduationCap className='h-4 w-4' />
                    </div>
                    <input
                      type='text'
                      required
                      placeholder='Misal: 5A / VI B'
                      value={onboardingClass}
                      onChange={(e) => {
                        setOnboardingClass(e.target.value);
                        if (onboardingErrors.className) setOnboardingErrors((prev) => ({ ...prev, className: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${onboardingErrors.className
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                        } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all`}
                    />
                  </div>
                  {onboardingErrors.className && (
                    <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                      <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                      <span>{onboardingErrors.className}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Sekolah Baru (conditional) */}
              {onboardingSchool === '__NEW_SCHOOL__' && (
                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                    NAMA SEKOLAH BARU <span className='text-rose-500'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    placeholder='Masukkan nama sekolah lengkap Anda'
                    value={onboardingCustomSchool}
                    onChange={(e) => {
                      setOnboardingCustomSchool(e.target.value);
                      if (onboardingErrors.school) setOnboardingErrors((prev) => ({ ...prev, school: '' }));
                    }}
                    className={`w-full px-4 py-2.5 bg-slate-50/50 border ${onboardingErrors.school
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                      } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all`}
                  />
                  {onboardingErrors.school && (
                    <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                      <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                      <span>{onboardingErrors.school}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Kepala Sekolah & NIP Kepala Sekolah – 2 column grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                    NAMA KEPALA SEKOLAH <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                      <UserCheck className='h-4 w-4' />
                    </div>
                    <input
                      type='text'
                      required
                      placeholder='Contoh: Dr. H. Ahmad Dahlan, M.Pd'
                      value={onboardingPrincipalName}
                      onChange={(e) => {
                        setOnboardingPrincipalName(e.target.value);
                        if (onboardingErrors.principalName) setOnboardingErrors((prev) => ({ ...prev, principalName: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${onboardingErrors.principalName
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                        } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all`}
                    />
                  </div>
                  {onboardingErrors.principalName && (
                    <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                      <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                      <span>{onboardingErrors.principalName}</span>
                    </p>
                  )}
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                    NIP KEPALA SEKOLAH <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                      <IdCard className='h-4 w-4' />
                    </div>
                    <input
                      type='text'
                      required
                      placeholder='Misal: 19700101 199503 1 002'
                      value={onboardingPrincipalNip}
                      onChange={(e) => {
                        setOnboardingPrincipalNip(e.target.value);
                        if (onboardingErrors.principalNip) setOnboardingErrors((prev) => ({ ...prev, principalNip: '' }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${onboardingErrors.principalNip
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                        } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all`}
                    />
                  </div>
                  {onboardingErrors.principalNip && (
                    <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                      <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                      <span>{onboardingErrors.principalNip}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: KUSTOMISASI SIDEBAR */}
          {onboardingStep === 2 && (
            <div className='py-4 max-h-[55vh] overflow-y-auto pr-1 text-left'>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
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
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${isChecked
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                    >
                      <div
                        className={`mt-0.5 h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${isChecked
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'border-slate-300 bg-white'
                          }`}
                      >
                        {isChecked && <Check className='h-3.5 w-3.5 stroke-[3]' />}
                      </div>
                      <div>
                        <span className='text-xs font-bold text-slate-900 block'>
                          {menu.label}
                        </span>
                        <span className='text-[11px] text-slate-500 block mt-0.5 leading-snug'>
                          {menu.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FOOTER BUTTONS */}
          <DialogFooter className='pt-4 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full gap-3'>
            {onboardingStep === 1 ? (
              <>
                <div className='text-[11px] text-slate-400 font-medium flex items-center gap-1'>
                  <span className='text-rose-500'>*</span>
                  <span>Wajib diisi sebelum masuk dashboard</span>
                </div>
                <Button
                  type='button'
                  onClick={handleNextStep}
                  className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm px-6 h-10 gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all'
                >
                  <span>Selanjutnya</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOnboardingStep(1)}
                  className='rounded-xl text-xs sm:text-sm px-5 h-10 gap-2 cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold'
                >
                  <ArrowLeft className='h-4 w-4' />
                  <span>Kembali</span>
                </Button>
                <Button
                  type='button'
                  onClick={handleSaveOnboarding}
                  disabled={isSavingOnboarding}
                  className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm px-6 h-10 gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-50'
                >
                  {isSavingOnboarding ? (
                    <span>Menyimpan Data...</span>
                  ) : (
                    <>
                      <span>Simpan & Masuk Dashboard</span>
                      <Sliders className='h-4 w-4' />
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
