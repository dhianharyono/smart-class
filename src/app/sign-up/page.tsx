'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerTeacher } from '@/actions/authActions';
import { getSchools } from '@/actions/adminActions';
import { toast } from 'sonner';
import { Mail, Lock, User, School, GraduationCap, BookOpen, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingScreen from '@/components/LoadingScreen';
import ReCaptcha from '@/components/ReCaptcha';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectVariant, setRedirectVariant] = useState<'teacher' | 'admin'>('teacher');
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');
  const [resetCaptcha, setResetCaptcha] = useState<number>(0);

  useEffect(() => {
    async function loadSchools() {
      try {
        const schoolList = await getSchools();
        setSchools(schoolList);
        if (schoolList.length > 0) {
          setSchoolName(schoolList[0].name);
        } else {
          setSchoolName('__NEW_SCHOOL__');
        }
      } catch (err) {
        console.error('Gagal memuat daftar sekolah:', err);
        setSchoolName('__NEW_SCHOOL__');
      } finally {
        setLoadingSchools(false);
      }
    }
    loadSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSchoolName = schoolName === '__NEW_SCHOOL__' ? customSchoolName.trim() : schoolName;

    if (!name || !email || !password || !finalSchoolName) {
      toast.error('Nama, email, password, dan sekolah wajib diisi.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password minimal harus 6 karakter.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerTeacher({
        name,
        email,
        password,
        schoolName: finalSchoolName || undefined,
        className: className || undefined,
        recaptchaToken,
      });

      if (res.success) {
        toast.success('Pendaftaran berhasil! Selamat datang.');
        setRedirectVariant(res.isAdmin ? 'admin' : 'teacher');
        setIsRedirecting(true);
        if (res.isAdmin) {
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
    return <LoadingScreen variant={redirectVariant} message="Mendaftar & mempersiapkan akun..." />;
  }


  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-16 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Back to Landing Page Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all text-xs font-semibold backdrop-blur-md shadow-lg"
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-400" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10 animate-fade-in">
        {/* Brand Logo & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-xl shadow-emerald-500/20 mb-4 animate-bounce-slow">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Smart Class
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Daftarkan Akun Wali Kelas Baru
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 shadow-2xl rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                Nama Lengkap
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <User className="h-4.5 w-4.5" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Nama Lengkap & Gelar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                Alamat Email / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  placeholder="Email atau Username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                />
              </div>
            </div>

            {/* School Name */}
            <div className="space-y-1.5">
              <label htmlFor="schoolName" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                Nama Sekolah
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <School className="h-4.5 w-4.5" />
                </div>
                <select
                  id="schoolName"
                  name="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  disabled={loading || loadingSchools}
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50 appearance-none cursor-pointer"
                >
                  {loadingSchools ? (
                    <option value="" className="bg-zinc-950 text-zinc-400">Memuat...</option>
                  ) : (
                    <>
                      <option value="" disabled className="bg-zinc-950 text-zinc-400">Pilih Sekolah</option>
                      {schools.map((school) => (
                        <option key={school._id} value={school.name} className="bg-zinc-950 text-zinc-100">
                          {school.name}
                        </option>
                      ))}
                      <option value="__NEW_SCHOOL__" className="bg-zinc-950 text-emerald-400 font-semibold">
                        + Tambah Sekolah Baru...
                      </option>
                    </>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-zinc-500">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Custom School Name Input */}
            {schoolName === '__NEW_SCHOOL__' && (
              <div className="space-y-1.5 transition-all duration-200">
                <label htmlFor="customSchoolName" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                  Nama Sekolah Baru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <School className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="customSchoolName"
                    name="customSchoolName"
                    type="text"
                    required
                    placeholder="Nama Sekolah Baru (contoh: SDN 1 Jakarta)"
                    value={customSchoolName}
                    onChange={(e) => setCustomSchoolName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="className" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                Kelas Diajar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <input
                  id="className"
                  name="className"
                  type="text"
                  placeholder="Kelas 5A"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Google reCAPTCHA Protection */}
            <ReCaptcha
              onVerify={(token) => setRecaptchaToken(token)}
              onExpire={() => setRecaptchaToken('')}
              resetTrigger={resetCaptcha}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading || (!!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !recaptchaToken)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <span>Daftar Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center text-sm border-t border-zinc-800/60 pt-6">
            <span className="text-zinc-500">Sudah memiliki akun? </span>
            <Link href="/sign-in" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-150">
              Masuk Disini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
