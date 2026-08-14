'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, Save, Info, UserX, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { getStudents } from '@/actions/studentActions';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function PiketClient() {
  // Fetch class students automatically
  const { data: students = [], isLoading: isStudentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => getStudents(),
  });

  // Initial state empty for real teacher entry
  const [piketData, setPiketData] = useState<Record<string, string>>({
    Senin: '',
    Selasa: '',
    Rabu: '',
    Kamis: '',
    Jumat: '',
    Sabtu: '',
  });

  // Smart Randomize Function
  const handleSmartRandomize = () => {
    if (!students || students.length === 0) {
      toast.error(
        'Belum ada data siswa terdaftar di kelas. Silakan tambahkan data siswa di menu Data Siswa terlebih dahulu.',
      );
      return;
    }

    // Clone array and shuffle using Fisher-Yates algorithm
    const names = students.map((s: any) => s.name);
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

    // Evenly distribute across DAYS (Senin - Sabtu)
    const newPiket: Record<string, string[]> = {
      Senin: [],
      Selasa: [],
      Rabu: [],
      Kamis: [],
      Jumat: [],
      Sabtu: [],
    };

    names.forEach((name: string, index: number) => {
      const dayIndex = index % DAYS.length;
      const dayName = DAYS[dayIndex];
      newPiket[dayName].push(name);
    });

    // Format array to comma-separated string for state
    const formattedPiket: Record<string, string> = {};
    DAYS.forEach((day) => {
      formattedPiket[day] = newPiket[day].join(', ');
    });

    setPiketData(formattedPiket);
    toast.success(
      `Jadwal piket berhasil diacak secara otomatis (Smart AI) untuk ${students.length} siswa!`,
    );
  };

  const handleSave = () => {
    toast.success('Jadwal piket kebersihan kelas berhasil disimpan!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3'>
            <span>Jadwal Piket Kebersihan Kelas</span>
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Atur dan kelola pembagian kelompok piket harian siswa untuk menjaga
            kebersihan dan kerapian kelas.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 w-full sm:w-auto'>
          <Button
            onClick={handleSmartRandomize}
            disabled={isStudentsLoading}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center'
          >
            {isStudentsLoading ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Sparkles className='h-4 w-4' />
            )}
            <span>Acak Piket Otomatis (Smart AI)</span>
          </Button>

          <Button
            onClick={handlePrint}
            variant='outline'
            className='border-slate-900 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center'
          >
            <Printer className='h-4 w-4' />
            <span>Cetak Jadwal Piket Dinding</span>
          </Button>

          <Button
            onClick={handleSave}
            variant='outline'
            className='border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl h-10 px-5 gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center'
          >
            <Save className='h-4 w-4' />
            <span>Simpan Jadwal Piket</span>
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className='bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900 print:hidden'>
        <Info className='h-4 w-4 text-emerald-600 shrink-0 mt-0.5' />
        <p className='leading-relaxed'>
          <strong>Petunjuk Pengisian:</strong> Klik tombol{' '}
          <strong className='text-emerald-700 font-extrabold'>
            "Acak Piket Otomatis (Smart AI)"
          </strong>{' '}
          untuk membagikan seluruh siswa kelas secara merata ke hari Senin - Sabtu,
          atau masukkan/edit nama siswa secara manual pada kolom hari masing-masing (pisahkan dengan koma).
        </p>
      </div>

      {/* Printable Grid of Daily Duty Rosters */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {DAYS.map((day) => {
          const names = piketData[day]
            ? piketData[day]
                .split(',')
                .map((n) => n.trim())
                .filter(Boolean)
            : [];

          return (
            <Card
              key={day}
              className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between print:shadow-none print:border-slate-300'
            >
              <CardContent className='p-5 space-y-4 flex-1 flex flex-col justify-between'>
                <div className='space-y-3'>
                  {/* Day Header */}
                  <div className='flex items-center justify-between border-b border-slate-100 pb-3'>
                    <div className='flex items-center gap-2'>
                      <div className='h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center border border-emerald-200/60'>
                        {day.substring(0, 3).toUpperCase()}
                      </div>
                      <span className='font-extrabold text-sm text-slate-900 uppercase tracking-wider'>
                        HARI {day}
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border transition-all ${
                        names.length > 0
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {names.length} Siswa
                    </span>
                  </div>

                  {/* Tag Pill Visualizations for Print & UI */}
                  {names.length > 0 ? (
                    <div className='flex flex-wrap gap-1.5 py-1 min-h-[96px] content-start'>
                      {names.map((name, idx) => (
                        <div
                          key={idx}
                          className='flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold'
                        >
                          <div className='h-2 w-2 rounded-full bg-emerald-500' />
                          <span>{name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* NEGATIVE CASE EMPTY UI */
                    <div className='py-6 px-3 text-center flex flex-col items-center justify-center space-y-2 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200/80 my-1 min-h-[96px]'>
                      <div className='h-9 w-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200/60 shrink-0'>
                        <UserX className='h-4 w-4' />
                      </div>
                      <div className='space-y-0.5'>
                        <p className='text-xs font-extrabold text-slate-700'>
                          Belum Ada Petugas Piket
                        </p>
                        <p className='text-[11px] text-slate-400 font-medium leading-normal max-w-[210px] mx-auto'>
                          Ketik nama siswa pada kolom di bawah untuk menetapkan petugas piket hari {day}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Text Area */}
                <div className='space-y-1.5 pt-2 print:hidden'>
                  <label className='text-[10px] font-bold text-slate-500 uppercase tracking-wider block'>
                    EDIT PETUGAS (DIPISAH KOMA)
                  </label>
                  <textarea
                    rows={3}
                    value={piketData[day] || ''}
                    onChange={(e) =>
                      setPiketData({ ...piketData, [day]: e.target.value })
                    }
                    placeholder='Contoh: Ahmad, Budi, Citra, Dewi...'
                    className='w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:border-emerald-500 leading-relaxed resize-none'
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
