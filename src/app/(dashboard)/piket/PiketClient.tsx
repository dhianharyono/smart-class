'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Users,
  Printer,
  Save,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function PiketClient() {
  const [piketData, setPiketData] = useState<Record<string, string>>({
    Senin: 'Ahmad Supriyadi, Budi Santoso, Citra Lestari, Dewi Anggraini',
    Selasa: 'Eko Prasetyo, Fani Rahmawati, Gita Gutawa, Hendra Pratama',
    Rabu: 'Indah Permata, Joko Widodo, Kartika Putri, Lani Wijaya',
    Kamis: 'Maman Abdurrahman, Nita Amelia, Oki Setiana, Putri Titian',
    Jumat: 'Rian D\'Masiv, Siska Kohl, Tono Sudirjo, Utama Kencana',
    Sabtu: 'Vina Panduwinata, Wahyu Hidayat, Yuni Shara, Zainal Abidin',
  });

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
            Atur dan kelola pembagian kelompok piket harian siswa untuk menjaga kebersihan dan kerapian kelas.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 w-full sm:w-auto'>
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
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-5 gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center'
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
          <strong>Petunjuk Pengisian:</strong> Masukkan nama-nama siswa petugas piket harian pada kolom hari masing-masing (pisahkan dengan koma). Hasil penataan ini dapat langsung dicetak untuk ditempel pada papan informasi dinding kelas.
        </p>
      </div>

      {/* Printable Grid of Daily Duty Rosters */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {DAYS.map((day) => {
          const names = piketData[day]
            ? piketData[day].split(',').map((n) => n.trim()).filter(Boolean)
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

                    <span className='px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full border border-slate-200'>
                      {names.length} Siswa
                    </span>
                  </div>

                  {/* Tag Pill Visualizations for Print & UI */}
                  {names.length > 0 ? (
                    <div className='flex flex-wrap gap-1.5 py-1'>
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
                    <p className='text-xs text-slate-400 italic py-1'>Belum ada siswa ditambahkan.</p>
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
                    onChange={(e) => setPiketData({ ...piketData, [day]: e.target.value })}
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
