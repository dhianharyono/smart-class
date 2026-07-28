'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  CalendarCheck2,
  GraduationCap,
  Wallet,
  BookMarked,
  CheckCircle2,
  ArrowUp,
  ChevronDown,
  Menu,
  X,
  Zap,
  Smartphone,
  Tablet,
  Monitor,
  Settings,
  Check,
  LayoutDashboard,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUserSession, logoutTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import ConfirmDialog from '@/components/ConfirmDialog';

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
                <Link href={dashboardHref}>
                  <Button className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all duration-300 flex items-center gap-2 cursor-pointer'>
                    <LayoutDashboard className='h-4 w-4' />
                    <span>Dashboard</span>
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
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button className='w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl py-3 flex items-center gap-2 cursor-pointer shadow-xs'>
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
            Satu sistem terpadu untuk pencatatan presensi siswa, penilaian KKM,
            buku tabungan digital, agenda jurnal KBM harian, dan laporan kelas
            otomatis.
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
                <Link href={dashboardHref} className='w-full sm:w-auto'>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button className='w-full sm:w-auto h-12 sm:h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-7 sm:px-9 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer'>
                      <LayoutDashboard className='h-5 w-5' />
                      <span>Buka Dashboard Saya</span>
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

          {/* Feature Micro-Badges & Multi-Device Branding */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className='mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs sm:text-sm text-slate-600 font-semibold px-2'
          >
            <div className='flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs'>
              <Smartphone className='h-4 w-4 text-emerald-600 shrink-0' />
              <span>HP</span>
            </div>
            <div className='flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs'>
              <Tablet className='h-4 w-4 text-teal-600 shrink-0' />
              <span>Tablet</span>
            </div>
            <div className='flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs'>
              <Monitor className='h-4 w-4 text-indigo-600 shrink-0' />
              <span>Laptop & PC</span>
            </div>
            <div className='flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-xs'>
              <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0' />
              <span>100% Paperless</span>
            </div>
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
                  Smart Class — Dashboard Multi-Perangkat
                </span>
              </div>
              <div className='flex items-center gap-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shrink-0'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse' />
                <span>Responsive Sync</span>
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
                  title: 'Paperless System',
                  desc: 'Bebas buku fisik & kertas rekap manual',
                  color: 'text-emerald-600',
                },
                {
                  num: '5+ Modul',
                  title: 'Terintegrasi Sempurna',
                  desc: 'Absensi, Nilai, Tabungan, Jurnal & Siswa',
                  color: 'text-teal-600',
                },
                {
                  num: '80% Efisien',
                  title: 'Efisiensi Administrasi',
                  desc: 'Rekap bulanan/semester serba otomatis',
                  color: 'text-indigo-600',
                },
                {
                  num: 'Safe Auth',
                  title: 'Perlindungan Data',
                  desc: 'Privasi data siswa tersimpan aman',
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
              Kebutuhan Kelas Dalam Satu Genggaman
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
            className='flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar pb-3 sm:pb-0 mb-8 sm:mb-10 max-w-full px-1'
          >
            {[
              { id: 'absensi', label: 'Absensi Kelas', icon: CalendarCheck2 },
              { id: 'nilai', label: 'Nilai Akademik', icon: GraduationCap },
              { id: 'tabungan', label: 'Tabungan Siswa', icon: Wallet },
              { id: 'jurnal', label: 'Jurnal KBM', icon: BookMarked },
              { id: 'siswa', label: 'Data Siswa', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-shrink-0 whitespace-nowrap flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  <Icon className='h-4 w-4' />
                  <span>{tab.label}</span>
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
                      Pencatatan Presensi Cepat Tanpa Ribet
                    </h3>
                    <p className='text-slate-600 text-sm leading-relaxed font-medium'>
                      Input kehadiran siswa harian (Hadir, Sakit, Izin, Alpa)
                      secara praktis. Sistem akan mengalkulasi persentase
                      kehadiran bulanan dan semesteran secara otomatis.
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
                          Rekapitulasi otomatis untuk laporan wali kelas
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
                      memberikan notifikasi siswa yang perlu perhatian khusus.
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
                        <span>Export laporan nilai kelas dengan rapi</span>
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

              {activeTab === 'siswa' && (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-center'>
                  <div className='space-y-6'>
                    <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-200'>
                      <Users className='h-3.5 w-3.5' />
                      <span>Database Siswa Terpusat</span>
                    </div>
                    <h3 className='text-2xl sm:text-3xl font-extrabold text-slate-900'>
                      Kelola Profil & Informasi Siswa Terstruktur
                    </h3>
                    <p className='text-slate-600 text-sm leading-relaxed font-medium'>
                      Database profil siswa lengkap mencakup NIS/NISN, jenis
                      kelamin, alamat, data kontak orang tua/wali, serta status
                      keaktifan siswa.
                    </p>
                    <ul className='space-y-3 text-sm text-slate-700 font-medium'>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>Pencarian & filter data siswa cepat</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>Kontak orang tua/wali tercatat rapi</span>
                      </li>
                      <li className='flex items-center gap-3'>
                        <Check className='h-4 w-4 text-teal-600' />
                        <span>Ekspor daftar siswa ke Excel/PDF</span>
                      </li>
                    </ul>
                  </div>
                  {/* Visual Card */}
                  <div className='bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs'>
                    <div className='flex items-center justify-between border-b border-slate-200 pb-3'>
                      <span className='text-xs font-extrabold text-slate-900'>
                        Profil Siswa - Class 5A
                      </span>
                      <span className='text-[11px] text-teal-700 font-bold uppercase'>
                        Active
                      </span>
                    </div>
                    <div className='p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5 shadow-xs'>
                      <div className='font-extrabold text-slate-900'>
                        Ahmad Fauzi Rahmat
                      </div>
                      <div className='text-slate-600 font-medium'>
                        NISN: 0081234567 • Laki-laki
                      </div>
                      <div className='text-slate-500 text-[11px] font-medium'>
                        Wali: Bpk. Rahmat (0812-3456-7890)
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
                Memudahkan Tugas Wali Kelas
              </p>
            </motion.div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {[
                {
                  icon: Zap,
                  title: 'Hemat Waktu Administrasi',
                  desc: 'Tidak ada lagi kalkulasi manual nilai atau rekap absensi berjam-jam. Semuanya terakumulasi secara otomatis real-time.',
                  color: 'bg-emerald-100 text-emerald-700',
                  hoverBorder: 'hover:border-emerald-500/50',
                },
                {
                  icon: Smartphone,
                  title: 'Responsif Di Mana Saja',
                  desc: 'Akses langsung dari HP di dalam ruang kelas, dari tablet, atau laptop di rumah. Tampilan menyesuaikan secara optimal.',
                  color: 'bg-teal-100 text-teal-700',
                  hoverBorder: 'hover:border-teal-500/50',
                },
                {
                  icon: Settings,
                  title: 'Fleksibel & Kustom Menu',
                  desc: 'Bebas mengaktifkan atau menyembunyikan modul sidebar sesuai kebutuhan spesifik wali kelas dan kebijakan sekolah.',
                  color: 'bg-indigo-100 text-indigo-700',
                  hoverBorder: 'hover:border-indigo-500/50',
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
                    className={`p-8 rounded-3xl bg-slate-50 border border-slate-200 ${card.hoverBorder} transition-colors space-y-4 group h-full shadow-xs`}
                  >
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color} group-hover:scale-110 transition-transform`}
                    >
                      <Icon className='h-6 w-6' />
                    </div>
                    <h3 className='text-xl font-extrabold text-slate-900'>
                      {card.title}
                    </h3>
                    <p className='text-sm text-slate-600 leading-relaxed font-medium'>
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
                q: 'Apakah Smart Class bisa diakses langsung melalui Smartphone/HP?',
                a: 'Ya, Smart Class dirancang dengan antarmuka yang fully responsive. Anda dapat menginput presensi, nilai, maupun jurnal harian dengan nyaman dari layar Smartphone, Tablet, maupun PC.',
              },
              {
                q: 'Apakah saya bisa menyesuaikan modul apa saja yang tampil di sidebar?',
                a: 'Sangat bisa! Smart Class dilengkapi fitur Custom Menu Preferences. Anda dapat memilih modul mana saja yang aktif (misalnya hanya Absensi & Jurnal) sesuai kebutuhan kelas Anda.',
              },
              {
                q: 'Bagaimana cara mendaftar dan mulai menggunakan aplikasi?',
                a: 'Cukup klik tombol "Daftar Sekarang", isi nama lengkap, email, nama sekolah, dan kata sandi. Akun Anda akan langsung aktif dan siap digunakan.',
              },
              {
                q: 'Apakah data absensi dan nilai siswa saya aman?',
                a: 'Semua data disimpan dalam basis data terenkripsi dengan sesi autentikasi terproteksi. Hanya Anda sebagai wali kelas yang berhak mengelola data kelas Anda.',
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
                Siap Tingkatkan Produktivitas <br /> Anda Hari Ini?
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
                        <span>Buka Dashboard</span>
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
      <footer className='border-t border-slate-200 bg-white py-8 sm:py-12 relative z-10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 text-sm text-slate-600 text-center md:text-left'>
          <div className='flex flex-col sm:flex-row items-center gap-2 sm:gap-3'>
            <div className='flex items-center gap-2.5'>
              <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xs shrink-0'>
                <BookOpen className='h-4 w-4' />
              </div>
              <span className='font-extrabold text-slate-900 tracking-tight text-base whitespace-nowrap'>
                Smart Class
              </span>
            </div>
            <span className='hidden sm:inline text-slate-300'>•</span>
            <span className='text-xs text-slate-500 font-medium whitespace-nowrap'>
              © 2026 Smart Class. All rights reserved.
            </span>
          </div>

          <div className='flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-600 font-semibold'>
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
