'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CalendarCheck2,
  BookMarked,
  FileText,
  CheckCircle2,
  Circle,
  Sparkles,
  X,
  ChevronRight,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingWidgetProps {
  stats: {
    studentCount: number;
    monthlyAttendanceRate: number;
    totalAttendanceLogs?: number;
    totalJournalEntries?: number;
  };
}

export default function OnboardingWidget({ stats }: OnboardingWidgetProps) {
  const [dismissed, setDismissed] = useState(false);
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const isDismissed = localStorage.getItem('smartclass_onboarding_dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
    const savedChecks = localStorage.getItem('smartclass_onboarding_checks');
    if (savedChecks) {
      try {
        setManualChecks(JSON.parse(savedChecks));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const toggleCheck = (stepId: string) => {
    const next = { ...manualChecks, [stepId]: !manualChecks[stepId] };
    setManualChecks(next);
    localStorage.setItem('smartclass_onboarding_checks', JSON.stringify(next));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('smartclass_onboarding_dismissed', 'true');
  };

  const steps = [
    {
      id: 'siswa',
      title: 'Lengkapi Data Siswa',
      desc: 'Tambahkan daftar siswa di kelas bimbingan Anda.',
      icon: Users,
      href: '/siswa?guided=1',
      actionText: 'Kelola Siswa',
      isCompleted: stats.studentCount > 0 || !!manualChecks['siswa'],
    },
    {
      id: 'absensi',
      title: 'Input Presensi Harian Pertama',
      desc: 'Catat presensi harian siswa hanya dalam beberapa klik.',
      icon: CalendarCheck2,
      href: '/absensi?guided=1',
      actionText: 'Isi Presensi',
      isCompleted:
        (stats.totalAttendanceLogs || 0) > 0 || !!manualChecks['absensi'],
    },
    {
      id: 'jurnal',
      title: 'Tulis Agenda Jurnal Kelas',
      desc: 'Catat resume materi & kegiatan belajar mengajar hari ini.',
      icon: BookMarked,
      href: '/jurnal?guided=1',
      actionText: 'Tulis Jurnal',
      isCompleted:
        (stats.totalJournalEntries || 0) > 0 || !!manualChecks['jurnal'],
    },
    {
      id: 'cetak',
      title: 'Lihat Pratinjau Cetak A4 PDF',
      desc: 'Lihat keajaiban rekap otomatis siap cetak format A4 resmi.',
      icon: FileText,
      href: '/absensi?guided=cetak',
      actionText: 'Pratinjau Cetak',
      isCompleted: !!manualChecks['cetak'],
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  if (dismissed) {
    return null;
  }

  return (
    <div className='bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-7 shadow-xs relative overflow-hidden transition-all duration-300'>
      {/* Subtle Background Accent */}
      <div className='absolute -right-16 -top-16 w-56 h-56 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none' />

      {/* Header Bar */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-100 pb-5'>
        <div className='flex items-center gap-3.5'>
          <div className='h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 items-center justify-center shrink-0 shadow-xs hidden sm:flex'>
            {progressPercent === 100 ? (
              <Trophy className='h-6 w-6 text-amber-500 animate-bounce' />
            ) : (
              <Sparkles className='h-6 w-6 text-emerald-600' />
            )}
          </div>
          <div>
            <div className='flex items-center gap-2 flex-wrap'>
              <h3 className='text-base sm:text-lg font-extrabold tracking-tight text-slate-900'>
                Panduan Cepat Memulai Smart Class
              </h3>
              <span className='px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider'>
                {completedCount}/{steps.length} Selesai
              </span>
            </div>
            <p className='text-xs text-slate-500 mt-0.5 font-medium leading-relaxed'>
              Ikuti 4 langkah sederhana ini untuk merasakan kemudahan
              rekapitulasi kelas otomatis Anda!
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className='self-end sm:self-center text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer'
          title='Sembunyikan panduan ini'
        >
          <X className='h-5 w-5' />
        </button>
      </div>

      {/* Progress Bar */}
      <div className='mt-4 relative z-10'>
        <div className='flex items-center justify-between text-xs font-semibold mb-1.5 text-slate-600'>
          <span>Kemajuan Anda</span>
          <span className='text-emerald-600 font-extrabold'>
            {progressPercent}%
          </span>
        </div>
        <div className='w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80'>
          <div
            className='bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-xs'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Steps Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-5 relative z-10'>
        {steps.map((step) => {
          const StepIcon = step.icon;
          return (
            <div
              key={step.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                step.isCompleted
                  ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-700'
                  : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80 text-slate-900'
              }`}
            >
              <div className='flex items-start gap-3'>
                {/* Toggle Checkbox Button */}
                <button
                  onClick={() => toggleCheck(step.id)}
                  className='mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer shrink-0'
                  title={
                    step.isCompleted ? 'Tandai belum selesai' : 'Tandai selesai'
                  }
                >
                  {step.isCompleted ? (
                    <CheckCircle2 className='h-5 w-5 text-emerald-600 fill-emerald-100' />
                  ) : (
                    <Circle className='h-5 w-5 text-slate-400 hover:text-slate-600' />
                  )}
                </button>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <StepIcon
                      className={`h-4 w-4 shrink-0 ${step.isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}
                    />
                    <h4
                      className={`text-xs sm:text-sm font-extrabold truncate ${
                        step.isCompleted
                          ? 'line-through text-slate-500'
                          : 'text-slate-900'
                      }`}
                    >
                      {step.title}
                    </h4>
                  </div>
                  <p className='text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2 font-medium'>
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* Action Link */}
              <div className='mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between'>
                <span className='text-[10px] font-extrabold text-slate-400 uppercase tracking-wider'>
                  {step.isCompleted ? '✓ Terinput' : 'Belum dicoba'}
                </span>
                <Link
                  href={step.href}
                  onClick={() => {
                    if (step.id === 'cetak') {
                      toggleCheck('cetak');
                    }
                  }}
                >
                  <Button
                    size='sm'
                    className={`h-8 px-3 text-xs font-bold rounded-xl gap-1.5 cursor-pointer shadow-xs transition-all ${
                      step.isCompleted
                        ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <span>{step.actionText}</span>
                    <ChevronRight className='h-3.5 w-3.5' />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Congratulations Footer when 100% complete */}
      {progressPercent === 100 && (
        <div className='mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-900 text-xs font-bold animate-pulse'>
          <span className='flex items-center gap-2'>
            <Trophy className='h-5 w-5 text-amber-500 shrink-0' />
            Hebat! Seluruh alur dasar Smart Class sudah Anda kuasai. Selamat
            mengajar!
          </span>
          <button
            onClick={handleDismiss}
            className='underline text-emerald-800 hover:text-emerald-950 text-xs font-extrabold cursor-pointer shrink-0'
          >
            Tutup Panduan
          </button>
        </div>
      )}
    </div>
  );
}
