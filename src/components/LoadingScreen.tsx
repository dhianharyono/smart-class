'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { BookOpen, Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  variant?: 'teacher' | 'admin';
}

export default function LoadingScreen({ message, variant = 'teacher' }: LoadingScreenProps) {
  const defaultMessages = useMemo(() => {
    return variant === 'admin'
      ? ['Memverifikasi hak akses admin...', 'Membuka Command Center...', 'Memuat data sistem...']
      : ['Memverifikasi sesi wali kelas...', 'Menghubungkan ke kelas...', 'Mempersiapkan dasbor Anda...'];
  }, [variant]);

  const [displayMessage, setDisplayMessage] = useState(message || defaultMessages[0]);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (message) return; // if custom static message is provided, don't cycle

    const interval = setInterval(() => {
      setMsgIdx((prev) => {
        const next = (prev + 1) % defaultMessages.length;
        setDisplayMessage(defaultMessages[next]);
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [message, defaultMessages]);

  const glowColor = variant === 'admin' ? 'bg-indigo-500/5' : 'bg-emerald-500/5';
  const logoBg = variant === 'admin' ? 'from-indigo-600 to-violet-500' : 'from-emerald-600 to-teal-500';
  const textGradient = variant === 'admin' ? 'from-indigo-400 to-violet-400' : 'from-emerald-400 to-teal-400';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 transition-all duration-300">
      {/* Background radial glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${glowColor} rounded-full blur-[120px] pointer-events-none`} />

      <div className="flex flex-col items-center text-center space-y-6 relative z-10">
        {/* Brand Logo */}
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr ${logoBg} text-white shadow-2xl shadow-zinc-950/50 mb-2`}>
          <BookOpen className="h-8 w-8" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className={`text-3xl font-extrabold tracking-tight bg-gradient-to-r ${textGradient} bg-clip-text text-transparent`}>
            Smart Class
          </h2>
          <p className="text-zinc-500 text-xs tracking-wider uppercase font-semibold">
            {variant === 'admin' ? 'Admin Portal' : 'Wali Kelas'}
          </p>
        </div>

        {/* Spinner & Message */}
        <div className="flex flex-col items-center space-y-3 pt-4">
          <Loader2 className={`h-6 w-6 animate-spin ${variant === 'admin' ? 'text-indigo-400' : 'text-emerald-400'}`} />
          <p className="text-zinc-300 text-sm font-medium animate-pulse">
            {displayMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
