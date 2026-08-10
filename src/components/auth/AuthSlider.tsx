'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  loginTeacher,
  logoutTeacher,
  registerTeacher,
} from '@/actions/authActions';
import { getSchools } from '@/actions/adminActions';
import { toast } from 'sonner';
import {
  Mail,
  Lock,
  User,
  School,
  GraduationCap,
  BookOpen,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  AtSign,
  Check,
  X,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingScreen from '@/components/LoadingScreen';
import ReCaptcha from '@/components/ReCaptcha';

interface AuthSliderProps {
  initialMode?: 'signin' | 'signup';
}

export default function AuthSlider({
  initialMode = 'signin',
}: AuthSliderProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);

  // Common Auth States
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectVariant, setRedirectVariant] = useState<'teacher' | 'admin'>(
    'teacher',
  );
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');
  const [resetCaptcha, setResetCaptcha] = useState<number>(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign In States
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('login_failed_attempts');
      if (saved) return parseInt(saved, 10) || 0;
    }
    return 0;
  });
  const CAPTCHA_THRESHOLD = 2;
  const isSignInCaptchaRequired = failedAttempts >= CAPTCHA_THRESHOLD;

  // Sign Up States
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Sign Up Password Validation logic
  const hasMinLength = signUpPassword.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(signUpPassword);
  const hasNumber = /\d/.test(signUpPassword);
  const passwordCriteriaMetCount = [hasMinLength, hasLetter, hasNumber].filter(Boolean).length;
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  const isConfirmNotEmpty = signUpConfirmPassword.length > 0;
  const isPasswordMatching = isConfirmNotEmpty && signUpPassword === signUpConfirmPassword;
  const isPasswordMismatch = isConfirmNotEmpty && signUpPassword !== signUpConfirmPassword;

  // Logout stale sessions on mount
  useEffect(() => {
    logoutTeacher();
  }, []);

  // Toggle Mode & sync URL without hard page reload
  const toggleMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        newMode === 'signin' ? '/sign-in' : '/sign-up',
      );
    }
  };

  // Sign In Handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast.error('Username/email dan password wajib diisi.');
      return;
    }

    if (
      isSignInCaptchaRequired &&
      !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
      !recaptchaToken
    ) {
      toast.error('Harap selesaikan verifikasi reCAPTCHA terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginTeacher({
        email: signInEmail,
        password: signInPassword,
        recaptchaToken: isSignInCaptchaRequired ? recaptchaToken : undefined,
      });

      if (res.success) {
        sessionStorage.removeItem('login_failed_attempts');
        toast.success('Selamat datang kembali!');
        setRedirectVariant(res.isAdmin ? 'admin' : 'teacher');
        setIsRedirecting(true);
        if (res.isAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        toast.error(res.error || 'Username/email atau password salah.');
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        sessionStorage.setItem(
          'login_failed_attempts',
          nextAttempts.toString(),
        );
        setResetCaptcha((prev) => prev + 1);
        setRecaptchaToken('');
        setLoading(false);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      sessionStorage.setItem(
        'login_failed_attempts',
        nextAttempts.toString(),
      );
      setResetCaptcha((prev) => prev + 1);
      setRecaptchaToken('');
      setLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signUpName || !signUpUsername || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
      toast.error('Nama, username, email, password, dan konfirmasi password wajib diisi.');
      return;
    }

    if (signUpUsername.length < 3) {
      toast.error('Username minimal 3 karakter.');
      return;
    }

    if (!hasMinLength) {
      toast.error('Password minimal harus 6 karakter.');
      return;
    }

    if (!hasLetter) {
      toast.error('Password harus mengandung setidaknya 1 huruf.');
      return;
    }

    if (!hasNumber) {
      toast.error('Password harus mengandung setidaknya 1 angka.');
      return;
    }

    if (signUpPassword !== signUpConfirmPassword) {
      toast.error('Password dan konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerTeacher({
        name: signUpName,
        username: signUpUsername,
        email: signUpEmail,
        password: signUpPassword,
        recaptchaToken,
      });

      if (res.success) {
        toast.success('Pendaftaran berhasil! Selamat datang.');
        const isAdmin = !!(res as any).isAdmin;
        setRedirectVariant(isAdmin ? 'admin' : 'teacher');
        setIsRedirecting(true);
        if (isAdmin) {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mendaftar.');
        setResetCaptcha((prev) => prev + 1);
        setRecaptchaToken('');
        setLoading(false);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      setResetCaptcha((prev) => prev + 1);
      setRecaptchaToken('');
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return (
      <LoadingScreen
        variant={redirectVariant}
        message={
          mode === 'signup'
            ? 'Mendaftar & mempersiapkan akun...'
            : 'Memverifikasi...'
        }
      />
    );
  }

  return (
    <div className='min-h-screen w-full bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden font-sans p-3 sm:p-6 lg:p-8'>
      {/* Background ambient glow matching site theme */}
      <div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none' />

      {/* Back to Home Button (Pill button top-left) */}
      <div className='w-full max-w-6xl flex justify-start mb-3 sm:mb-4 sm:absolute sm:top-6 sm:left-6 z-50 px-1'>
        <Link
          href='/'
          className='inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-xs text-xs font-semibold hover:shadow transition-all duration-200 backdrop-blur-md'
        >
          <ArrowLeft className='h-4 w-4 text-emerald-600' />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      {/* Main Centered Auth Card Container */}
      <div className='w-full max-w-6xl bg-slate-50 rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden relative min-h-[580px] md:min-h-[720px] flex flex-col md:flex-row z-10 animate-fade-in'>
        {/* Mobile Tab Switcher with Framer Motion Animated Pill */}
        <div className='md:hidden p-3 bg-white border-b border-slate-200/80 z-20'>
          <div className='flex relative bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/60'>
            <button
              type='button'
              onClick={() => toggleMode('signin')}
              className={`relative flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-colors duration-200 z-10 ${mode === 'signin' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {mode === 'signin' && (
                <motion.div
                  layoutId='activeMobileTab'
                  className='absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md -z-10'
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span>SIGN IN</span>
            </button>
            <button
              type='button'
              onClick={() => toggleMode('signup')}
              className={`relative flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-colors duration-200 z-10 ${mode === 'signup' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              {mode === 'signup' && (
                <motion.div
                  layoutId='activeMobileTab'
                  className='absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md -z-10'
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <span>SIGN UP</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* LEFT PANEL FORM: LOGIN / SIGN IN */}
        {/* ------------------------------------------------------------------ */}
        <div
          className={`w-full md:w-1/2 p-5 sm:p-10 lg:p-14 flex-col justify-between transition-all duration-300 ${mode === 'signin' ? 'flex' : 'hidden md:flex opacity-90'
            }`}
        >
          <div className='hidden md:block' />
          <div className='max-w-md mx-auto w-full space-y-5 sm:space-y-6 text-center sm:text-left'>
            {/* Header Icon & Title */}
            <div className='flex flex-col items-center text-center'>
              <div className='h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-2.5 sm:mb-3 shadow-lg shadow-emerald-500/20'>
                <BookOpen className='h-5 w-5 sm:h-6 sm:w-6' />
              </div>
              <h1 className='text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'>
                Selamat Datang
              </h1>
              <p className='mt-1 text-xs sm:text-sm text-slate-500 font-medium'>
                Silahkan masuk ke akun Smart Class Anda
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSignInSubmit} className='space-y-4 text-left'>
              {/* Username / Email */}
              <div className='space-y-1.5'>
                <label className='text-[11px] font-bold uppercase tracking-wider text-slate-500 block'>
                  USERNAME / EMAIL
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <User className='h-4 w-4' />
                  </div>
                  <input
                    type='text'
                    required
                    placeholder='Username atau email Anda'
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    disabled={loading}
                    className='w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm transition-all shadow-2xs'
                  />
                </div>
              </div>

              {/* Password */}
              <div className='space-y-1.5'>
                <label className='text-[11px] font-bold uppercase tracking-wider text-slate-500 block'>
                  PASSWORD
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <Lock className='h-4 w-4' />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder='Masukkan password Anda'
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    disabled={loading}
                    className='w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm transition-all shadow-2xs'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className='flex justify-end'>
                <button
                  type='button'
                  onClick={() =>
                    toast.info(
                      'Silakan hubungi administrator sekolah untuk me-reset password.',
                    )
                  }
                  className='text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline'
                >
                  Lupa Password?
                </button>
              </div>

              {/* Conditional reCAPTCHA */}
              {isSignInCaptchaRequired && (
                <ReCaptcha
                  theme='light'
                  onVerify={(token) => setRecaptchaToken(token)}
                  onExpire={() => setRecaptchaToken('')}
                  resetTrigger={resetCaptcha}
                />
              )}

              {/* Submit Button */}
              <Button
                type='submit'
                disabled={
                  loading ||
                  (isSignInCaptchaRequired &&
                    !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
                    !recaptchaToken)
                }
                className='w-full bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-xs sm:text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50 mt-2'
              >
                {loading ? (
                  <div className='flex items-center justify-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>MEMVERIFIKASI...</span>
                  </div>
                ) : (
                  <span>SIGN IN</span>
                )}
              </Button>
            </form>
          </div>

          {/* Footer Copyright */}
          <div className='text-center text-xs text-slate-400 font-medium pt-4 sm:pt-6'>
            &copy; {new Date().getFullYear()} Smart Class. All rights reserved.
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* RIGHT PANEL FORM: REGISTER / SIGN UP */}
        {/* ------------------------------------------------------------------ */}
        <div
          className={`w-full md:w-1/2 p-5 sm:p-10 lg:p-14 flex-col justify-between transition-all duration-300 ${mode === 'signup' ? 'flex' : 'hidden md:flex opacity-90'
            }`}
        >
          <div className='hidden md:block' />
          <div className='max-w-md mx-auto w-full space-y-4 sm:space-y-5 text-center sm:text-left'>
            {/* Header Icon & Title */}
            <div className='flex flex-col items-center text-center'>
              <div className='h-11 w-11 sm:h-12 sm:w-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-2.5 sm:mb-3 shadow-lg shadow-emerald-500/20'>
                <BookOpen className='h-5 w-5 sm:h-6 sm:w-6' />
              </div>
              <h1 className='text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent'>
                Buat Akun Baru
              </h1>
              <p className='mt-1 text-xs sm:text-sm text-slate-500 font-medium'>
                Bergabung dan mulai kelola data kelas Anda di Smart Class
              </p>
            </div>

            {/* Register Form */}
            <form
              onSubmit={handleSignUpSubmit}
              className='space-y-3 sm:space-y-3.5 text-left'
            >
              {/* Full Name */}
              <div className='space-y-1'>
                <label className='text-[11px] font-bold uppercase tracking-wider text-slate-500 block'>
                  NAMA LENGKAP & GELAR
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <User className='h-4 w-4' />
                  </div>
                  <input
                    type='text'
                    required
                    placeholder='Nama lengkap & gelar'
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    disabled={loading}
                    className='w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm transition-all shadow-2xs'
                  />
                </div>
              </div>

              {/* Username */}
              <div className='space-y-1'>
                <label className='text-[11px] font-bold uppercase tracking-wider text-slate-500 block'>
                  USERNAME
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <AtSign className='h-4 w-4' />
                  </div>
                  <input
                    type='text'
                    required
                    placeholder='username_anda (min. 3 karakter)'
                    value={signUpUsername}
                    onChange={(e) => setSignUpUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    disabled={loading}
                    className='w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm transition-all shadow-2xs'
                  />
                </div>
              </div>

              {/* Email */}
              <div className='space-y-1'>
                <label className='text-[11px] font-bold uppercase tracking-wider text-slate-500 block'>
                  ALAMAT EMAIL
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                    <Mail className='h-4 w-4' />
                  </div>
                  <input
                    type='email'
                    required
                    placeholder='nama@gmail.com'
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    disabled={loading}
                    className='w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-xs sm:text-sm transition-all shadow-2xs'
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div className='space-y-3 sm:space-y-3.5'>
                {/* Password Field */}
                <div className='space-y-1'>
                  <label className='text-[11px] font-bold uppercase tracking-wider text-slate-500 block'>
                    PASSWORD
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                      <Lock className='h-4 w-4' />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder='Buat password kuat (min. 6 karakter)'
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      disabled={loading}
                      className={`w-full pl-10 pr-10 py-2.5 bg-white border ${signUpPassword.length > 0 && !isPasswordValid
                          ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
                          : signUpPassword.length > 0 && isPasswordValid
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500'
                            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                        } text-slate-900 placeholder-slate-400 focus:ring-1 focus:outline-none rounded-xl text-xs sm:text-sm transition-all shadow-2xs`}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                    >
                      {showPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>

                  {/* Real-time Password Strength Indicator & Checklist */}
                  {signUpPassword.length > 0 && (
                    <div className='pt-1.5 space-y-2 text-xs'>
                      {/* Strength Bar */}
                      <div className='space-y-1'>
                        <div className='flex justify-between items-center text-[10px] font-semibold text-slate-500'>
                          <span>Kekuatan Password:</span>
                          <span
                            className={
                              passwordCriteriaMetCount === 3
                                ? 'text-emerald-600 font-bold'
                                : passwordCriteriaMetCount === 2
                                  ? 'text-amber-600 font-bold'
                                  : 'text-rose-500 font-bold'
                            }
                          >
                            {passwordCriteriaMetCount === 3
                              ? 'Kuat'
                              : passwordCriteriaMetCount === 2
                                ? 'Sedang'
                                : 'Lemah'}
                          </span>
                        </div>
                        <div className='h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex'>
                          <div
                            className={`h-full transition-all duration-300 ${passwordCriteriaMetCount === 3
                                ? 'w-full bg-emerald-500'
                                : passwordCriteriaMetCount === 2
                                  ? 'w-2/3 bg-amber-500'
                                  : 'w-1/3 bg-rose-500'
                              }`}
                          />
                        </div>
                      </div>

                      {/* Criteria Checklist */}
                      <div className='grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1 text-[11px] text-slate-600'>
                        <div className='flex items-center gap-1.5'>
                          {hasMinLength ? (
                            <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                          ) : (
                            <X className='h-3.5 w-3.5 text-slate-300 shrink-0' />
                          )}
                          <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                            Min. 6 karakter
                          </span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          {hasLetter ? (
                            <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                          ) : (
                            <X className='h-3.5 w-3.5 text-slate-300 shrink-0' />
                          )}
                          <span className={hasLetter ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                            huruf
                          </span>
                        </div>
                        <div className='flex items-center gap-1.5'>
                          {hasNumber ? (
                            <Check className='h-3.5 w-3.5 text-emerald-500 shrink-0' />
                          ) : (
                            <X className='h-3.5 w-3.5 text-slate-300 shrink-0' />
                          )}
                          <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                            angka
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className='space-y-1'>
                  <label className='text-[11px] font-bold uppercase tracking-wider text-slate-500 block'>
                    KONFIRMASI PASSWORD
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                      <Lock className='h-4 w-4' />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder='Ulangi password Anda'
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      disabled={loading}
                      className={`w-full pl-10 pr-10 py-2.5 bg-white border ${isPasswordMismatch
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                          : isPasswordMatching
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500 bg-emerald-50/20'
                            : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500'
                        } text-slate-900 placeholder-slate-400 focus:ring-1 focus:outline-none rounded-xl text-xs sm:text-sm transition-all shadow-2xs`}
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600'
                    >
                      {showConfirmPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>

                  {/* Confirm Password Status Indicator */}
                  {isPasswordMismatch && (
                    <p className='text-[11px] text-rose-500 font-medium flex items-center gap-1 mt-1'>
                      <X className='h-3.5 w-3.5 shrink-0' />
                      <span>Konfirmasi password tidak cocok dengan password.</span>
                    </p>
                  )}
                  {isPasswordMatching && (
                    <p className='text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1'>
                      <Check className='h-3.5 w-3.5 shrink-0' />
                      <span>Password cocok.</span>
                    </p>
                  )}
                </div>
              </div>

              {/* reCAPTCHA */}
              <ReCaptcha
                theme='light'
                onVerify={(token) => setRecaptchaToken(token)}
                onExpire={() => setRecaptchaToken('')}
                resetTrigger={resetCaptcha}
              />

              {/* Submit Button */}
              <Button
                type='submit'
                disabled={
                  loading ||
                  (!!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY &&
                    !recaptchaToken)
                }
                className='w-full bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3 sm:py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-xs sm:text-sm uppercase tracking-wider cursor-pointer disabled:opacity-50 mt-1'
              >
                {loading ? (
                  <div className='flex items-center justify-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>MENDAFTARKAN...</span>
                  </div>
                ) : (
                  <span>SIGN UP</span>
                )}
              </Button>
            </form>
          </div>

          {/* Footer Copyright */}
          <div className='text-center text-xs text-slate-400 font-medium pt-4 sm:pt-6'>
            &copy; {new Date().getFullYear()} Smart Class. All rights reserved.
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DESKTOP FRAMER MOTION SLIDING OVERLAY BANNER */}
        {/* ------------------------------------------------------------------ */}
        <motion.div
          className='hidden md:flex absolute top-0 bottom-0 left-0 w-1/2 z-30 p-10 lg:p-14 flex-col justify-center items-center text-center overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-800 text-white'
          initial={false}
          animate={{ x: mode === 'signin' ? '100%' : '0%' }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
        >
          {/* Decorative background curves matching site branding */}
          <div className='absolute -top-16 -left-16 w-80 h-80 rounded-full border border-white/10 pointer-events-none' />
          <div className='absolute -bottom-24 -right-24 w-96 h-96 rounded-full border border-white/15 pointer-events-none' />
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-400/20 rounded-full blur-3xl pointer-events-none' />

          {/* Content inside Overlay Banner */}
          <div className='relative z-10 max-w-sm space-y-6'>
            {/* App Badge Pill */}
            <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-bold tracking-wider uppercase text-white backdrop-blur-md shadow-xs'>
              <BookOpen className='h-4 w-4 text-emerald-200' />
              <span>SMART CLASS</span>
            </div>

            <AnimatePresence mode='wait'>
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className='space-y-4'
              >
                <h2 className='text-3xl lg:text-4xl font-black tracking-tight leading-tight'>
                  {mode === 'signin'
                    ? 'Halo, Wali Kelas!'
                    : 'Selamat Datang Kembali!'}
                </h2>
                <p className='text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed'>
                  {mode === 'signin'
                    ? 'Belum punya akun? Daftarkan diri Anda sekarang untuk mengelola data kelas & siswa secara terpadu!'
                    : 'Untuk tetap terhubung dengan sekolah dan mengelola data kelas Anda, silakan masuk ke akun Anda.'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Ghost Switcher Button */}
            <div className='pt-4'>
              <button
                type='button'
                onClick={() =>
                  toggleMode(mode === 'signin' ? 'signup' : 'signin')
                }
                className='px-10 py-3 rounded-full border-2 border-white text-white font-extrabold text-xs tracking-wider uppercase hover:bg-white hover:text-emerald-700 transition-all duration-300 shadow-lg cursor-pointer transform hover:scale-105'
              >
                {mode === 'signin' ? 'SIGN UP' : 'SIGN IN'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
