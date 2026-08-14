'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  CalendarCheck2,
  GraduationCap,
  Wallet,
  BookMarked,
  ArrowUp,
  ChevronDown,
  Menu,
  X,
  Zap,
  Smartphone,
  Check,
  LayoutDashboard,
  LogOut,
  Loader2,
  Calendar,
  Printer,
  FileSpreadsheet,
  Sparkles,
  Download,
  School,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUserSession, logoutTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function LandingPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    userId: string;
    name: string;
    email: string;
    isAdmin: boolean;
  } | null>(null);
  const [navigatingButton, setNavigatingButton] = useState<string | null>(null);

  useEffect(() => {
    // Prefetch dashboard route preemptively for logged in session
    router.prefetch('/dashboard');
    router.prefetch('/admin');

    getCurrentUserSession().then((user) => {
      if (user) {
        setCurrentUser(user);
        router.prefetch(user.isAdmin ? '/admin' : '/dashboard');
      }
    });
  }, [router]);

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
    'absensi' | 'nilai' | 'jurnal' | 'tabungan' | 'jadwal' | 'multikelas'
  >('absensi');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'scrollRestoration' in window.history
    ) {
      window.history.scrollRestoration = 'manual';
    }
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
    <div className='min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden'>
      {/* Background Ambient Glow Effects */}
      <div className='fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-emerald-500/10 via-teal-500/5 to-transparent blur-[140px] pointer-events-none z-0' />
      <div className='fixed top-1/3 -right-48 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[160px] pointer-events-none z-0' />
      <div className='fixed bottom-10 -left-48 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none z-0' />

      {/* ==================== HEADER / NAVBAR ==================== */}
      <header className='sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-slate-200/80 transition-all shadow-xs'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between min-h-[72px] sm:min-h-[80px]'>
          {/* Brand Logo */}
          <Link
            href='/'
            className='flex items-center gap-3 group cursor-pointer shrink-0'
          >
            <div className='flex h-9 w-9 lg:h-11 lg:w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md group-hover:scale-105 transition-transform duration-300'>
              <BookOpen className='h-4 w-4 lg:h-6 lg:w-6' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <span className='text-sm lg:text-xl font-extrabold tracking-tight text-slate-900 leading-none'>
                  Smart Class
                </span>
              </div>
              <p className='text-xs lg:text-[11px] text-slate-500 font-bold mt-0.5'>
                Dashboard Wali Kelas
              </p>
            </div>
          </Link>

          {/* Quick Anchor Links (Desktop) */}
          <nav className='hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600'>
            <a
              href='#fitur'
              onClick={(e) => scrollToSection(e, 'fitur')}
              className='hover:text-emerald-600 transition-colors'
            >
              Fitur Unggulan
            </a>
            <a
              href='#modul'
              onClick={(e) => scrollToSection(e, 'modul')}
              className='hover:text-emerald-600 transition-colors'
            >
              Modul KBM
            </a>
            <a
              href='#manfaat'
              onClick={(e) => scrollToSection(e, 'manfaat')}
              className='hover:text-emerald-600 transition-colors'
            >
              Mengapa Kami
            </a>
            <a
              href='#faq'
              onClick={(e) => scrollToSection(e, 'faq')}
              className='hover:text-emerald-600 transition-colors'
            >
              FAQ
            </a>
          </nav>

          {/* Action CTAs (Desktop) */}
          <div className='hidden md:flex items-center gap-3'>
            {currentUser ? (
              <div className='flex items-center gap-2.5'>
                <Link
                  href={dashboardHref}
                  onClick={() => setNavigatingButton('header')}
                >
                  <Button
                    disabled={navigatingButton !== null}
                    className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all duration-300 flex items-center gap-2 cursor-pointer'
                  >
                    {navigatingButton === 'header' ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        <span>Membuka...</span>
                      </>
                    ) : (
                      <>
                        <LayoutDashboard className='h-4 w-4' />
                        <span>Dashboard</span>
                      </>
                    )}
                  </Button>
                </Link>
                <Button
                  variant='outline'
                  onClick={() => setShowLogoutConfirm(true)}
                  className='border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 hover:border-rose-200 rounded-xl text-sm font-semibold px-4 py-2.5 flex items-center gap-2 cursor-pointer transition-all shadow-xs'
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
                    className='text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-sm font-semibold px-4 cursor-pointer'
                  >
                    Masuk
                  </Button>
                </Link>
                <Link href='/sign-up'>
                  <Button className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all duration-300 flex items-center gap-2 cursor-pointer'>
                    <span>Daftar Sekarang</span>
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Hamburger Menu Button (Mobile) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label='Toggle Mobile Menu'
            className='md:hidden p-2.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer'
          >
            {mobileMenuOpen ? (
              <X className='h-6 w-6 text-emerald-600' />
            ) : (
              <Menu className='h-6 w-6' />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className='md:hidden bg-white/95 border-b border-slate-200 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2 overflow-hidden shadow-md'
            >
              <a
                href='#fitur'
                onClick={(e) => {
                  scrollToSection(e, 'fitur');
                  setMobileMenuOpen(false);
                }}
                className='block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors'
              >
                Fitur Unggulan
              </a>
              <a
                href='#modul'
                onClick={(e) => {
                  scrollToSection(e, 'modul');
                  setMobileMenuOpen(false);
                }}
                className='block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors'
              >
                Modul KBM
              </a>
              <a
                href='#manfaat'
                onClick={(e) => {
                  scrollToSection(e, 'manfaat');
                  setMobileMenuOpen(false);
                }}
                className='block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors'
              >
                Mengapa Kami
              </a>
              <a
                href='#faq'
                onClick={(e) => {
                  scrollToSection(e, 'faq');
                  setMobileMenuOpen(false);
                }}
                className='block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-700 transition-colors'
              >
                FAQ
              </a>
              <div className='pt-3 border-t border-slate-200 flex flex-col gap-2.5'>
                {currentUser ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={() => {
                        setNavigatingButton('mobile');
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Button
                        disabled={navigatingButton !== null}
                        className='w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-3 flex items-center gap-2 cursor-pointer shadow-xs'
                      >
                        {navigatingButton === 'mobile' ? (
                          <>
                            <Loader2 className='h-4 w-4 animate-spin' />
                            <span>Membuka...</span>
                          </>
                        ) : (
                          <>
                            <LayoutDashboard className='h-4 w-4' />
                            <span>Dashboard</span>
                          </>
                        )}
                      </Button>
                    </Link>
                    <Button
                      variant='outline'
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setShowLogoutConfirm(true);
                      }}
                      className='w-full justify-center border-slate-200 bg-white text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl font-semibold py-3 flex items-center gap-2 cursor-pointer shadow-xs'
                    >
                      <LogOut className='h-4 w-4' />
                      <span>Keluar</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      href='/sign-in'
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button
                        variant='ghost'
                        className='w-full justify-center text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer'
                      >
                        Masuk Aplikasi
                      </Button>
                    </Link>
                    <Link
                      href='/sign-up'
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className='w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs'>
                        Daftar Sekarang
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className='relative z-10'>
        {/* ==================== HERO SECTION ==================== */}
        <section className='relative pt-12 sm:pt-20 lg:pt-24 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center justify-center'>
          {/* Main Title H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className='text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 max-w-4xl mx-auto leading-tight sm:leading-[1.12]'
          >
            Smart Class
            <span className='block mt-1 sm:mt-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 bg-clip-text text-transparent'>
              Dashboard Wali Kelas
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className='mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal px-2'
          >
            Satu sistem terpadu untuk pencatatan presensi siswa, penilaian
            akademik, jurnal KBM, jadwal pelajaran, dan laporan cetak siap
            pakai.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className='mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto max-w-xs sm:max-w-none mx-auto'
          >
            {currentUser ? (
              <>
                <Link
                  href={dashboardHref}
                  onClick={() => setNavigatingButton('hero')}
                  className='w-full sm:w-auto'
                >
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      disabled={navigatingButton !== null}
                      className='w-full sm:w-auto h-12 sm:h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-7 sm:px-9 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer'
                    >
                      {navigatingButton === 'hero' ? (
                        <>
                          <Loader2 className='h-5 w-5 animate-spin' />
                          <span>Membuka Dashboard...</span>
                        </>
                      ) : (
                        <>
                          <LayoutDashboard className='h-5 w-5' />
                          <span>Dashboard</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </Link>
                <a
                  href='#modul'
                  onClick={(e) => scrollToSection(e, 'modul')}
                  className='w-full sm:w-auto'
                >
                  <Button
                    variant='outline'
                    className='w-full sm:w-auto h-12 sm:h-14 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm sm:text-base px-6 sm:px-8 rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-xs'
                  >
                    <span>Lihat Modul KBM</span>
                  </Button>
                </a>
              </>
            ) : (
              <>
                <Link href='/sign-up' className='w-full sm:w-auto'>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button className='w-full sm:w-auto h-12 sm:h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-7 sm:px-9 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer'>
                      <span>Daftar Sekarang</span>
                    </Button>
                  </motion.div>
                </Link>
                <Link href='#modul' className='w-full sm:w-auto'>
                  <Button
                    variant='outline'
                    className='w-full sm:w-auto h-12 sm:h-14 border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm sm:text-base px-6 sm:px-8 rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-xs'
                  >
                    <span>Lihat Modul Wali Kelas</span>
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Hero Interactive Showcase Mockup Card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
            className='mt-12 sm:mt-14 w-full max-w-4xl rounded-3xl bg-white border border-slate-200/90 shadow-lg p-4 sm:p-6 overflow-hidden text-left'
          >
            {/* Top Bar Fake App Shell */}
            <div className='flex items-center justify-between border-b border-slate-200 pb-3 mb-4 flex-wrap gap-2'>
              <div className='flex items-center gap-3 min-w-0'>
                <div className='flex gap-1.5 shrink-0'>
                  <div className='w-3 h-3 rounded-full bg-slate-300' />
                  <div className='w-3 h-3 rounded-full bg-slate-300' />
                  <div className='w-3 h-3 rounded-full bg-slate-300' />
                </div>
                <span className='text-xs font-bold text-slate-700 truncate'>
                  Smart Class — Dashboard Wali Kelas
                </span>
              </div>
              <div className='flex items-center gap-2 shrink-0'>
                <div className='hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200'>
                  <span className='w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse' />
                  <span>Responsive</span>
                </div>
              </div>
            </div>

            {/* Fake Dashboard Grid Preview */}
            <div className='grid grid-cols-1 sm:grid-cols-3 gap-3.5'>
              {/* Card 1: Presensi Live */}
              <div className='p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-800 flex items-center gap-1.5'>
                    <CalendarCheck2 className='h-3.5 w-3.5 text-emerald-600' />
                    Presensi Harian
                  </span>
                  <span className='text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full'>
                    96.5% Hadir
                  </span>
                </div>
                <div className='space-y-1 text-xs'>
                  <div className='flex justify-between p-2 rounded-xl bg-white border border-slate-200/80 font-medium'>
                    <span>Hadir: 28 Siswa</span>
                    <span className='text-emerald-600 font-bold'>✓</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Tabungan Kelas */}
              <div className='p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-800 flex items-center gap-1.5'>
                    <Wallet className='h-3.5 w-3.5 text-teal-600' />
                    Kas Tabungan
                  </span>
                  <span className='text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full'>
                    Real-time
                  </span>
                </div>
                <div className='p-2 rounded-xl bg-white border border-slate-200/80'>
                  <div className='text-base font-extrabold text-teal-700 font-mono'>
                    Rp 4.850.000
                  </div>
                </div>
              </div>

              {/* Card 3: Evaluasi Akademik */}
              <div className='p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-800 flex items-center gap-1.5'>
                    <GraduationCap className='h-3.5 w-3.5 text-indigo-600' />
                    Nilai Kelas
                  </span>
                  <span className='text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full'>
                    KKM: 75
                  </span>
                </div>
                <div className='p-2 rounded-xl bg-white border border-slate-200/80'>
                  <div className='text-base font-extrabold text-indigo-700 font-mono'>
                    85.4 / 100
                  </div>
                </div>
              </div>

              {/* Card 4: Feature Highlight Banner */}
              <div className='sm:col-span-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0'>
                    <Printer className='h-4 w-4' />
                  </div>
                  <div>
                    <div className='text-xs font-extrabold text-slate-900 flex items-center gap-1.5'>
                      <span>Pratinjau Cetak & Ekspor Laporan</span>
                    </div>
                    <div className='text-[11px] text-slate-600 font-medium'>
                      Dinamis dan siap cetak lengkap dengan TTD Wali Kelas,
                      Kepala Sekolah & NIP/NUPTK.
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-2 text-[11px] font-extrabold self-end sm:self-center shrink-0'>
                  <span className='px-2.5 py-1 rounded-lg bg-emerald-600 text-white flex items-center gap-1 shadow-xs'>
                    <Download className='h-3 w-3' /> PDF Ready
                  </span>
                  <span className='px-2.5 py-1 rounded-lg bg-teal-700 text-white flex items-center gap-1 shadow-xs'>
                    <FileSpreadsheet className='h-3 w-3' /> Excel Export
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ==================== STATS / IMPACT SECTION ==================== */}
        <section
          id='fitur'
          className='py-16 bg-white border-y border-slate-200/80 shadow-xs'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-2 lg:grid-cols-4 gap-8 text-center'>
              {[
                {
                  num: '100%',
                  title: 'Paperless & Printable',
                  desc: 'Input digital & cetak laporan sah kapan saja',
                  color: 'text-emerald-600',
                },
                {
                  num: '7+ Modul',
                  title: 'Terintegrasi Sempurna',
                  desc: 'Jadwal, Piket, Absensi, Nilai, Tabungan, Jurnal & Cetak',
                  color: 'text-teal-600',
                },
                {
                  num: 'PDF & Excel',
                  title: 'Ekspor Laporan 1-Klik',
                  desc: 'Kemudahan ekspor laporan siap cetak',
                  color: 'text-indigo-600',
                },
                {
                  num: 'Safe & Secure',
                  title: 'Perlindungan Data',
                  desc: 'Data tersimpan aman di server & cloud storage',
                  color: 'text-emerald-600',
                },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -4 }}
                  className='space-y-2 p-4 rounded-2xl transition-all'
                >
                  <div
                    className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${stat.color}`}
                  >
                    {stat.num}
                  </div>
                  <div className='text-sm font-bold text-slate-900'>
                    {stat.title}
                  </div>
                  <div className='text-xs text-slate-500 font-medium'>
                    {stat.desc}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ==================== INTERACTIVE MODULE SHOWCASE ==================== */}
        <section
          id='modul'
          className='py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className='text-center space-y-4 max-w-3xl mx-auto mb-16'
          >
            <h2 className='text-xs uppercase font-bold tracking-widest text-emerald-700'>
              Modul Utama Wali Kelas
            </h2>
            <p className='text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight'>
              Simulasi Antarmuka & Fitur
            </p>
            <p className='text-base text-slate-600 font-medium'>
              Pilih modul di bawah ini untuk melihat simulasi antarmuka dan
              kemudahan penggunaannya.
            </p>
          </motion.div>

          {/* Module Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className='grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 w-full max-w-full px-1'
          >
            {[
              { id: 'absensi', label: 'Absensi Kelas', icon: CalendarCheck2 },
              { id: 'nilai', label: 'Nilai Akademik', icon: GraduationCap },
              { id: 'jurnal', label: 'Jurnal KBM', icon: BookMarked },
              { id: 'multikelas', label: 'Multi-Kelas Guru', icon: School },
              { id: 'jadwal', label: 'Jadwal & Alokasi', icon: Calendar },
              { id: 'tabungan', label: 'Tabungan Siswa', icon: Wallet },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Icon className='h-4 w-4 shrink-0' />
                  <span className='truncate'>{tab.label}</span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Active Tab Content Card with AnimatePresence */}
          <AnimatePresence mode='wait'>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className='bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-xs'
            >
              {activeTab === 'absensi' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200'>
                      <CalendarCheck2 className='h-3.5 w-3.5' />
                      <span>Presensi & Absensi Harian</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>
                      Pencatatan Presensi Cepat & Cetak Rekapitulasi
                    </h3>
                    <p className='text-slate-600 text-sm leading-relaxed font-medium'>
                      Input kehadiran siswa harian (Hadir, Sakit, Izin, Alpa)
                      secara praktis. Sistem akan mengalkulasi persentase
                      kehadiran bulanan dan mendukung Pratinjau Cetak / Ekspor
                      PDF & Excel.
                    </p>
                    <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Input presensi cepat per kelas atau mata pelajaran
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Ringkasan status Hadir, Izin, Sakit, Alpa per siswa
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Pratinjau cetak rekapitulasi & ekspor Excel / PDF
                        </span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-200 pb-3'>
                      <span className='text-xs font-extrabold text-slate-900'>
                        Presensi Hari Ini - Kelas 5A
                      </span>
                      <span className='text-[11px] text-emerald-700 font-bold'>
                        24 Juli 2026
                      </span>
                    </div>
                    <div className='space-y-2.5'>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs'>
                        <span className='font-bold text-slate-800'>
                          Ahmad Fauzi (NIS: 1021)
                        </span>
                        <span className='px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200'>
                          HADIR
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs'>
                        <span className='font-bold text-slate-800'>
                          Budi Santoso (NIS: 1022)
                        </span>
                        <span className='px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold border border-amber-200'>
                          IZIN
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs'>
                        <span className='font-bold text-slate-800'>
                          Citra Kirana (NIS: 1023)
                        </span>
                        <span className='px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold border border-emerald-200'>
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
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200'>
                      <GraduationCap className='h-3.5 w-3.5' />
                      <span>Rekap & Penilaian Akademik</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>
                      Kelola Nilai Tugas, UTS, & UAS Otomatis
                    </h3>
                    <p className='text-slate-600 text-sm leading-relaxed font-medium'>
                      Input nilai per mata pelajaran, set nilai KKM standar, dan
                      biarkan Smart Class mengalkulasi rata-rata serta
                      menyediakan lembar pratinjau cetak laporan nilai lengkap
                      TTD.
                    </p>
                    <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>Kalkulasi rata-rata akhir nilai otomatis</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>
                          Indikator peringatan batas KKM mata pelajaran
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>
                          Pratinjau Cetak & Export Laporan Nilai Ke Excel/PDF
                        </span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-200 pb-3'>
                      <span className='text-xs font-extrabold text-slate-900'>
                        Nilai Matematika - KKM: 75
                      </span>
                      <span className='text-[11px] text-teal-700 font-bold'>
                        Tugas 1
                      </span>
                    </div>
                    <div className='space-y-2.5'>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs'>
                        <span className='font-bold text-slate-800'>
                          Ahmad Fauzi
                        </span>
                        <span className='font-mono font-extrabold text-emerald-700 text-sm'>
                          92
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs'>
                        <span className='font-bold text-slate-800'>
                          Dewi Sartika
                        </span>
                        <span className='font-mono font-extrabold text-rose-600 text-sm'>
                          68 (Perlu Remedial)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'jurnal' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200'>
                      <BookMarked className='h-3.5 w-3.5' />
                      <span>Jurnal Harian Wali Kelas</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>
                      Agenda KBM Harian Terintegrasi Presensi
                    </h3>
                    <p className='text-slate-600 text-sm leading-relaxed font-medium'>
                      Dokumentasikan agenda kegiatan mengajar harian, materi
                      pembelajaran, serta absensi per siswa secara langsung
                      dalam satu formulir jurnal.
                    </p>
                    <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Input jam pelajaran, mata pelajaran, & topik KBM
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>Input presensi per siswa langsung di jurnal</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>Arsip agenda harian wali kelas terorganisir</span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-200 pb-3'>
                      <span className='text-xs font-extrabold text-slate-900'>
                        Jurnal KBM - Jam 1-2
                      </span>
                      <span className='text-[11px] text-emerald-700 font-bold'>
                        Bahasa Indonesia
                      </span>
                    </div>
                    <div className='p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2 shadow-xs'>
                      <div className='font-bold text-slate-900'>
                        Materi: Membaca Puisi & Struktur Bait
                      </div>
                      <div className='text-[11px] text-slate-600 font-medium'>
                        Catatan: Siswa antusias mengikuti latihan membaca depan
                        kelas.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tabungan' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-bold border border-cyan-200'>
                      <Wallet className='h-3.5 w-3.5' />
                      <span>Buku Tabungan Digital</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>
                      Pencatatan Kas & Tabungan Siswa Transparan
                    </h3>
                    <p className='text-slate-600 text-sm leading-relaxed font-medium'>
                      Pencatatan transaksi setoran dan penarikan tabungan siswa
                      secara akurat. Bebas kesalahan hitung manual dengan
                      pencatatan saldo real-time.
                    </p>
                    <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>
                          Catat setoran & penarikan kas tabungan kelas
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>Histori mutasi saldo lengkap per siswa</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>Laporan keuangan kelas yang transparan</span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-200 pb-3'>
                      <span className='text-xs font-extrabold text-slate-900'>
                        Saldo Tabungan Kelas
                      </span>
                      <span className='text-xs font-extrabold text-teal-700'>
                        Rp 4.850.000
                      </span>
                    </div>
                    <div className='space-y-2.5'>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs'>
                        <div>
                          <div className='font-bold text-slate-800'>
                            Setoran - Ahmad Fauzi
                          </div>
                          <div className='text-[10px] text-slate-500 font-medium'>
                            24 Jul 2026
                          </div>
                        </div>
                        <span className='font-mono font-extrabold text-emerald-700'>
                          + Rp 50.000
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-xs'>
                        <div>
                          <div className='font-bold text-slate-800'>
                            Penarikan - Budi Santoso
                          </div>
                          <div className='text-[10px] text-slate-500 font-medium'>
                            23 Jul 2026
                          </div>
                        </div>
                        <span className='font-mono font-extrabold text-rose-600'>
                          - Rp 20.000
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'jadwal' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200'>
                      <Calendar className='h-3.5 w-3.5' />
                      <span>Jadwal & Alokasi Pelajaran AI</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>
                      Plotting Jam Mengajar & AI Generator Schedule
                    </h3>
                    <p className='text-slate-600 text-sm leading-relaxed font-medium'>
                      Atur alokasi jam mingguan per mata pelajaran, gunakan
                      generator AI untuk memplot jadwal otomatis tanpa bentrok,
                      dan cetak jadwal dinding kelas siap tempel.
                    </p>
                    <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>Generator Jadwal Pelajaran AI Otomatis</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Tracker alokasi baseline jam mengajar mingguan
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Toggle jam istirahat interaktif & cetak poster dinding
                        </span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-200 pb-3'>
                      <span className='text-xs font-extrabold text-slate-900'>
                        Preview Plotting Jadwal Mingguan
                      </span>
                      <span className='text-[11px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full'>
                        AI Auto-Plot
                      </span>
                    </div>
                    <div className='space-y-2 text-xs'>
                      <div className='flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs'>
                        <span className='font-bold text-slate-800'>
                          Jam 1-2 (07.00 - 08.20)
                        </span>
                        <span className='text-emerald-700 font-extrabold'>
                          Matematika
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs font-bold'>
                        <span>Jam 3 (08.20 - 08.40)</span>
                        <span>☕ Istirahat Pertama</span>
                      </div>
                      <div className='flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs'>
                        <span className='font-bold text-slate-800'>
                          Jam 4-5 (08.40 - 10.00)
                        </span>
                        <span className='text-teal-700 font-extrabold'>
                          IPA & Eksperimen
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'multikelas' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200'>
                      <School className='h-3.5 w-3.5' />
                      <span>Dukungan Multi-Kelas & Active Class Switcher</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>
                      Ampu Lebih dari 1 Kelas dalam 1 Akun Terpadu
                    </h3>
                    <p className='text-slate-600 text-sm leading-relaxed font-medium'>
                      Wali kelas / Guru kini dapat mengampu dan mengelola
                      multiple kelas (seperti Kelas 5A, 5B, 6A) tanpa perlu
                      membuat akun terpisah. Berpindah kelas aktif dalam 1-klik
                      dengan isolasi data mandiri.
                    </p>
                    <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Active Class Switcher dropdown 1-klik di header topbar
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Isolasi data mandiri per-kelas (Siswa, Presensi,
                          Nilai, Tabungan & Jurnal)
                        </span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-emerald-600' />
                        <span>
                          Input tag multi-kelas cepat saat onboarding awal &
                          halaman profil
                        </span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-200 pb-3'>
                      <span className='text-xs font-extrabold text-slate-900 flex items-center gap-2'>
                        <School className='h-4 w-4 text-emerald-600' />
                        <span>Active Class Switcher</span>
                      </span>
                      <span className='text-[11px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full'>
                        Multi-Kelas Active
                      </span>
                    </div>
                    <div className='space-y-2 text-xs'>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-emerald-600 text-white font-bold shadow-xs'>
                        <div className='flex items-center gap-2'>
                          <School className='h-4 w-4 text-white' />
                          <span>Kelas 11A</span>
                        </div>
                        <span className='text-[10px] bg-white/20 px-2 py-0.5 rounded font-extrabold'>
                          ✓ KELAS AKTIF
                        </span>
                      </div>
                      <div className='flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold shadow-xs hover:bg-slate-100'>
                        <div className='flex items-center gap-2'>
                          <School className='h-4 w-4 text-slate-500' />
                          <span>Kelas 12B</span>
                        </div>
                        <span className='text-[10px] text-slate-400 font-bold'>
                          Beralih ›
                        </span>
                      </div>
                      <div className='p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold text-center'>
                        + Tambah Kelas Pengampuan Baru
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Additional Features Text Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className='mt-6 p-4 rounded-2xl bg-white border border-slate-200/80 text-xs sm:text-sm text-slate-600 font-medium flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-2xs'
          >
            <div className='flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-2.5'>
              <Sparkles className='h-4 w-4 text-emerald-600 shrink-0 mt-0.5' />
              <span>
                <strong className='text-slate-900 font-bold'>
                  Modul Lengkap Lainnya:
                </strong>{' '}
                Manajemen Piket Kebersihan, Database Profil Siswa, Pratinjau
                Cetak Rekapitulasi Sah, serta Ekspor PDF & Excel.
              </span>
            </div>
            <div className='flex items-center gap-1.5 shrink-0 font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200'>
              <span>7+ Modul Terintegrasi</span>
            </div>
          </motion.div>
        </section>

        {/* ==================== KEY BENEFITS SECTION ==================== */}
        <section
          id='manfaat'
          className='py-24 bg-white border-y border-slate-200/80 relative shadow-xs'
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5 }}
              className='text-center space-y-4 max-w-3xl mx-auto mb-16'
            >
              <h2 className='text-xs uppercase font-bold tracking-widest text-emerald-700'>
                Mengapa Memilih Smart Class
              </h2>
              <p className='text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight'>
                Memudahkan Tugas Guru & Wali Kelas
              </p>
            </motion.div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {[
                {
                  icon: Printer,
                  title: 'Cetak Laporan & Ekspor',
                  desc: 'Cetak rekapitulasi presensi, nilai, maupun jurnal harian dengan format siap pakai. Ekspor data ke PDF & Excel untuk mendukung akreditasi sekolah.',
                  color: 'bg-emerald-100 text-emerald-700',
                  hoverBorder: 'hover:border-emerald-500/50',
                },
                {
                  icon: Zap,
                  title: 'Hemat Waktu Administrasi',
                  desc: 'Tidak ada lagi kalkulasi manual nilai atau rekap absensi berjam-jam. Semuanya terakumulasi secara otomatis real-time.',
                  color: 'bg-teal-100 text-teal-700',
                  hoverBorder: 'hover:border-teal-500/50',
                },
                {
                  icon: Smartphone,
                  title: 'Responsif & Lintas Perangkat',
                  desc: 'Akses mudah dari layar HP di kelas, Tablet, maupun Laptop di rumah dengan tampilan yang nyaman & optimal.',
                  color: 'bg-emerald-100 text-emerald-700',
                  hoverBorder: 'hover:border-emerald-500/50',
                },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                    whileHover={{
                      y: -8,
                      transition: { duration: 0.25, ease: 'easeOut' },
                    }}
                    className={`p-8 rounded-3xl bg-slate-50 border border-slate-200 ${card.hoverBorder} transition-colors space-y-4 group h-full shadow-xs place-items-center`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className='h-6 w-6' />
                    </div>
                    <h3 className='text-xl font-extrabold text-slate-900 mb-2'>
                      {card.title}
                    </h3>
                    <p className='text-sm text-slate-600 leading-relaxed font-medium text-center'>
                      {card.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== FAQ SECTION ==================== */}
        <section
          id='faq'
          className='py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto'
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className='text-center space-y-4 mb-16'
          >
            <h2 className='text-xs uppercase font-bold tracking-widest text-emerald-700'>
              FAQ
            </h2>
            <p className='text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight'>
              Pertanyaan yang Sering Diajukan
            </p>
          </motion.div>

          <div className='space-y-4'>
            {[
              {
                q: 'Bagaimana cara mendaftar dan mulai menggunakan aplikasi?',
                a: 'Cukup klik tombol "Daftar Sekarang", isi nama lengkap & gelar, username, email, dan kata sandi. Akun Anda akan langsung aktif dan siap digunakan.',
              },
              {
                q: 'Apakah Smart Class bisa diakses langsung melalui Smartphone/HP?',
                a: 'Ya, Smart Class dirancang dengan antarmuka yang fully responsive. Anda dapat menginput presensi, nilai, maupun jurnal harian dengan nyaman dari layar Smartphone, Tablet, maupun PC.',
              },
              {
                q: 'Bagaimana keamanan akun dan data sekolah di Smart Class?',
                a: 'Smart Class dilindungi oleh teknologi keamanan tingkat tinggi, termasuk enkripsi data, proteksi kata sandi, dan backup rutin. Data sekolah Anda aman dan hanya dapat diakses oleh akun yang terdaftar.',
              },
              {
                q: 'Apakah saya bisa menyesuaikan modul apa saja yang tampil di sidebar?',
                a: 'Sangat bisa! Smart Class dilengkapi fitur Custom Menu Preferences. Anda dapat memilih modul mana saja yang aktif (misalnya hanya Absensi & Jurnal) sesuai kebutuhan kelas Anda.',
              },
              {
                q: 'Apakah identitas Wali Kelas dan Kepala Sekolah bisa disesuaikan untuk dokumen cetak?',
                a: 'Bisa. Di menu Pengaturan Profil & Wali Kelas, Anda dapat mengisi nama resmi serta nomor NIP atau NUPTK Wali Kelas dan Kepala Sekolah yang akan otomatis tersemat pada lembar cetak laporan.',
              },
              {
                q: 'Apakah seorang guru / wali kelas dapat mengampu lebih dari 1 kelas?',
                a: 'Sangat bisa! Fitur Multi-Kelas memungkinkan Anda mengampu beberapa kelas sekaligus (seperti Kelas 5A, 5B, 6A, dll.) dalam 1 akun terpadu. Pengalihan kelas dapat dilakukan dalam 1-klik via Active Class Switcher di header topbar dengan isolasi data mandiri.',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className='bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs'
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className='w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-base hover:text-emerald-700 transition-colors cursor-pointer'
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-300 flex-shrink-0 ${
                      openFaq === idx ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className='overflow-hidden'
                    >
                      <div className='px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 font-medium'>
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ==================== FINAL CTA BANNER ==================== */}
        <section
          id='cta'
          className='py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto'
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className='relative rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 border border-emerald-500/30 p-8 sm:p-14 text-center overflow-hidden shadow-xl text-white'
          >
            <div className='relative z-10 space-y-6 max-w-3xl mx-auto'>
              <h2 className='text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight'>
                Siap Tingkatkan Produktivitas ?
              </h2>
              <p className='text-base sm:text-lg text-emerald-50 font-medium'>
                Bergabunglah dengan wali kelas modern lainnya dalam mengelola
                administrasi kelas lebih cepat, akurat, dan paperless. Hanya
                dengan beberapa klik, semua kebutuhan kelas ada di genggaman
                Anda.
              </p>
              <div className='pt-4 flex flex-col sm:flex-row items-center justify-center gap-4'>
                {currentUser ? (
                  <Link href={dashboardHref} className='w-full sm:w-auto'>
                    <motion.div
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <Button className='w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-base px-8 py-6 rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer'>
                        <LayoutDashboard className='h-5 w-5' />
                        <span>Dashboard</span>
                      </Button>
                    </motion.div>
                  </Link>
                ) : (
                  <>
                    <Link href='/sign-up' className='w-full sm:w-auto'>
                      <motion.div
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                      >
                        <Button className='w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-base px-8 py-6 rounded-2xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer'>
                          <span>Daftar Sekarang</span>
                        </Button>
                      </motion.div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ==================== FOOTER ==================== */}
      <footer className='border-t border-slate-200 bg-white py-8 sm:py-10 relative z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-sm text-slate-600 text-center md:text-left'>
          {/* Left: Brand Logo & Copyright */}
          <div className='flex items-center gap-3'>
            <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs shrink-0'>
              <BookOpen className='h-4 w-4' />
            </div>
            <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2'>
              <span className='font-extrabold text-slate-900 tracking-tight text-base whitespace-nowrap'>
                Smart Class
              </span>
              <span className='hidden sm:inline text-slate-300'>•</span>
              <span className='text-xs text-slate-500 font-medium whitespace-nowrap'>
                © 2026. All rights reserved.
              </span>
            </div>
          </div>

          {/* Center: Navigation Menu Links */}
          <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600 font-semibold md:mx-auto'>
            <a
              href='#fitur'
              onClick={(e) => scrollToSection(e, 'fitur')}
              className='hover:text-emerald-700 transition-colors'
            >
              Fitur
            </a>
            <a
              href='#modul'
              onClick={(e) => scrollToSection(e, 'modul')}
              className='hover:text-emerald-700 transition-colors'
            >
              Modul
            </a>
            <a
              href='#manfaat'
              onClick={(e) => scrollToSection(e, 'manfaat')}
              className='hover:text-emerald-700 transition-colors'
            >
              Manfaat
            </a>
            <a
              href='#faq'
              onClick={(e) => scrollToSection(e, 'faq')}
              className='hover:text-emerald-700 transition-colors'
            >
              FAQ
            </a>
            <Link
              href={currentUser ? dashboardHref : '/sign-in'}
              className='hover:text-emerald-700 transition-colors'
            >
              {currentUser ? 'Dashboard' : 'Masuk'}
            </Link>
          </div>

          {/* Right: Credit Link */}
          <div className='text-xs text-slate-500 font-medium whitespace-nowrap'>
            Developed by{' '}
            <a
              href='https://cetha-tech.vercel.app/'
              target='_blank'
              rel='noopener noreferrer'
              className='font-bold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-300 underline-offset-2 transition-colors'
            >
              Cetha Technologies
            </a>
          </div>
        </div>
      </footer>

      {/* ==================== SCROLL TO TOP BUTTON ==================== */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            aria-label='Scroll to top'
            className='fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 p-3 sm:p-3.5 rounded-2xl bg-emerald-600 text-white shadow-xl hover:bg-emerald-700 transition-all duration-300 cursor-pointer'
          >
            <ArrowUp className='h-5 w-5' />
          </motion.button>
        )}
      </AnimatePresence>

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
