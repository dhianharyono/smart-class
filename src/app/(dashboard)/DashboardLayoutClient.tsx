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
  Menu,
  X,
  BookOpen,
  LogOut,
  BookMarked,
  User,
  CheckSquare,
  Sparkles,
  Check,
  Settings,
  ChevronDown,
  ChevronRight,
  Calendar,
  CalendarClock,
  School,
  ArrowLeft,
  IdCard,
  UserCheck,
  AlertCircle,
  Plus,
  Loader2,
  MessageSquareText,
  Lock,
  Eye,
  EyeOff,
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
import {
  updateMenuPreferences,
  updateProfile,
  changePassword,
  switchActiveClass,
  addClass,
  deleteClass,
} from '@/actions/profileActions';
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
        ],
      },
      {
        name: 'Kelola Kelas',
        icon: School,
        children: [
          { name: 'Daftar Kelas', href: '/kelas', icon: School },
          {
            name: 'Jadwal Mengajar',
            href: '/jadwal-mengajar',
            icon: CalendarClock,
          },
        ],
      },
      { name: 'Jurnal Wali Kelas', href: '/jurnal', icon: BookMarked },
    ],
  },
  {
    category: 'PUSAT MASUKAN',
    items: [
      { name: 'Kritik & Saran', href: '/feedback', icon: MessageSquareText },
    ],
  },
];

