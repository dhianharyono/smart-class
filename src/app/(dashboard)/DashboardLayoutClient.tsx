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
  Plus,
  Loader2,
  Trash2,
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
import { updateMenuPreferences, updateProfile, switchActiveClass, addClass, deleteClass } from '@/actions/profileActions';
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
      { name: 'Profil & Identitas Sekolah', href: '/profile', icon: User },
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
    _id?: string;
    name: string;
    email: string;
    schoolName?: string;
    className?: string;
    classes?: string[];
    activeClass?: string;
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

  // Active Teacher Multi-Class State
  const [currentClasses, setCurrentClasses] = useState<string[]>(() => {
    if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
      return Array.from(new Set(teacher.classes.filter(Boolean)));
    }
    return teacher.className ? [teacher.className] : [];
  });

  const [currentActiveClass, setCurrentActiveClass] = useState<string>(() => {
    if (teacher.activeClass && currentClasses.includes(teacher.activeClass)) return teacher.activeClass;
    if (teacher.className) return teacher.className;
    return currentClasses[0] || '';
  });

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isSwitchingClass, setIsSwitchingClass] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [deleteClassConfirm, setDeleteClassConfirm] = useState<{ open: boolean; className: string }>({
    open: false,
    className: '',
  });

  // Sync state if teacher prop changes
  React.useEffect(() => {
    if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
      setCurrentClasses(Array.from(new Set(teacher.classes.filter(Boolean))));
    }
    if (teacher.activeClass) {
      setCurrentActiveClass(teacher.activeClass);
    } else if (teacher.className) {
      setCurrentActiveClass(teacher.className);
    }
  }, [teacher.classes, teacher.activeClass, teacher.className]);

  // Onboarding Modal state
  const ALL_CONFIGURABLE_HREFS = CONFIGURABLE_MENUS.map((m) => m.href);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(isProfileIncomplete);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [onboardingName, setOnboardingName] = useState(teacher.name || '');
  const [onboardingSchool, setOnboardingSchool] = useState(teacher.schoolName || '');
  const [onboardingCustomSchool, setOnboardingCustomSchool] = useState('');

  // Onboarding Multi-Class Tags State
  const [onboardingClasses, setOnboardingClasses] = useState<string[]>(() => {
    if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
      return Array.from(new Set(teacher.classes.filter(Boolean)));
    }
    return teacher.className ? [teacher.className] : [];
  });
  const [classInputText, setClassInputText] = useState('');

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

  // Onboarding Class Tag Handlers with comma/slash auto-split
  const parseClassInput = (text: string): string[] => {
    return text
      .split(/[,/]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleAddOnboardingClassTag = () => {
    const parsed = parseClassInput(classInputText);
    if (parsed.length === 0) return;
    setOnboardingClasses((prev) => {
      const next = [...prev];
      parsed.forEach((c) => {
        if (!next.includes(c)) next.push(c);
      });
      return next;
    });
    setClassInputText('');
    if (onboardingErrors.className) {
      setOnboardingErrors((prev) => ({ ...prev, className: '' }));
    }
  };

  const handleRemoveOnboardingClassTag = (clsToRemove: string) => {
    setOnboardingClasses((prev) => prev.filter((c) => c !== clsToRemove));
  };

  // Switch Active Class Handler
  const handleSwitchClass = async (targetClass: string) => {
    if (targetClass === currentActiveClass || isSwitchingClass) return;
    setIsSwitchingClass(true);
    setIsClassDropdownOpen(false);
    try {
      const res = await switchActiveClass(targetClass);
      if (res.success) {
        setCurrentActiveClass(res.activeClass || targetClass);
        if (res.classes) setCurrentClasses(res.classes);
        toast.success(`Berhasil beralih ke Kelas ${targetClass}`);
        window.location.reload();
      } else {
        toast.error(res.error || 'Gagal mengganti kelas.');
        setIsSwitchingClass(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengganti kelas.');
      setIsSwitchingClass(false);
    }
  };

  // Add New Class Handler (from Topbar Dropdown)
  const handleAddNewClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newClassNameInput.trim();
    if (!clean) {
      toast.error('Nama kelas tidak boleh kosong.');
      return;
    }
    setIsAddingClass(true);
    try {
      const res = await addClass(clean);
      if (res.success) {
        setCurrentActiveClass(res.activeClass || clean);
        if (res.classes) setCurrentClasses(res.classes);
        setNewClassNameInput('');
        setIsAddClassModalOpen(false);
        toast.success(`Kelas ${clean} berhasil ditambahkan & menjadi kelas aktif!`);
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menambahkan kelas baru.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan kelas baru.');
    } finally {
      setIsAddingClass(false);
    }
  };

  // Delete Class Handler (from Topbar Dropdown)
  const promptDeleteClassHeader = (classToDelete: string) => {
    if (currentClasses.length <= 1) {
      toast.error('Minimal harus memiliki 1 kelas.');
      return;
    }
    setDeleteClassConfirm({ open: true, className: classToDelete });
  };

  const handleConfirmDeleteClassHeader = async () => {
    const classToDelete = deleteClassConfirm.className;
    if (!classToDelete) return;
    setIsSwitchingClass(true);
    setIsClassDropdownOpen(false);
    try {
      const res = await deleteClass(classToDelete);
      if (res.success) {
        setCurrentActiveClass(res.activeClass || '');
        if (res.classes) setCurrentClasses(res.classes);
        toast.success(`Kelas ${classToDelete} berhasil dihapus.`);
        setDeleteClassConfirm({ open: false, className: '' });
        window.location.reload();
      } else {
        toast.error(res.error || 'Gagal menghapus kelas.');
        setIsSwitchingClass(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kelas.');
      setIsSwitchingClass(false);
    }
  };

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

    // Auto add typed class if user forgot to click + Tambah
    const finalClasses = [...onboardingClasses];
    if (classInputText.trim()) {
      const parsed = parseClassInput(classInputText);
      parsed.forEach((c) => {
        if (!finalClasses.includes(c)) finalClasses.push(c);
      });
      setOnboardingClasses(finalClasses);
      setClassInputText('');
    }

    if (finalClasses.length === 0) {
      errors.className = 'Kelas diajar wajib dimasukkan minimal 1 kelas (contoh: 5A).';
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

    const finalClasses = [...onboardingClasses];
    if (classInputText.trim() && !finalClasses.includes(classInputText.trim())) {
      finalClasses.push(classInputText.trim());
    }

    setIsSavingOnboarding(true);
    try {
      // 1. Update Profile (Nama, Sekolah, Classes, NIP, Principal Name & NIP)
      await updateProfile({
        name: onboardingName.trim(),
        email: teacher.email,
        schoolName: finalSchoolName,
        className: finalClasses[0] || '5A',
        classes: finalClasses,
        activeClass: finalClasses[0] || '5A',
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

  const renderClassSwitcherPill = (isMobile = false) => (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
        disabled={isSwitchingClass}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-900 text-xs font-bold transition-all cursor-pointer shadow-2xs ${isSwitchingClass ? 'opacity-50' : ''
          }`}
      >
        <School className='h-4 w-4 text-emerald-600 shrink-0' />
        <span className='truncate max-w-[120px] sm:max-w-none'>
          {isMobile ? `Kelas ${currentActiveClass || '-'}` : `Kelas Aktif: ${currentActiveClass || '-'}`}
        </span>
        {isSwitchingClass ? (
          <Loader2 className='h-3.5 w-3.5 text-emerald-600 animate-spin shrink-0' />
        ) : (
          <ChevronDown className='h-3.5 w-3.5 text-emerald-600 shrink-0' />
        )}
      </button>

      {isClassDropdownOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsClassDropdownOpen(false)}
          />
          <div className='absolute right-0 sm:left-0 mt-2 min-w-full w-max bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 animate-in fade-in-50 zoom-in-95 duration-150'>
            <div className='px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 whitespace-nowrap'>
              PILIH KELAS AKTIF
            </div>
            <div className='space-y-1 max-h-48 overflow-y-auto my-1'>
              {currentClasses.map((cls) => {
                const isActive = cls === currentActiveClass;
                return (
                  <div
                    key={cls}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                      }`}
                  >
                    <button
                      type='button'
                      onClick={() => handleSwitchClass(cls)}
                      className='w-full flex items-center gap-1.5 text-left cursor-pointer whitespace-nowrap'
                    >
                      <School className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                      <span>Kelas {cls}</span>
                      {isActive && (
                        <span className='text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-extrabold ml-5 shrink-0'>
                          AKTIF
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className='border-t border-slate-100 pt-1.5 mt-1 space-y-0.5'>
              <button
                type='button'
                onClick={() => {
                  setIsClassDropdownOpen(false);
                  setIsAddClassModalOpen(true);
                }}
                className='w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer whitespace-nowrap'
              >
                <Plus className='h-4 w-4 text-emerald-600 shrink-0' />
                <span>Tambah Kelas Baru</span>
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
      <aside className='hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-slate-200/80 shadow-xs print:hidden'>
        {sidebarContent}
      </aside>

      {/* Main Content Area */}
      <div className='flex-1 md:pl-64 flex flex-col min-w-0 max-w-full print:pl-0 print:m-0'>
        {/* Desktop Top Header Bar */}
        <header className='hidden md:flex h-16 items-center justify-between border-b border-slate-200/80 px-8 bg-white/80 backdrop-blur-md sticky top-0 z-30 print:hidden'>
          <div className='flex items-center gap-4'>
            {renderClassSwitcherPill(false)}
          </div>
          <div className='flex items-center gap-3 text-xs text-slate-500 font-medium'>
            {teacher.schoolName && (
              <span className='px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 font-semibold'>
                {teacher.schoolName}
              </span>
            )}
          </div>
        </header>

        {/* Mobile Top Header */}
        <header className='flex h-16 items-center justify-between border-b border-slate-200/80 px-4 md:hidden bg-white/90 backdrop-blur-md sticky top-0 z-40 print:hidden'>
          <div className='flex items-center gap-2'>
            <BookOpen className='h-5 w-5 text-emerald-600 shrink-0' />
            <span className='font-bold text-emerald-700 text-sm hidden xs:inline'>
              Smart Class
            </span>
          </div>
          <div className='flex items-center gap-2'>
            {renderClassSwitcherPill(true)}
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
          </div>
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

      {/* Add New Class Modal */}
      <Dialog open={isAddClassModalOpen} onOpenChange={setIsAddClassModalOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-3xl max-w-md p-6 shadow-2xl'>
          <DialogHeader>
            <DialogTitle className='text-lg font-black text-slate-900 flex items-center gap-2'>
              <School className='h-5 w-5 text-emerald-600' />
              <span>Tambah Kelas Baru</span>
            </DialogTitle>
            <DialogDescription className='text-xs text-slate-500 font-medium'>
              Masukkan nama kelas baru yang diampu (contoh: 5B, 6A, VII C). Kelas baru akan langsung diaktifkan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddNewClassSubmit} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                NAMA KELAS <span className='text-rose-500'>*</span>
              </label>
              <input
                type='text'
                required
                placeholder='Contoh: 5B'
                value={newClassNameInput}
                onChange={(e) => setNewClassNameInput(e.target.value)}
                disabled={isAddingClass}
                className='w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all'
              />
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAddClassModalOpen(false)}
                disabled={isAddingClass}
                className='rounded-xl text-xs font-semibold cursor-pointer'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isAddingClass || !newClassNameInput.trim()}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-5 shadow-sm shadow-emerald-600/20 cursor-pointer'
              >
                {isAddingClass ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-1' />
                    <span>Menambahkan...</span>
                  </>
                ) : (
                  <span>Simpan & Aktifkan</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Class Switching Full-Screen Loading Overlay */}
      {isSwitchingClass && (
        <div className='fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white animate-in fade-in duration-200'>
          <div className='h-12 w-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl'>
            <Loader2 className='h-6 w-6 animate-spin text-emerald-400' />
          </div>
          <p className='text-sm font-bold tracking-wide text-emerald-100'>
            Beralih ke Data Kelas...
          </p>
        </div>
      )}

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
                <span className='whitespace-nowrap'>Kustomisasi Menu</span>
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

                <div className='space-y-1.5 sm:col-span-2'>
                  <div className='flex items-center justify-between'>
                    <label className='text-xs font-bold uppercase tracking-wider text-slate-700 block'>
                      KELAS DIAJAR <span className='text-rose-500'>*</span>
                    </label>
                    <span className='text-[10px] text-slate-500 font-medium'>
                      (Bisa lebih dari 1 kelas. Tekan Enter atau klik + Tambah)
                    </span>
                  </div>
                  <div className='flex gap-2'>
                    <div className='relative flex-1'>
                      <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                        <GraduationCap className='h-4 w-4' />
                      </div>
                      <input
                        type='text'
                        placeholder='Misal: 5A / 5B / VI C'
                        value={classInputText}
                        onChange={(e) => setClassInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOnboardingClassTag();
                          }
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${onboardingErrors.className
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 bg-rose-50/20'
                          : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                          } text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:outline-none rounded-xl text-sm font-medium transition-all`}
                      />
                    </div>
                    <Button
                      type='button'
                      onClick={handleAddOnboardingClassTag}
                      className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 rounded-xl text-xs shrink-0 cursor-pointer h-[42px]'
                    >
                      + Tambah
                    </Button>
                  </div>

                  {/* Class Badge Tags */}
                  {onboardingClasses.length > 0 && (
                    <div className='flex flex-wrap gap-1.5 pt-1.5'>
                      {onboardingClasses.map((cls, idx) => (
                        <span
                          key={cls}
                          className='inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs'
                        >
                          <span>Kelas {cls}</span>
                          {idx === 0 && (
                            <span className='text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-md font-semibold'>
                              Utama
                            </span>
                          )}
                          <button
                            type='button'
                            onClick={() => handleRemoveOnboardingClassTag(cls)}
                            className='hover:text-rose-600 text-slate-400 transition-colors ml-0.5 cursor-pointer'
                          >
                            <X className='h-3.5 w-3.5' />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

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
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Confirm Hapus Kelas */}
      <ConfirmDialog
        open={deleteClassConfirm.open}
        onOpenChange={(open) => setDeleteClassConfirm((prev) => ({ ...prev, open }))}
        title="Hapus Kelas"
        description={`Apakah Anda yakin ingin menghapus Kelas ${deleteClassConfirm.className} dari daftar kelas Anda?`}
        confirmText="Hapus Kelas"
        cancelText="Batal"
        variant="danger"
        isLoading={isSwitchingClass}
        onConfirm={handleConfirmDeleteClassHeader}
      />
    </div>
  );
}
