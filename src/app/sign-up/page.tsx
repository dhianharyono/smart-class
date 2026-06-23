'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerTeacher } from '@/actions/authActions';
import { toast } from 'sonner';
import { Mail, Lock, User, School, GraduationCap, BookOpen, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Nama, email, dan password wajib diisi.');
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
        schoolName: schoolName || undefined,
        className: className || undefined,
      });

      if (res.success) {
        toast.success('Pendaftaran berhasil! Selamat datang.');
        router.push('/');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mendaftar.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
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
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nama@sekolah.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                />
              </div>
            </div>

            {/* School Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="schoolName" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                  Nama Sekolah
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <School className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="schoolName"
                    name="schoolName"
                    type="text"
                    placeholder="SDN 01 Jaya"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

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
                  type="password"
                  required
                  placeholder="Min. 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
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