const CONFIGURABLE_MENUS = [
  {
    href: '/kelas',
    label: 'Daftar Kelas',
    desc: 'Kelola daftar kelas yang diampu (multi-kelas)',
  },
  {
    href: '/jadwal-mengajar',
    label: 'Jadwal Mengajar',
    desc: 'Jadwal mengajar tatap muka guru & monitoring beban jam mengajar mingguan (JJM)',
  },
  {
    href: '/siswa',
    label: 'Data Siswa',
    desc: 'Manajemen data profil dan informasi siswa',
  },
  {
    href: '/absensi',
    label: 'Absensi Kelas',
    desc: 'Pencatatan daftar hadir harian & rekap presensi kelas',
  },
  {
    href: '/nilai',
    label: 'Nilai Akademik',
    desc: 'Penginputan nilai mata pelajaran & KKM',
  },
  {
    href: '/jurnal',
    label: 'Jurnal Wali Kelas',
    desc: 'Agenda harian mengajar guru & KBM',
  },
  {
    href: '/feedback',
    label: 'Kritik & Saran',
    desc: 'Kirim masukan, kritik, saran, atau laporan ke administrator',
  },
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

  // Menu Preferences state (auto-includes /kelas and /jadwal-mengajar for existing profiles)
  const [enabledMenus, setEnabledMenus] = useState<string[]>(() => {
    const base =
      teacher.enabledMenus && teacher.enabledMenus.length > 0
        ? teacher.enabledMenus
        : [
            '/dashboard',
            '/kelas',
            '/jadwal-mengajar',
            '/siswa',
            '/absensi',
            '/nilai',
            '/jurnal',
            '/feedback',
            '/profile',
            '/settings',
          ];
    return base.includes('/kelas') ? base : [...base, '/kelas'];
  });

  // Sync state if teacher prop changes
  React.useEffect(() => {
    if (teacher.enabledMenus && teacher.enabledMenus.length > 0) {
      const updated = teacher.enabledMenus.includes('/kelas')
        ? teacher.enabledMenus
        : [...teacher.enabledMenus, '/kelas'];
      setEnabledMenus(updated);
    }
  }, [teacher.enabledMenus]);

  // Check if teacher profile data is incomplete (including NIP & Principal info)
  const isProfileIncomplete = React.useMemo(() => {
    const isNipInvalid =
      !teacher.nip || teacher.nip.trim() === '' || teacher.nip.trim() === '-';
    const isPrincipalNameInvalid =
      !teacher.principalName || teacher.principalName.trim() === '';
    const isPrincipalNipInvalid =
      !teacher.principalNip ||
      teacher.principalNip.trim() === '' ||
      teacher.principalNip.trim() === '-';
    const isBasicInfoInvalid =
      !teacher.name || !teacher.schoolName || !teacher.className;

    return (
      !!teacher.isFirstLogin ||
      isNipInvalid ||
      isPrincipalNameInvalid ||
      isPrincipalNipInvalid ||
      isBasicInfoInvalid
    );
  }, [teacher]);

  // Active Teacher Multi-Class State
  const [currentClasses, setCurrentClasses] = useState<string[]>(() => {
    if (Array.isArray(teacher.classes) && teacher.classes.length > 0) {
      return Array.from(new Set(teacher.classes.filter(Boolean)));
    }
    return teacher.className ? [teacher.className] : [];
  });

  const [currentActiveClass, setCurrentActiveClass] = useState<string>(() => {
    if (teacher.activeClass && currentClasses.includes(teacher.activeClass))
      return teacher.activeClass;
    if (teacher.className) return teacher.className;
    return currentClasses[0] || '';
  });

  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // States for Profile Modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState<
    'profile' | 'security'
  >('profile');
  const [profileModalForm, setProfileModalForm] = useState({
    name: teacher.name || '',
    email: teacher.email || '',
    schoolName: teacher.schoolName || '',
    nip: teacher.nip && teacher.nip !== '-' ? teacher.nip : '',
    principalName: teacher.principalName || '',
    principalNip:
      teacher.principalNip && teacher.principalNip !== '-'
        ? teacher.principalNip
        : '',
  });
  const [passwordModalForm, setPasswordModalForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // States for Settings Modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsSelectedMenus, setSettingsSelectedMenus] = useState<string[]>(
    () => {
      return teacher.enabledMenus && teacher.enabledMenus.length > 0
        ? teacher.enabledMenus
        : CONFIGURABLE_MENUS.map((m) => m.href);
    },
  );
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync states when teacher changes
  React.useEffect(() => {
    setProfileModalForm({
      name: teacher.name || '',
      email: teacher.email || '',
      schoolName: teacher.schoolName || '',
      nip: teacher.nip && teacher.nip !== '-' ? teacher.nip : '',
      principalName: teacher.principalName || '',
      principalNip:
        teacher.principalNip && teacher.principalNip !== '-'
          ? teacher.principalNip
          : '',
    });
    if (teacher.enabledMenus && teacher.enabledMenus.length > 0) {
      setSettingsSelectedMenus(teacher.enabledMenus);
    }
  }, [teacher]);

  const [isSwitchingClass, setIsSwitchingClass] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassNameInput, setNewClassNameInput] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [deleteClassConfirm, setDeleteClassConfirm] = useState<{
    open: boolean;
    className: string;
  }>({
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
  const [onboardingOpen, setOnboardingOpen] =
    useState<boolean>(isProfileIncomplete);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2>(1);
  const [onboardingName, setOnboardingName] = useState(teacher.name || '');
  const [onboardingSchool, setOnboardingSchool] = useState(
    teacher.schoolName || '',
  );
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
    teacher.nip && teacher.nip !== '-' ? teacher.nip : '',
  );
  const [onboardingPrincipalName, setOnboardingPrincipalName] = useState(
    teacher.principalName || '',
  );
  const [onboardingPrincipalNip, setOnboardingPrincipalNip] = useState(
    teacher.principalNip && teacher.principalNip !== '-'
      ? teacher.principalNip
      : '',
  );
  const [schoolsList, setSchoolsList] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [onboardingErrors, setOnboardingErrors] = useState<
    Record<string, string>
  >({});

  const [selectedOnboardingMenus, setSelectedOnboardingMenus] = useState<
    string[]
  >(ALL_CONFIGURABLE_HREFS);
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
        toast.success(
          `Kelas ${clean} berhasil ditambahkan & menjadi kelas aktif!`,
        );
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

  // Profile Modal Submit Handler
  const handleProfileModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !profileModalForm.name.trim() ||
      profileModalForm.name.trim().length < 3
    ) {
      toast.error('Nama lengkap & gelar minimal 3 karakter.');
      return;
    }
    setIsSavingProfile(true);
    try {
      const res = await updateProfile({
        name: profileModalForm.name.trim(),
        email: profileModalForm.email.trim(),
        schoolName: profileModalForm.schoolName.trim(),
        classes:
          teacher.classes && teacher.classes.length > 0
            ? teacher.classes
            : teacher.className
              ? [teacher.className]
              : undefined,
        activeClass: teacher.activeClass || teacher.className,
        nip: profileModalForm.nip.trim() || '-',
        principalName: profileModalForm.principalName.trim(),
        principalNip: profileModalForm.principalNip.trim() || '-',
      });
      if (res.success) {
        toast.success('Data profil & sekolah berhasil disimpan!');
        setIsProfileModalOpen(false);
        router.refresh();
      } else {
        toast.error((res as any).error || 'Gagal menyimpan profil.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password Modal Submit Handler
  const handlePasswordModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalForm.currentPassword) {
      toast.error('Password saat ini wajib diisi.');
      return;
    }
    if (passwordModalForm.newPassword.length < 6) {
      toast.error('Password baru minimal 6 karakter.');
      return;
    }
    if (passwordModalForm.newPassword !== passwordModalForm.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok.');
      return;
    }
    setIsSavingPassword(true);
    try {
      const res = await changePassword({
        currentPassword: passwordModalForm.currentPassword,
        newPassword: passwordModalForm.newPassword,
      });
      if (res.success) {
        toast.success('Password akun berhasil diperbarui!');
        setPasswordModalForm({
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

  // Settings Modal Handlers
  const handleToggleSettingsMenu = (href: string) => {
    setSettingsSelectedMenus((prev) => {
      const next = prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href];
      return next;
    });
  };

  const handleSelectAllSettingsMenus = () => {
    const allHrefs = CONFIGURABLE_MENUS.map((m) => m.href);
    const isAll = allHrefs.every((h) => settingsSelectedMenus.includes(h));
    if (isAll) {
      setSettingsSelectedMenus(['/kelas']);
    } else {
      setSettingsSelectedMenus(allHrefs);
    }
  };

  const handleSettingsModalSubmit = async () => {
    if (settingsSelectedMenus.length === 0) {
      toast.error('Pilih setidaknya 1 menu untuk ditampilkan.');
      return;
    }
    setIsSavingSettings(true);
    try {
      const res = await updateMenuPreferences(settingsSelectedMenus, true);
      if (res.success) {
        toast.success('Pengaturan menu sidebar berhasil disimpan!');
        setIsSettingsModalOpen(false);
        window.location.reload();
      } else {
        toast.error((res as any).error || 'Gagal menyimpan pengaturan menu.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan preferensi menu.');
    } finally {
      setIsSavingSettings(false);
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
      errors.nip =
        'NIP/NUPTK wajib diisi dengan NIP/NUPTK yang valid (tidak boleh "-").';
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
      errors.className =
        'Kelas diajar wajib dimasukkan minimal 1 kelas (contoh: 5A).';
    }

    const cleanPrincipalName = onboardingPrincipalName.trim();
    if (!cleanPrincipalName) {
      errors.principalName = 'Nama kepala sekolah wajib diisi.';
    } else if (cleanPrincipalName.length < 3) {
      errors.principalName = 'Nama kepala sekolah minimal 3 karakter.';
    }

    const cleanPrincipalNip = onboardingPrincipalNip.trim();
    if (!cleanPrincipalNip || cleanPrincipalNip === '-') {
      errors.principalNip =
        'NIP kepala sekolah wajib diisi dengan NIP yang valid (tidak boleh "-").';
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
    if (
      classInputText.trim() &&
      !finalClasses.includes(classInputText.trim())
    ) {
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
      const finalMenus = [
        '/dashboard',
        ...selectedOnboardingMenus,
        '/profile',
        '/settings',
      ];
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
    <div className='flex h-full flex-col'>
      {/* Brand Header - Height 16 (64px) perfectly aligned with Desktop Top Header */}
      <div className='flex h-16 shrink-0 items-center justify-between gap-3 px-5 border-b border-slate-200/80'>
        <div className='flex items-center gap-3 min-w-0'>
          <div className='flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs shadow-emerald-500/20'>
            <BookOpen className='h-4 w-4' />
          </div>
          <div className='min-w-0'>
            <h1 className='text-[15px] font-bold leading-none bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent truncate'>
              Smart Class
            </h1>
            <p className='text-[11px] text-slate-500 font-medium mt-1 leading-none truncate'>
              Dashboard Wali Kelas
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
          {sidebarMenuGroups.map((group) => {
            const visibleItemsInGroup = group.items
              .map((item) => {
                if (item.children) {
                  const visibleChildren = item.children.filter((child) =>
                    enabledMenus.includes(child.href),
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
                        (child) =>
                          pathname === child.href ||
                          (child.href !== '/' &&
                            pathname.startsWith(child.href + '/')),
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
                                  isChildActive
                                    ? 'text-emerald-600'
                                    : 'text-slate-400'
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
                                const isSubActive =
                                  pathname === child.href ||
                                  (child.href !== '/' &&
                                    pathname.startsWith(child.href + '/'));
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
                                        isSubActive
                                          ? 'text-white'
                                          : 'text-slate-400'
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

                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/' &&
                        item.href !== '/dashboard' &&
                        pathname.startsWith(item.href + '/'));
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
                            isActive
                              ? 'text-emerald-600'
                              : 'text-slate-400 group-hover:text-slate-600'
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
            );
          })}
        </nav>
      </div>
    </div>
  );

  const renderClassSwitcherPill = (isMobile = false) => (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
        disabled={isSwitchingClass}
        className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 text-emerald-900 text-xs font-bold transition-all cursor-pointer shadow-2xs ${
          isSwitchingClass ? 'opacity-50' : ''
        }`}
      >
        <School className='h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 shrink-0' />
        <span className='truncate max-w-[80px] xs:max-w-[110px] sm:max-w-none'>
          {isMobile
            ? `Kelas ${currentActiveClass || '-'}`
            : `Kelas Aktif: ${currentActiveClass || '-'}`}
        </span>
        {isSwitchingClass ? (
          <Loader2 className='h-3.5 w-3.5 text-emerald-600 animate-spin shrink-0' />
        ) : (
          <ChevronDown className='h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 shrink-0' />
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
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <button
                      type='button'
                      onClick={() => handleSwitchClass(cls)}
                      className='w-full flex items-center gap-1.5 text-left cursor-pointer whitespace-nowrap'
                    >
                      <School
                        className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white' : 'text-emerald-600'}`}
                      />
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

  const renderProfileDropdown = (isMobile = false) => (
    <div className='relative'>
      <button
        type='button'
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        className={`flex items-center ${
          isMobile ? 'gap-1 p-0.5' : 'gap-2.5 p-1 sm:px-2.5 sm:py-1.5'
        } rounded-full hover:bg-slate-100/80 text-left transition-all duration-200 cursor-pointer group`}
      >
        {/* Avatar */}
        <div className='h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-xs border border-emerald-500/30 group-hover:scale-105 transition-transform'>
          {initialName}
        </div>

        {/* User Info (hidden on mobile, visible on desktop) */}
        {!isMobile && (
          <div className='hidden sm:flex flex-col min-w-0 max-w-[140px] lg:max-w-[180px] leading-tight'>
            <span className='text-xs font-bold text-slate-900 truncate group-hover:text-emerald-700 transition-colors'>
              {teacher.name || 'Guru Smart Class'}
            </span>
            <span className='text-[10px] text-slate-500 font-medium capitalize'>
              Wali Kelas
            </span>
          </div>
        )}

        <ChevronDown
          className={`${
            isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'
          } text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0 mr-0.5 ${
            isProfileDropdownOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isProfileDropdownOpen && (
        <>
          <div
            className='fixed inset-0 z-40'
            onClick={() => setIsProfileDropdownOpen(false)}
          />
          <div className='absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-2 animate-in fade-in-50 zoom-in-95 duration-150 divide-y divide-slate-100'>
            {/* User Identity Info */}
            <div className='p-2.5 pb-2'>
              <div className='flex items-center gap-2.5'>
                <div className='h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-xs border border-emerald-500/30'>
                  {initialName}
                </div>
                <div className='flex flex-col min-w-0 flex-1 leading-tight'>
                  <span className='text-xs font-bold text-slate-900 truncate'>
                    {teacher.name || 'Guru Smart Class'}
                  </span>
                  <span className='text-[10px] text-emerald-600 font-semibold capitalize'>
                    Wali Kelas
                  </span>
                </div>
              </div>
            </div>

            {/* Links */}
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
                <span>Profil & Sekolah</span>
              </button>
              <button
                type='button'
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  setIsSettingsModalOpen(true);
                }}
                className='w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer text-left'
              >
                <Settings className='h-4 w-4 text-slate-400' />
                <span>Pengaturan Menu</span>
              </button>
            </div>

            {/* Logout Action */}
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
          <div className='flex items-center gap-3.5 text-xs text-slate-500 font-medium'>
            {teacher.schoolName && (
              <span className='hidden lg:inline-block px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 font-semibold text-xs'>
                {teacher.schoolName}
              </span>
            )}
            {renderProfileDropdown(false)}
          </div>
        </header>

        {/* Mobile Top Header */}
        <header className='flex h-16 items-center justify-between border-b border-slate-200/80 px-3 sm:px-4 md:hidden bg-white/95 backdrop-blur-md sticky top-0 z-40 print:hidden'>
          {/* Left: Hamburger Button */}
          <button
            type='button'
            onClick={toggleSidebar}
            aria-label='Buka Menu Navigasi'
            className='flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer shrink-0'
          >
            <Menu className='h-5 w-5' />
          </button>

          {/* Right: Class Switcher Pill + Profile Dropdown */}
          <div className='flex items-center gap-1.5 sm:gap-2 shrink-0'>
            {renderClassSwitcherPill(true)}
            {renderProfileDropdown(true)}
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
        <main className='flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-fade-in min-w-0 max-w-full overflow-x-clip'>
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
              Masukkan nama kelas baru yang diampu (contoh: 5B, 6A, VII C).
              Kelas baru akan langsung diaktifkan.
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
        title='Konfirmasi Keluar'
        description='Apakah Anda yakin ingin keluar dari aplikasi Smart Class?'
        confirmText='Ya, Keluar'
        cancelText='Batal'
        variant='danger'
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
        <DialogContent
          showCloseButton={false}
          className='bg-white border border-slate-200 text-slate-900 rounded-3xl w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-2xl p-4 sm:p-7 shadow-2xl overflow-hidden text-left'
        >
          <DialogHeader className='pb-3 border-b border-slate-100'>
            {/* Top Bar with Badge & Logout Option */}
            <div className='flex items-center justify-between gap-2 pb-1'>
              <div className='flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 shadow-2xs shrink-0 max-w-[70%] sm:max-w-none'>
                <Sparkles className='h-3.5 w-3.5 text-emerald-600 shrink-0' />
                <span className='text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide truncate sm:whitespace-nowrap'>
                  {teacher.isFirstLogin
                    ? 'Aktivasi Akun Wali Kelas'
                    : 'Lengkapi Data Profil & Sekolah'}
                </span>
              </div>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setShowLogoutConfirm(true)}
                className='text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-rose-300 rounded-xl px-2.5 sm:px-3 py-1.5 h-8 gap-1.5 transition-all cursor-pointer shrink-0 whitespace-nowrap shadow-2xs'
              >
                <LogOut className='h-3.5 w-3.5 shrink-0' />
                <span>Keluar</span>
              </Button>
            </div>

            <div className='pt-2 space-y-1 text-left'>
              <DialogTitle className='text-lg sm:text-2xl font-black text-slate-900 tracking-tight'>
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
            <div className='grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-2 pt-3 pb-0.5 w-full'>
              <button
                type='button'
                onClick={() => setOnboardingStep(1)}
                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-w-0 ${
                  onboardingStep === 1
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                    onboardingStep === 1
                      ? 'bg-white/25 text-white'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  1
                </span>
                <span className='truncate sm:whitespace-nowrap'>
                  Data Profil & Sekolah
                </span>
              </button>
              <ChevronRight className='hidden sm:block h-3.5 w-3.5 text-slate-300 shrink-0' />
              <button
                type='button'
                onClick={() => handleNextStep()}
                className={`w-full sm:w-auto flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer min-w-0 ${
                  onboardingStep === 2
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                    onboardingStep === 2
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  2
                </span>
                <span className='truncate sm:whitespace-nowrap'>
                  Kustomisasi Menu
                </span>
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
                      if (onboardingErrors.name)
                        setOnboardingErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${
                      onboardingErrors.name
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
                      if (onboardingErrors.nip)
                        setOnboardingErrors((prev) => ({ ...prev, nip: '' }));
                    }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${
                      onboardingErrors.nip
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
                        if (onboardingErrors.school)
                          setOnboardingErrors((prev) => ({
                            ...prev,
                            school: '',
                          }));
                      }}
                      disabled={loadingSchools}
                      className={`w-full pl-10 pr-8 py-2.5 bg-slate-50/50 border ${
                        onboardingErrors.school
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
                          <option value='__NEW_SCHOOL__'>
                            + Tambah Baru...
                          </option>
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
                        if (onboardingErrors.school)
                          setOnboardingErrors((prev) => ({
                            ...prev,
                            school: '',
                          }));
                      }}
                      className={`w-full px-4 py-2.5 bg-slate-50/50 border ${
                        onboardingErrors.school
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

                <div className='space-y-1.5 sm:col-span-2'>
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-0.5 sm:gap-2'>
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
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${
                          onboardingErrors.className
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
                        if (onboardingErrors.principalName)
                          setOnboardingErrors((prev) => ({
                            ...prev,
                            principalName: '',
                          }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${
                        onboardingErrors.principalName
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
                        if (onboardingErrors.principalNip)
                          setOnboardingErrors((prev) => ({
                            ...prev,
                            principalNip: '',
                          }));
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${
                        onboardingErrors.principalNip
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
                            selectedOnboardingMenus.filter(
                              (m) => m !== menu.href,
                            ),
                          );
                        } else {
                          setSelectedOnboardingMenus([
                            ...selectedOnboardingMenus,
                            menu.href,
                          ]);
                        }
                      }}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`mt-0.5 h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && (
                          <Check className='h-3.5 w-3.5 stroke-[3]' />
                        )}
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
          <DialogFooter className='pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between w-full gap-2.5 sm:gap-3'>
            {onboardingStep === 1 ? (
              <>
                <div className='text-[11px] text-slate-400 font-medium flex items-center justify-center sm:justify-start gap-1 text-center sm:text-left'>
                  <span className='text-rose-500'>*</span>
                  <span>Wajib diisi sebelum masuk dashboard</span>
                </div>
                <Button
                  type='button'
                  onClick={handleNextStep}
                  className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm px-6 h-10 gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all w-full sm:w-auto justify-center'
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
                  className='rounded-xl text-xs sm:text-sm px-5 h-10 gap-2 cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold w-full sm:w-auto justify-center'
                >
                  <ArrowLeft className='h-4 w-4' />
                  <span>Kembali</span>
                </Button>
                <Button
                  type='button'
                  onClick={handleSaveOnboarding}
                  disabled={isSavingOnboarding}
                  className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm px-6 h-10 gap-2 shadow-md shadow-emerald-600/20 cursor-pointer transition-all disabled:opacity-50 w-full sm:w-auto justify-center'
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
        onOpenChange={(open) =>
          setDeleteClassConfirm((prev) => ({ ...prev, open }))
        }
        title='Hapus Kelas'
        description={`Apakah Anda yakin ingin menghapus Kelas ${deleteClassConfirm.className} dari daftar kelas Anda?`}
        confirmText='Hapus Kelas'
        cancelText='Batal'
        variant='danger'
        isLoading={isSwitchingClass}
        onConfirm={handleConfirmDeleteClassHeader}
      />

      {/* ================================================================= */}
      {/* MODAL PROFIL & SEKOLAH (Full Screen Backdrop Blur)                */}
      {/* ================================================================= */}
      {isProfileModalOpen && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200'>
          <div
            className='fixed inset-0'
            onClick={() => setIsProfileModalOpen(false)}
          />
          <div className='relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 my-auto animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20'>
                  <User className='h-5 w-5' />
                </div>
                <div>
                  <h2 className='text-base sm:text-lg font-black text-slate-900 tracking-tight'>
                    Profil & Informasi Sekolah
                  </h2>
                  <p className='text-xs text-slate-500 font-medium'>
                    Kelola informasi diri, NIP, serta data sekolah
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
                <span>Informasi Diri & Sekolah</span>
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
              <form
                onSubmit={handleProfileModalSubmit}
                className='p-6 space-y-4 max-h-[calc(85vh-180px)] overflow-y-auto'
              >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Nama Lengkap & Gelar{' '}
                      <span className='text-rose-500'>*</span>
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
                      placeholder='Contoh: Ahmad Dahlan, S.Pd.'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Alamat Email
                    </label>
                    <input
                      type='email'
                      disabled
                      value={profileModalForm.email}
                      className='w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs sm:text-sm font-medium cursor-not-allowed'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      NIP / NUPTK Guru
                    </label>
                    <input
                      type='text'
                      value={profileModalForm.nip}
                      onChange={(e) =>
                        setProfileModalForm({
                          ...profileModalForm,
                          nip: e.target.value,
                        })
                      }
                      placeholder='Masukkan NIP / NUPTK'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Nama Sekolah
                    </label>
                    <input
                      type='text'
                      value={profileModalForm.schoolName}
                      onChange={(e) =>
                        setProfileModalForm({
                          ...profileModalForm,
                          schoolName: e.target.value,
                        })
                      }
                      placeholder='Contoh: SDN 1 Mentari Pagi'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      Nama Kepala Sekolah
                    </label>
                    <input
                      type='text'
                      value={profileModalForm.principalName}
                      onChange={(e) =>
                        setProfileModalForm({
                          ...profileModalForm,
                          principalName: e.target.value,
                        })
                      }
                      placeholder='Contoh: Dr. H. Mulyadi, M.Pd.'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                  </div>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-bold text-slate-700 block'>
                      NIP Kepala Sekolah
                    </label>
                    <input
                      type='text'
                      value={profileModalForm.principalNip}
                      onChange={(e) =>
                        setProfileModalForm({
                          ...profileModalForm,
                          principalNip: e.target.value,
                        })
                      }
                      placeholder='Masukkan NIP Kepala Sekolah'
                      className='w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                  </div>
                </div>

                <div className='pt-3 flex items-center justify-end gap-2 border-t border-slate-100'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsProfileModalOpen(false)}
                    className='rounded-xl text-xs font-semibold'
                  >
                    Batal
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSavingProfile}
                    className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-5 shadow-sm shadow-emerald-600/20 cursor-pointer'
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin mr-1.5' />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Tab 2: Security Form */}
            {profileModalTab === 'security' && (
              <form
                onSubmit={handlePasswordModalSubmit}
                className='p-6 space-y-4 max-h-[calc(85vh-180px)] overflow-y-auto'
              >
                <div className='space-y-1.5'>
                  <label className='text-xs font-bold text-slate-700 block'>
                    Password Saat Ini <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={passwordModalForm.currentPassword}
                      onChange={(e) =>
                        setPasswordModalForm({
                          ...passwordModalForm,
                          currentPassword: e.target.value,
                        })
                      }
                      placeholder='Masukkan password saat ini'
                      className='w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                    <button
                      type='button'
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer'
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
                      value={passwordModalForm.newPassword}
                      onChange={(e) =>
                        setPasswordModalForm({
                          ...passwordModalForm,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder='Minimal 6 karakter'
                      className='w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                    <button
                      type='button'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer'
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
                    Konfirmasi Password Baru{' '}
                    <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={passwordModalForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordModalForm({
                          ...passwordModalForm,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder='Ulangi password baru'
                      className='w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
                    />
                    <button
                      type='button'
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer'
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                </div>

                <div className='pt-3 flex items-center justify-end gap-2 border-t border-slate-100'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setIsProfileModalOpen(false)}
                    className='rounded-xl text-xs font-semibold'
                  >
                    Batal
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSavingPassword}
                    className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-5 shadow-sm shadow-emerald-600/20 cursor-pointer'
                  >
                    {isSavingPassword ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin mr-1.5' />
                        <span>Mengubah...</span>
                      </>
                    ) : (
                      <span>Ubah Password</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL PENGATURAN MENU (Full Screen Backdrop Blur)                 */}
      {/* ================================================================= */}
      {isSettingsModalOpen && (
        <div className='fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200'>
          <div
            className='fixed inset-0'
            onClick={() => setIsSettingsModalOpen(false)}
          />
          <div className='relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 my-auto animate-in zoom-in-95 duration-200'>
            {/* Header */}
            <div className='flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20'>
                  <Settings className='h-5 w-5' />
                </div>
                <div>
                  <h2 className='text-base sm:text-lg font-black text-slate-900 tracking-tight'>
                    Pengaturan Menu Sidebar
                  </h2>
                  <p className='text-xs text-slate-500 font-medium'>
                    Pilih modul yang ingin diaktifkan atau disembunyikan pada
                    navigasi sidebar
                  </p>
                </div>
              </div>
              <button
                type='button'
                onClick={() => setIsSettingsModalOpen(false)}
                className='p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer'
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Content */}
            <div className='p-6 space-y-4 max-h-[calc(85vh-180px)] overflow-y-auto'>
              <div className='flex items-center justify-between pb-1'>
                <span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                  DAFTAR MODUL KBM TERSEDIA
                </span>
                <button
                  type='button'
                  onClick={handleSelectAllSettingsMenus}
                  className='text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer'
                >
                  {CONFIGURABLE_MENUS.map((m) => m.href).every((h) =>
                    settingsSelectedMenus.includes(h),
                  )
                    ? 'Hapus Semua'
                    : 'Pilih Semua'}
                </button>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5'>
                {CONFIGURABLE_MENUS.map((menu) => {
                  const isSelected = settingsSelectedMenus.includes(menu.href);
                  return (
                    <div
                      key={menu.href}
                      onClick={() => handleToggleSettingsMenu(menu.href)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-300/80 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className='flex items-start gap-2.5 min-w-0'>
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          <Check
                            className={`h-4 w-4 transition-transform ${isSelected ? 'scale-100' : 'scale-0'}`}
                          />
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='text-xs font-bold text-slate-900 truncate'>
                            {menu.label}
                          </div>
                          <div className='text-[11px] text-slate-500 line-clamp-1'>
                            {menu.desc}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className='p-6 pt-3 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/30'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsSettingsModalOpen(false)}
                className='rounded-xl text-xs font-semibold'
              >
                Batal
              </Button>
              <Button
                type='button'
                disabled={isSavingSettings}
                onClick={handleSettingsModalSubmit}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-5 shadow-sm shadow-emerald-600/20 cursor-pointer'
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin mr-1.5' />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Simpan Pengaturan</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
