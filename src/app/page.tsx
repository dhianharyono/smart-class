'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Users,
  CalendarCheck2,
  GraduationCap,
  Wallet,
  BookMarked,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Menu,
  X,
  Layers,
  TrendingUp,
  BarChart3,
  Zap,
  Award,
  Star,
  Smartphone,
  Lock,
  Settings,
  MousePointerClick,
  FileSpreadsheet,
  Check,
  Plus,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUserSession, logoutTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';

function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out transform ${isVisible
        ? 'opacity-100 translate-y-0 scale-100'
        : 'opacity-0 translate-y-8 scale-[0.98]'
        } ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    name: string;
    email: string;
    isAdmin: boolean;
  } | null>(null);

  useEffect(() => {
    getCurrentUserSession().then((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
  }, []);

  const dashboardHref = currentUser?.isAdmin ? '/admin' : '/dashboard';

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutSubmit = async () => {
    setIsLoggingOut(true);
    const res = await logoutTeacher();
    setIsLoggingOut(false);
    setShowLogoutConfirm(false);
    if (res.success) {
      setCurrentUser(null);
      toast.success('Berhasil keluar aplikasi');
    } else {
      toast.error(res.error || 'Gagal keluar aplikasi.');
    }
  };

  const [activeTab, setActiveTab] = useState<
    'absensi' | 'nilai' | 'tabungan' | 'jurnal' | 'siswa'
  >('absensi');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (
    e: React.MouseEvent<HTMLAnchorElement>,
    id: string,
  ) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className='min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 relative overflow-x-hidden'>
      {/* Background Ambient Glow Effects */}
      <div className='fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-[140px] pointer-events-none z-0' />
      <div className='fixed top-1/3 -right-48 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none z-0' />
      <div className='fixed bottom-10 -left-48 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none z-0' />

      {/* ==================== HEADER / NAVBAR ==================== */}
      <header className='sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800/80 transition-all'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between'>
          {/* Brand Logo */}
          <Link
            href='/'
            className='flex items-center gap-3 group cursor-pointer'
          >
            <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300'>
              <BookOpen className='h-6 w-6' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent'>
                  Smart Class
                </span>
              </div>
              <p className='text-[11px] text-zinc-400 font-medium'>
                Dashboard Wali Kelas
              </p>
            </div>
          </Link>

          {/* Quick Anchor Links (Desktop) */}
          <nav className='hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400'>
            <a
              href='#fitur'
              onClick={(e) => scrollToSection(e, 'fitur')}
              className='hover:text-emerald-400 transition-colors'
            >
              Fitur Unggulan
            </a>
            <a
              href='#modul'
              onClick={(e) => scrollToSection(e, 'modul')}
              className='hover:text-emerald-400 transition-colors'
            >
              Modul
            </a>
            <a
              href='#manfaat'
              onClick={(e) => scrollToSection(e, 'manfaat')}
              className='hover:text-emerald-400 transition-colors'
            >
              Mengapa Kami
            </a>
            <a
              href='#faq'
              onClick={(e) => scrollToSection(e, 'faq')}
              className='hover:text-emerald-400 transition-colors'
            >
              FAQ
            </a>
          </nav>

          {/* Action CTAs (Desktop) */}
          <div className='hidden md:flex items-center gap-3'>
            {currentUser ? (
              <div className='flex items-center gap-2.5'>
                <Link href={dashboardHref}>
                  <Button className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 flex items-center gap-2 cursor-pointer'>
                    <LayoutDashboard className='h-4 w-4' />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  onClick={() => setShowLogoutConfirm(true)}
                  className='border-zinc-800 bg-zinc-900/60 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 hover:border-rose-900/50 rounded-xl text-sm font-semibold px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-all'
                >
                  <LogOut className='h-4 w-4' />
                  <span>Keluar</span>
                </Button>
              </div>
            ) : (
              <>
                <Link href='/sign-in'>
                  <Button
                    variant='ghost'
                    className='text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-xl text-sm font-semibold px-4 cursor-pointer'
                  >
                    Masuk
                  </Button>
                </Link>
                <Link href='/sign-up'>
                  <Button className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-300 flex items-center gap-2 cursor-pointer'>
                    <span>Mulai Sekarang</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Hamburger Menu Button (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label='Toggle Mobile Menu'
            className='md:hidden p-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer'
          >
            {mobileMenuOpen ? (
              <X className='h-6 w-6 text-emerald-400' />
            ) : (
              <Menu className='h-6 w-6' />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className='md:hidden bg-zinc-950/95 border-b border-zinc-800/80 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 animate-fade-in'>
            <a
              href='#fitur'
              onClick={(e) => {
                scrollToSection(e, 'fitur');
                setMobileMenuOpen(false);
              }}
              className='block px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 transition-colors'
            >
              Fitur Unggulan
            </a>
            <a
              href='#modul'
              onClick={(e) => {
                scrollToSection(e, 'modul');
                setMobileMenuOpen(false);
              }}
              className='block px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 transition-colors'
            >
              Modul KBM
            </a>
            <a
              href='#manfaat'
              onClick={(e) => {
                scrollToSection(e, 'manfaat');
                setMobileMenuOpen(false);
              }}
              className='block px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 transition-colors'
            >
              Mengapa Kami
            </a>
            <a
              href='#faq'
              onClick={(e) => {
                scrollToSection(e, 'faq');
                setMobileMenuOpen(false);
              }}
              className='block px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-emerald-400 transition-colors'
            >
              FAQ
            </a>
            <div className='pt-3 border-t border-zinc-800/80 flex flex-col gap-2.5'>
              {currentUser ? (
                <>
                  <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                    <Button className='w-full justify-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl py-3 flex items-center gap-2 cursor-pointer'>
                      <LayoutDashboard className='h-4 w-4' />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setShowLogoutConfirm(true);
                    }}
                    className='w-full justify-center border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl font-semibold py-3 flex items-center gap-2 cursor-pointer'
                  >
                    <LogOut className='h-4 w-4' />
                    <span>Keluar</span>
                  </Button>
                </>
              ) : (
                <>
                  <Link href='/sign-in' onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant='ghost'
                      className='w-full justify-center text-zinc-300 hover:bg-zinc-900 rounded-xl font-semibold cursor-pointer'
                    >
                      Masuk Aplikasi
                    </Button>
                  </Link>
                  <Link href='/sign-up' onClick={() => setMobileMenuOpen(false)}>
                    <Button className='w-full justify-center bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl cursor-pointer'>
                      Mulai Sekarang
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className='relative z-10'>
        {/* ==================== HERO SECTION ==================== */}
        <section className='relative min-h-[70vh] sm:min-h-[80vh] py-8 sm:py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center justify-center'>
          <ScrollReveal>
            {/* Main Title H1 */}
            <h1 className='text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-snug sm:leading-[1.15]'>
              Smart Class
              <br />
              <span className='bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent'>
                Dashboard Wali Kelas Cerdas
              </span>
            </h1>

            {/* Subtitle */}
            <p className='mt-4 sm:mt-6 text-sm sm:text-lg md:text-xl text-zinc-400 max-w-2xl sm:max-w-3xl mx-auto leading-relaxed font-normal px-2'>
              Platform terpadu untuk pencatatan presensi siswa real-time,
              pengelolaan nilai akademik, buku tabungan digital, agenda jurnal
              harian, dan analisis perkembangan kelas tanpa ribet.
            </p>

            {/* CTA Buttons */}
            <div className='mt-6 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto'>
              {currentUser ? (
                <>
                  <Link href={dashboardHref} className='w-full sm:w-auto'>
                    <Button className='w-full sm:w-auto h-12 sm:h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-xl shadow-emerald-600/25 hover:shadow-emerald-500/40 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer'>
                      <LayoutDashboard className='h-5 w-5' />
                      <span>Buka Dashboard Saya</span>
                    </Button>
                  </Link>
                  <a
                    href='#fitur'
                    onClick={(e) => scrollToSection(e, 'fitur')}
                    className='w-full sm:w-auto'
                  >
                    <Button
                      variant='outline'
                      className='w-full sm:w-auto h-12 sm:h-14 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm sm:text-base px-6 sm:px-8 rounded-xl sm:rounded-2xl backdrop-blur-md transition-all flex items-center justify-center cursor-pointer'
                    >
                      <span>Jelajahi Fitur</span>
                    </Button>
                  </a>
                </>
              ) : (
                <>
                  <Link href='/sign-up' className='w-full sm:w-auto'>
                    <Button className='w-full sm:w-auto h-12 sm:h-14 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm sm:text-base px-6 sm:px-8 rounded-xl sm:rounded-2xl shadow-xl shadow-emerald-600/25 hover:shadow-emerald-500/40 transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer'>
                      <span>Daftar Smart Class</span>
                    </Button>
                  </Link>
                  <Link href='/sign-in' className='w-full sm:w-auto'>
                    <Button
                      variant='outline'
                      className='w-full sm:w-auto h-12 sm:h-14 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm sm:text-base px-6 sm:px-8 rounded-xl sm:rounded-2xl backdrop-blur-md transition-all flex items-center justify-center cursor-pointer'
                    >
                      <span>Masuk ke Dashboard</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Feature Micro-Badges */}
            <div className='mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-6 text-xs sm:text-sm text-zinc-400 font-medium'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 text-emerald-400 shrink-0' />
                <span>Tanpa Instalasi Aplikasi</span>
              </div>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 text-emerald-400 shrink-0' />
                <span>100% Bebas Kertas (Paperless)</span>
              </div>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 text-emerald-400 shrink-0' />
                <span>Akses HP, Tablet & Laptop</span>
              </div>
            </div>
          </ScrollReveal>
        </section>

        {/* ==================== STATS / IMPACT SECTION ==================== */}
        <section
          id='fitur'
          className='py-16 bg-zinc-900/40 border-y border-zinc-800/80 backdrop-blur-md'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-8 text-center'>
              <ScrollReveal delay={0}>
                <div className='space-y-2 p-4'>
                  <div className='text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight'>
                    100%
                  </div>
                  <div className='text-sm font-semibold text-zinc-200'>
                    Paperless System
                  </div>
                  <div className='text-xs text-zinc-500'>
                    Bebas buku fisik & kertas rekap manual
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={100}>
                <div className='space-y-2 p-4'>
                  <div className='text-3xl sm:text-4xl font-extrabold text-teal-400 tracking-tight'>
                    5+ Modul
                  </div>
                  <div className='text-sm font-semibold text-zinc-200'>
                    Terintegrasi Sempurna
                  </div>
                  <div className='text-xs text-zinc-500'>
                    Absensi, Nilai, Tabungan, Jurnal & Siswa
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={200}>
                <div className='space-y-2 p-4'>
                  <div className='text-3xl sm:text-4xl font-extrabold text-cyan-400 tracking-tight'>
                    80% Effisien
                  </div>
                  <div className='text-sm font-semibold text-zinc-200'>
                    Efisiensi Administrasi
                  </div>
                  <div className='text-xs text-zinc-500'>
                    Rekap bulanan/semester serba otomatis
                  </div>
                </div>
              </ScrollReveal>
              <ScrollReveal delay={300}>
                <div className='space-y-2 p-4'>
                  <div className='text-3xl sm:text-4xl font-extrabold text-emerald-400 tracking-tight'>
                    Safe Auth
                  </div>
                  <div className='text-sm font-semibold text-zinc-200'>
                    Perlindungan Data
                  </div>
                  <div className='text-xs text-zinc-500'>
                    Privasi data siswa tersimpan aman
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ==================== INTERACTIVE MODULE SHOWCASE ==================== */}
        <section
          id='modul'
          className='py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'
        >
          <ScrollReveal>
            <div className='text-center space-y-4 max-w-3xl mx-auto mb-16'>
              <h2 className='text-xs uppercase font-bold tracking-widest text-emerald-400'>
                Modul Utama Wali Kelas
              </h2>
              <p className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight'>
                Semua Kebutuhan Wali Kelas Dalam Satu Genggaman
              </p>
              <p className='text-base text-zinc-400'>
                Pilih modul di bawah ini untuk melihat simulasi antarmuka dan
                kemudahan penggunaannya.
              </p>
            </div>
          </ScrollReveal>

          {/* Module Tabs */}
          <ScrollReveal delay={100}>
            <div className='flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-3 sm:pb-0 mb-8 sm:mb-10 max-w-full px-1'>
              <button
                onClick={() => setActiveTab('absensi')}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${activeTab === 'absensi'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border-zinc-800'
                  }`}
              >
                <CalendarCheck2 className='h-4 w-4' />
                <span>Absensi Kelas</span>
              </button>
              <button
                onClick={() => setActiveTab('nilai')}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${activeTab === 'nilai'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border-zinc-800'
                  }`}
              >
                <GraduationCap className='h-4 w-4' />
                <span>Nilai Akademik</span>
              </button>
              <button
                onClick={() => setActiveTab('tabungan')}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${activeTab === 'tabungan'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border-zinc-800'
                  }`}
              >
                <Wallet className='h-4 w-4' />
                <span>Tabungan Siswa</span>
              </button>
              <button
                onClick={() => setActiveTab('jurnal')}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${activeTab === 'jurnal'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border-zinc-800'
                  }`}
              >
                <BookMarked className='h-4 w-4' />
                <span>Jurnal KBM</span>
              </button>
              <button
                onClick={() => setActiveTab('siswa')}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${activeTab === 'siswa'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                  : 'bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 border-zinc-800'
                  }`}
              >
                <Users className='h-4 w-4' />
                <span>Data Siswa</span>
              </button>
            </div>
          </ScrollReveal>

          {/* Active Tab Content Card */}
          <ScrollReveal delay={200}>
            <div
              key={activeTab}
              className='bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl transition-all animate-fade-in'
            >
              {activeTab === 'absensi' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20'>
                      <CalendarCheck2 className='h-3.5 w-3.5' />
                      <span>Presensi & Absensi Harian</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-white'>
                      Pencatatan Presensi Cepat Tanpa Ribet
                    </h3>
                    <p className='text-zinc-400 text-sm leading-relaxed'>
                      Input kehadiran siswa harian (Hadir, Sakit, Izin, Alpa)
                      secara praktis. Sistem akan mengalkulasi persentase
                      kehadiran bulanan dan semesteran secara otomatis.
                    </p>
                    <ul className='space-y-3 text-sm text-zinc-300'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-400' />
                        <span>
                          Input presensi cepat per kelas atau mata pelajaran
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-400' />
                        <span>
                          Ringkasan status Hadir, Izin, Sakit, Alpa per siswa
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-400' />
                        <span>
                          Rekapitulasi otomatis untuk laporan wali kelas
                        </span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl'>
                    <div className='flex items-center justify-between border-b border-zinc-800 pb-3'>
                      <span className='text-xs font-bold text-white'>
                        Presensi Hari Ini - Kelas 5A
                      </span>
                      <span className='text-[11px] text-emerald-400 font-semibold'>
                        24 Juli 2026
                      </span>
                    </div>
                    <div className='space-y-2.5'>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs'>
                        <span className='font-semibold text-zinc-200'>
                          Ahmad Fauzi (NIS: 1021)
                        </span>
                        <span className='px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold'>
                          HADIR
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs'>
                        <span className='font-semibold text-zinc-200'>
                          Budi Santoso (NIS: 1022)
                        </span>
                        <span className='px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-bold'>
                          IZIN
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs'>
                        <span className='font-semibold text-zinc-200'>
                          Citra Kirana (NIS: 1023)
                        </span>
                        <span className='px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold'>
                          HADIR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'nilai' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold border border-teal-500/20'>
                      <GraduationCap className='h-3.5 w-3.5' />
                      <span>Rekap & Penilaian Akademik</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-white'>
                      Kelola Nilai Tugas, UTS, & UAS Otomatis
                    </h3>
                    <p className='text-zinc-400 text-sm leading-relaxed'>
                      Input nilai per mata pelajaran, set nilai KKM standar, dan
                      biarkan Smart Class mengalkulasi rata-rata serta
                      memberikan notifikasi siswa yang perlu perhatian khusus.
                    </p>
                    <ul className='space-y-3 text-sm text-zinc-300'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-400' />
                        <span>Kalkulasi rata-rata akhir nilai otomatis</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-400' />
                        <span>
                          Indikator peringatan batas KKM mata pelajaran
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-400' />
                        <span>Export laporan nilai kelas dengan rapi</span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl'>
                    <div className='flex items-center justify-between border-b border-zinc-800 pb-3'>
                      <span className='text-xs font-bold text-white'>
                        Nilai Matematika - KKM: 75
                      </span>
                      <span className='text-[11px] text-teal-400 font-semibold'>
                        Tugas 1
                      </span>
                    </div>
                    <div className='space-y-2.5'>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs'>
                        <span className='font-semibold text-zinc-200'>
                          Ahmad Fauzi
                        </span>
                        <span className='font-mono font-extrabold text-emerald-400 text-sm'>
                          92
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs'>
                        <span className='font-semibold text-zinc-200'>
                          Dewi Sartika
                        </span>
                        <span className='font-mono font-extrabold text-rose-400 text-sm'>
                          68 (Perlu Remedial)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tabungan' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20'>
                      <Wallet className='h-3.5 w-3.5' />
                      <span>Buku Tabungan Digital</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-white'>
                      Pencatatan Kas & Tabungan Siswa Transparan
                    </h3>
                    <p className='text-zinc-400 text-sm leading-relaxed'>
                      Pencatatan transaksi setoran dan penarikan tabungan siswa
                      secara akurat. Bebas kesalahan hitung manual dengan
                      pencatatan saldo real-time.
                    </p>
                    <ul className='space-y-3 text-sm text-zinc-300'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-cyan-400' />
                        <span>
                          Catat setoran & penarikan kas tabungan kelas
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-cyan-400' />
                        <span>Histori mutasi saldo lengkap per siswa</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-cyan-400' />
                        <span>Laporan keuangan kelas yang transparan</span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl'>
                    <div className='flex items-center justify-between border-b border-zinc-800 pb-3'>
                      <span className='text-xs font-bold text-white'>
                        Saldo Tabungan Kelas
                      </span>
                      <span className='text-xs font-bold text-cyan-400'>
                        Rp 4.850.000
                      </span>
                    </div>
                    <div className='space-y-2.5'>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs'>
                        <div>
                          <div className='font-semibold text-zinc-200'>
                            Setoran - Ahmad Fauzi
                          </div>
                          <div className='text-[10px] text-zinc-500'>
                            24 Jul 2026
                          </div>
                        </div>
                        <span className='font-mono font-bold text-emerald-400'>
                          + Rp 50.000
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs'>
                        <div>
                          <div className='font-semibold text-zinc-200'>
                            Penarikan - Budi Santoso
                          </div>
                          <div className='text-[10px] text-zinc-500'>
                            23 Jul 2026
                          </div>
                        </div>
                        <span className='font-mono font-bold text-rose-400'>
                          - Rp 20.000
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'jurnal' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20'>
                      <BookMarked className='h-3.5 w-3.5' />
                      <span>Jurnal Harian Wali Kelas</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-white'>
                      Agenda KBM Harian Terintegrasi Presensi
                    </h3>
                    <p className='text-zinc-400 text-sm leading-relaxed'>
                      Dokumentasikan agenda kegiatan mengajar harian, materi
                      pembelajaran, serta absensi per siswa secara langsung
                      dalam satu formulir jurnal.
                    </p>
                    <ul className='space-y-3 text-sm text-zinc-300'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-400' />
                        <span>
                          Input jam pelajaran, mata pelajaran, & topik KBM
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-400' />
                        <span>Input presensi per siswa langsung di jurnal</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-400' />
                        <span>Arsip agenda harian wali kelas terorganisir</span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl'>
                    <div className='flex items-center justify-between border-b border-zinc-800 pb-3'>
                      <span className='text-xs font-bold text-white'>
                        Jurnal KBM - Jam 1-2
                      </span>
                      <span className='text-[11px] text-emerald-400 font-semibold'>
                        Bahasa Indonesia
                      </span>
                    </div>
                    <div className='p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-2'>
                      <div className='font-semibold text-zinc-200'>
                        Materi: Membaca Puisi & Struktur Bait
                      </div>
                      <div className='text-[11px] text-zinc-400'>
                        Catatan: Siswa antusias mengikuti latihan membaca depan
                        kelas.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'siswa' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold border border-teal-500/20'>
                      <Users className='h-3.5 w-3.5' />
                      <span>Database Siswa Terpusat</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-white'>
                      Kelola Profil & Informasi Siswa Terstruktur
                    </h3>
                    <p className='text-zinc-400 text-sm leading-relaxed'>
                      Database profil siswa lengkap mencakup NIS/NISN, jenis
                      kelamin, alamat, data kontak orang tua/wali, serta status
                      keaktifan siswa.
                    </p>
                    <ul className='space-y-3 text-sm text-zinc-300'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-400' />
                        <span>Pencarian & filter data siswa cepat</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-400' />
                        <span>Kontak orang tua/wali tercatat rapi</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-400' />
                        <span>Ekspor daftar siswa ke Excel/PDF</span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl'>
                    <div className='flex items-center justify-between border-b border-zinc-800 pb-3'>
                      <span className='text-xs font-bold text-white'>
                        Profil Siswa - Class 5A
                      </span>
                      <span className='text-[11px] text-teal-400 font-semibold'>
                        Active
                      </span>
                    </div>
                    <div className='p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs space-y-1.5'>
                      <div className='font-bold text-white'>
                        Ahmad Fauzi Rahmat
                      </div>
                      <div className='text-zinc-400'>
                        NISN: 0081234567 • Laki-laki
                      </div>
                      <div className='text-zinc-500 text-[11px]'>
                        Wali: Bpk. Rahmat (0812-3456-7890)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>
        </section>

        {/* ==================== KEY BENEFITS SECTION ==================== */}
        <section
          id='manfaat'
          className='py-24 bg-zinc-900/30 border-y border-zinc-800/80 relative'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <ScrollReveal>
              <div className='text-center space-y-4 max-w-3xl mx-auto mb-16'>
                <h2 className='text-xs uppercase font-bold tracking-widest text-emerald-400'>
                  Mengapa Memilih Smart Class
                </h2>
                <p className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight'>
                  Dirancang Khusus Untuk Memudahkan Tugas Wali Kelas
                </p>
              </div>
            </ScrollReveal>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {/* Card 1 */}
              <ScrollReveal delay={0}>
                <div className='p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-emerald-500/50 transition-all duration-300 space-y-4 group h-full'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform'>
                    <Zap className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-bold text-white'>
                    Hemat Waktu Administrasi
                  </h3>
                  <p className='text-sm text-zinc-400 leading-relaxed'>
                    Tidak ada lagi kalkulasi manual nilai atau rekap absensi
                    berjam-jam. Semuanya terakumulasi secara otomatis real-time.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 2 */}
              <ScrollReveal delay={150}>
                <div className='p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-teal-500/50 transition-all duration-300 space-y-4 group h-full'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-400 group-hover:scale-110 transition-transform'>
                    <Smartphone className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-bold text-white'>
                    Responsif Di Mana Saja
                  </h3>
                  <p className='text-sm text-zinc-400 leading-relaxed'>
                    Akses langsung dari HP di dalam ruang kelas, dari tablet,
                    atau laptop di rumah. Tampilan menyesuaikan secara optimal.
                  </p>
                </div>
              </ScrollReveal>

              {/* Card 3 */}
              <ScrollReveal delay={300}>
                <div className='p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 hover:border-cyan-500/50 transition-all duration-300 space-y-4 group h-full'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform'>
                    <Settings className='h-6 w-6' />
                  </div>
                  <h3 className='text-xl font-bold text-white'>
                    Fleksibel & Fleksibel Menu
                  </h3>
                  <p className='text-sm text-zinc-400 leading-relaxed'>
                    Bebas mengaktifkan atau menyembunyikan modul sidebar sesuai
                    kebutuhan spesifik wali kelas dan kebijakan sekolah.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* ==================== FAQ SECTION ==================== */}
        <section
          id='faq'
          className='py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto'
        >
          <ScrollReveal>
            <div className='text-center space-y-4 mb-16'>
              <h2 className='text-xs uppercase font-bold tracking-widest text-emerald-400'>
                FAQ
              </h2>
              <p className='text-3xl sm:text-4xl font-extrabold text-white tracking-tight'>
                Pertanyaan yang Sering Diajukan
              </p>
            </div>
          </ScrollReveal>

          <div className='space-y-4'>
            {[
              {
                q: 'Apakah Smart Class bisa diakses langsung melalui Smartphone/HP?',
                a: 'Ya, Smart Class dirancang dengan antarmuka yang fully responsive. Anda dapat menginput presensi, nilai, maupun jurnal harian dengan nyaman dari layar Smartphone, Tablet, maupun PC.',
              },
              {
                q: 'Apakah saya bisa menyesuaikan modul apa saja yang tampil di sidebar?',
                a: 'Sangat bisa! Smart Class dilengkapi fitur Custom Menu Preferences. Anda dapat memilih modul mana saja yang aktif (misalnya hanya Absensi & Jurnal) sesuai kebutuhan kelas Anda.',
              },
              {
                q: 'Bagaimana cara mendaftar dan mulai menggunakan aplikasi?',
                a: 'Cukup klik tombol "Mulai Gratis" atau "Daftar Baru", isi nama lengkap, email, nama sekolah, dan kata sandi. Akun Anda akan langsung aktif dan siap digunakan seketika.',
              },
              {
                q: 'Apakah data absensi dan nilai siswa saya aman?',
                a: 'Semua data disimpan dalam basis data terenkripsi dengan sesi autentikasi terproteksi tinggi. Hanya Anda sebagai wali kelas yang berhak mengelola data kelas Anda.',
              },
            ].map((item, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className='bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md transition-all'>
                  <button
                    onClick={() => toggleFaq(idx)}
                    className='w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-white text-base hover:text-emerald-400 transition-colors cursor-pointer'
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 text-zinc-400 transition-transform duration-300 flex-shrink-0 ${openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                        }`}
                    />
                  </button>
                  {openFaq === idx && (
                    <div className='px-6 pb-6 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-4'>
                      {item.a}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* ==================== FINAL CTA BANNER ==================== */}
        <section
          id='cta'
          className='py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'
        >
          <ScrollReveal>
            <div className='relative rounded-3xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-teal-950 border border-emerald-500/30 p-8 sm:p-14 text-center overflow-hidden shadow-2xl'>
              <div className='absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none' />
              <div className='relative z-10 space-y-6 max-w-3xl mx-auto'>
                <h2 className='text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight'>
                  Siap Tingkatkan Produktivitas Kelas Anda Hari Ini?
                </h2>
                <p className='text-base sm:text-lg text-zinc-300 font-normal'>
                  Bergabunglah dengan wali kelas modern lainnya dalam mengelola
                  administrasi kelas lebih cepat, akurat, dan paperless.
                </p>
                <div className='pt-4 flex flex-col sm:flex-row items-center justify-center gap-4'>
                  {currentUser ? (
                    <Link href={dashboardHref} className='w-full sm:w-auto'>
                      <Button className='w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base px-8 py-6 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer'>
                        <LayoutDashboard className='h-5 w-5' />
                        <span>Buka Dashboard</span>
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href='/sign-up' className='w-full sm:w-auto'>
                        <Button className='w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base px-8 py-6 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer'>
                          <span>Daftar Akun Wali Kelas</span>
                        </Button>
                      </Link>
                      <Link href='/sign-in' className='w-full sm:w-auto'>
                        <Button
                          variant='outline'
                          className='w-full sm:w-auto border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-200 font-semibold text-base px-8 py-6 rounded-2xl transition-all cursor-pointer'
                        >
                          <span>Masuk Aplikasi</span>
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className='border-t border-zinc-800/80 bg-zinc-950/90 py-12 relative z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-zinc-400'>
          <div className='flex items-center gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md'>
              <BookOpen className='h-4 w-4' />
            </div>
            <span className='font-extrabold text-white tracking-tight text-base'>
              Smart Class
            </span>
            <span className='text-xs text-zinc-500'>
              © 2026 Smart Class. All rights reserved.
            </span>
          </div>

          <div className='flex items-center gap-6 text-xs text-zinc-400'>
            <a
              href='#fitur'
              onClick={(e) => scrollToSection(e, 'fitur')}
              className='hover:text-emerald-400 transition-colors'
            >
              Fitur
            </a>
            <a
              href='#modul'
              onClick={(e) => scrollToSection(e, 'modul')}
              className='hover:text-emerald-400 transition-colors'
            >
              Modul
            </a>
            <a
              href='#manfaat'
              onClick={(e) => scrollToSection(e, 'manfaat')}
              className='hover:text-emerald-400 transition-colors'
            >
              Manfaat
            </a>
            <a
              href='#faq'
              onClick={(e) => scrollToSection(e, 'faq')}
              className='hover:text-emerald-400 transition-colors'
            >
              FAQ
            </a>
            <Link
              href={currentUser ? dashboardHref : '/sign-in'}
              className='hover:text-emerald-400 transition-colors'
            >
              {currentUser ? 'Dashboard' : 'Masuk'}
            </Link>
          </div>
        </div>
      </footer>

      {/* ==================== SCROLL TO TOP BUTTON ==================== */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label='Scroll to top'
          className='fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-2xl shadow-emerald-500/40 hover:scale-110 active:scale-95 transition-all duration-300 border border-emerald-400/40 cursor-pointer animate-bounce-slow'
        >
          <ArrowUp className='h-5 w-5' />
        </button>
      )}

      {/* ==================== LOGOUT CONFIRMATION DIALOG ==================== */}
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title='Konfirmasi Keluar Aplikasi'
        description='Apakah Anda yakin ingin keluar dari akun Smart Class?'
        confirmText='Ya, Keluar'
        cancelText='Batal'
        variant='danger'
        isLoading={isLoggingOut}
        onConfirm={handleLogoutSubmit}
      />
    </div>
  );
}
