'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginTeacher, logoutTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import { Mail, Lock, BookOpen, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoadingScreen from '@/components/LoadingScreen';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [redirectVariant, setRedirectVariant] = useState<'teacher' | 'admin'>('teacher');

  useEffect(() => {
    // Clear stale session cookie to prevent redirect loops
    logoutTeacher();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email atau username dan password wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginTeacher({ email, password });
      if (res.success) {
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
        toast.error(res.error || 'Email/username atau password salah.');
        setLoading(false);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  };

  if (isRedirecting) {
    return <LoadingScreen variant={redirectVariant} />;
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
            Masuk ke Command Center Wali Kelas Anda
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 shadow-2xl rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                Email / Username Wali Kelas
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
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-10 py-3 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk Aplikasi</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Registration link */}
          <div className="mt-6 text-center text-sm border-t border-zinc-800/60 pt-6">
            <span className="text-zinc-500">Belum memiliki akun? </span>
            <Link href="/sign-up" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors duration-150">
              Daftar Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
