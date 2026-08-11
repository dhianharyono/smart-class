'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Printer,
  Plus,
  Minus,
  Trash2,
  Clock,
  Coffee,
  CheckSquare,
  LayoutGrid,
  Info,
  BookOpen,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface BaselineSubject {
  id: string;
  name: string;
  targetHours: number;
}

interface ScheduleRow {
  jamKe: number;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  breakLabel: string;
  schedule: Record<string, string>; // e.g. { Senin: 'Matematika', Selasa: '' }
}

const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function JadwalClient() {
  // Baseline Subjects State
  const [baselineSubjects, setBaselineSubjects] = useState<BaselineSubject[]>([
    { id: '1', name: 'Matematika', targetHours: 4 },
    { id: '2', name: 'Bahasa Indonesia', targetHours: 4 },
    { id: '3', name: 'IPA Terpadu', targetHours: 3 },
    { id: '4', name: 'IPS Terpadu', targetHours: 3 },
    { id: '5', name: 'Bahasa Inggris', targetHours: 3 },
    { id: '6', name: 'Pendidikan Agama', targetHours: 3 },
  ]);

  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectHours, setNewSubjectHours] = useState<number>(1);

  // Timetable Rows State
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([
    { jamKe: 1, startTime: '07:15', endTime: '07:55', isBreak: false, breakLabel: 'Jam Istirahat', schedule: {} },
    { jamKe: 2, startTime: '07:55', endTime: '08:35', isBreak: false, breakLabel: 'Jam Istirahat', schedule: {} },
    { jamKe: 3, startTime: '08:35', endTime: '09:15', isBreak: false, breakLabel: 'Jam Istirahat', schedule: {} },
    { jamKe: 4, startTime: '09:15', endTime: '09:55', isBreak: false, breakLabel: 'Jam Istirahat', schedule: {} },
    { jamKe: 5, startTime: '10:15', endTime: '10:55', isBreak: false, breakLabel: 'Jam Istirahat', schedule: {} },
    { jamKe: 6, startTime: '10:55', endTime: '11:35', isBreak: false, breakLabel: 'Jam Istirahat', schedule: {} },
    { jamKe: 7, startTime: '11:35', endTime: '12:15', isBreak: false, breakLabel: 'Jam Istirahat', schedule: {} },
  ]);

  // Piket State
  const [piketData, setPiketData] = useState<Record<string, string>>({
    Senin: 'Ahmad, Budi, Citra, Dewi',
    Selasa: 'Eko, Fani, Gita, Hendra',
    Rabu: 'Indah, Joko, Kartika, Lani',
    Kamis: 'Maman, Nita, Oki, Putri',
    Jumat: 'Rian, Siska, Tono, Utama',
    Sabtu: 'Vina, Wahyu, Yuni, Zainal',
  });

  // Hover state for Jam Ke Break button
  const [hoveredJamKe, setHoveredJamKe] = useState<number | null>(null);

  // Add Baseline Subject
  const handleAddBaseline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) {
      toast.error('Masukkan nama mata pelajaran.');
      return;
    }
    const newSubject: BaselineSubject = {
      id: Date.now().toString(),
      name: newSubjectName.trim(),
      targetHours: Math.max(1, Number(newSubjectHours) || 1),
    };
    setBaselineSubjects((prev) => [...prev, newSubject]);
    setNewSubjectName('');
    setNewSubjectHours(1);
    toast.success(`Mata pelajaran '${newSubject.name}' berhasil ditambahkan!`);
  };

  // Remove Baseline Subject
  const handleRemoveBaseline = (id: string) => {
    setBaselineSubjects((prev) => prev.filter((s) => s.id !== id));
    toast.info('Mata pelajaran dihapus dari baseline.');
  };

  // Update Schedule Cell
  const handleCellChange = (jamKe: number, day: string, value: string) => {
    setScheduleRows((prev) =>
      prev.map((row) => {
        if (row.jamKe === jamKe) {
          return {
            ...row,
            schedule: {
              ...row.schedule,
              [day]: value,
            },
          };
        }
        return row;
      }),
    );
  };

  // Toggle Break Row
  const handleToggleBreak = (jamKe: number) => {
    setScheduleRows((prev) =>
      prev.map((row) => {
        if (row.jamKe === jamKe) {
          const nextBreak = !row.isBreak;
          toast.success(
            nextBreak
              ? `Jam ke-${jamKe} diubah menjadi Jam Istirahat`
              : `Jam ke-${jamKe} dikembalikan menjadi Jam Pelajaran`,
          );
          return { ...row, isBreak: nextBreak };
        }
        return row;
      }),
    );
  };

  // Add Row
  const handleAddRow = () => {
    setScheduleRows((prev) => {
      const nextJam = prev.length + 1;
      const lastRow = prev[prev.length - 1];
      let start = '12:15';
      let end = '12:55';
      if (lastRow) {
        start = lastRow.endTime;
        const [h, m] = start.split(':').map(Number);
        const totalMinutes = h * 60 + m + 40;
        const endH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
        const endM = String(totalMinutes % 60).padStart(2, '0');
        end = `${endH}:${endM}`;
      }
      return [
        ...prev,
        {
          jamKe: nextJam,
          startTime: start,
          endTime: end,
          isBreak: false,
          breakLabel: 'Jam Istirahat',
          schedule: {},
        },
      ];
    });
  };

  // Remove Row
  const handleRemoveRow = () => {
    if (scheduleRows.length <= 1) {
      toast.error('Jumlah jam pelajaran minimal 1 baris.');
      return;
    }
    setScheduleRows((prev) => prev.slice(0, -1));
  };

  // Generate AI Schedule Plotting
  const handleGenerateAI = () => {
    if (baselineSubjects.length === 0) {
      toast.error('Tambahkan minimal 1 alokasi baseline mata pelajaran terlebih dahulu.');
      return;
    }

    // Build subject pool based on target hours
    const pool: string[] = [];
    baselineSubjects.forEach((sub) => {
      for (let i = 0; i < sub.targetHours; i++) {
        pool.push(sub.name);
      }
    });

    let poolIndex = 0;
    setScheduleRows((prev) =>
      prev.map((row) => {
        if (row.isBreak) return row;
        const newSched: Record<string, string> = { ...row.schedule };
        DAYS.forEach((day) => {
          if (!newSched[day] || newSched[day] === '') {
            if (poolIndex < pool.length) {
              newSched[day] = pool[poolIndex];
              poolIndex = (poolIndex + 1) % pool.length;
            }
          }
        });
        return { ...row, schedule: newSched };
      }),
    );

    toast.success('Jadwal pelajaran berhasil di-generate secara otomatis oleh AI!');
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Count assigned hours per subject
  const getAssignedHours = (subjectName: string) => {
    let count = 0;
    scheduleRows.forEach((row) => {
      if (!row.isBreak) {
        DAYS.forEach((day) => {
          if (row.schedule[day] === subjectName) {
            count++;
          }
        });
      }
    });
    return count;
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3'>

            <span>Jadwal & Alokasi Pelajaran</span>
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Kelola target alokasi jam mengajar mingguan dan plotting jadwal pelajaran kelas secara efektif.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2.5'>
          <Button
            onClick={handleGenerateAI}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer'
          >
            <Sparkles className='h-4 w-4' />
            <span>Generate Jadwal AI</span>
          </Button>
          <Button
            onClick={handlePrint}
            variant='outline'
            className='border-slate-900 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer'
          >
            <Printer className='h-4 w-4' />
            <span>Cetak Jadwal Dinding Kelas</span>
          </Button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6'>
        {/* LEFT COLUMN: BASELINE & TRACKER */}
        <div className='lg:col-span-4 space-y-6 print:hidden'>
          {/* TAMBAH ALOKASI BASELINE CARD */}
          <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden'>
            <CardContent className='p-5 space-y-4'>
              <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3'>
                <Plus className='h-4 w-4 text-emerald-600' />
                <span>TAMBAH ALOKASI BASELINE</span>
              </div>

              <form onSubmit={handleAddBaseline} className='space-y-3.5'>
                <div className='space-y-1.5'>
                  <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                    NAMA MATA PELAJARAN
                  </label>
                  <Input
                    placeholder='Contoh: Matematika, IPA, Seni...'
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className='bg-slate-50 border-slate-200 text-slate-900 text-xs rounded-xl h-10 placeholder:text-slate-400'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label className='text-[11px] font-bold text-slate-600 uppercase tracking-wider block'>
                    ALOKASI MINGGUAN (JAM/SESI)
                  </label>
                  <Input
                    type='number'
                    min={1}
                    max={20}
                    value={newSubjectHours}
                    onChange={(e) => setNewSubjectHours(Number(e.target.value))}
                    className='bg-slate-50 border-slate-200 text-slate-900 text-xs rounded-xl h-10'
                  />
                </div>

                <Button
                  type='submit'
                  className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl h-10 cursor-pointer shadow-xs'
                >
                  Simpan Alokasi
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* TRACKER ALOKASI KELAS CARD */}
          <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden'>
            <CardContent className='p-5 space-y-4'>
              <div className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3'>
                <Clock className='h-4 w-4 text-emerald-600' />
                <span>TRACKER ALOKASI KELAS</span>
              </div>

              {baselineSubjects.length === 0 ? (
                <div className='py-10 text-center text-slate-400 space-y-2'>
                  <Info className='h-8 w-8 mx-auto text-slate-300' />
                  <p className='text-xs font-medium text-slate-500'>
                    Belum ada alokasi waktu mata pelajaran.
                  </p>
                </div>
              ) : (
                <div className='space-y-3 max-h-[350px] overflow-y-auto pr-1'>
                  {baselineSubjects.map((sub) => {
                    const assigned = getAssignedHours(sub.name);
                    const isComplete = assigned >= sub.targetHours;
                    return (
                      <div
                        key={sub.id}
                        className='p-3 rounded-xl border border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 text-xs'
                      >
                        <div className='flex-1 min-w-0'>
                          <p className='font-bold text-slate-900 truncate'>{sub.name}</p>
                          <div className='flex items-center gap-2 mt-1'>
                            <div className='flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden'>
                              <div
                                className={`h-full rounded-full transition-all ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                style={{
                                  width: `${Math.min(100, (assigned / sub.targetHours) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className='text-[10px] font-bold text-slate-600 shrink-0'>
                              {assigned} / {sub.targetHours} jam
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleRemoveBaseline(sub.id)}
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0'
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: MAIN INTERACTIVE SCHEDULE TABLE */}
        <div className='lg:col-span-8 space-y-4'>
          {/* Quick Break Chips Control Bar Above Table */}
          <div className='bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-xs print:hidden'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 border-b border-slate-100 pb-2.5'>
              <span className='text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2'>
                <Coffee className='h-4 w-4 text-emerald-600' />
                <span>PENGATURAN JAM ISTIRAHAT</span>
              </span>
              <span className='text-[11px] text-slate-500 font-medium'>
                Klik chip nomor jam untuk mengaktifkan / membatalkan jam istirahat
              </span>
            </div>
            <div className='flex flex-wrap items-center gap-2 pt-1'>
              {scheduleRows.map((row) => (
                <button
                  key={row.jamKe}
                  type='button'
                  onClick={() => handleToggleBreak(row.jamKe)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 border ${
                    row.isBreak
                      ? 'bg-amber-500 border-amber-600 text-white shadow-amber-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50'
                  }`}
                >
                  <Coffee className={`h-3.5 w-3.5 ${row.isBreak ? 'text-white' : 'text-slate-400'}`} />
                  <span>Jam {row.jamKe}</span>
                  {row.isBreak && (
                    <span className='text-[9px] bg-white/20 text-white px-1.5 py-0.2 rounded font-extrabold uppercase ml-0.5'>
                      Istirahat
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Printable & Interactive Table Card */}
          <Card className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs print:shadow-none print:border-none'>
            <CardContent className='p-0 overflow-x-auto'>
              <table className='w-full text-xs text-left border-collapse'>
                <thead>
                  <tr className='bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-center'>
                    <th className='p-3 border-r border-slate-200 w-16 uppercase'>JAM</th>
                    <th className='p-3 border-r border-slate-200 w-36 uppercase'>WAKTU</th>
                    {DAYS.map((day) => (
                      <th key={day} className='p-3 border-r border-slate-200 min-w-[120px] uppercase'>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scheduleRows.map((row) => (
                    <tr
                      key={row.jamKe}
                      className={`border-b border-slate-200 transition-colors ${
                        row.isBreak ? 'bg-amber-50/60' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* JAM KE COLUMN */}
                      <td className='p-3 border-r border-slate-200 text-center font-bold text-slate-800'>
                        {row.jamKe}
                      </td>

                      {/* WAKTU COLUMN */}
                      <td className='p-2 border-r border-slate-200 text-center'>
                        <div className='flex items-center justify-center gap-1 font-mono text-[11px] font-semibold text-slate-700'>
                          <input
                            type='text'
                            value={row.startTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScheduleRows((prev) =>
                                prev.map((r) => (r.jamKe === row.jamKe ? { ...r, startTime: val } : r)),
                              );
                            }}
                            className='w-12 text-center bg-slate-50 border border-slate-200 rounded-md py-0.5 px-1 focus:border-emerald-500'
                          />
                          <span>-</span>
                          <input
                            type='text'
                            value={row.endTime}
                            onChange={(e) => {
                              const val = e.target.value;
                              setScheduleRows((prev) =>
                                prev.map((r) => (r.jamKe === row.jamKe ? { ...r, endTime: val } : r)),
                              );
                            }}
                            className='w-12 text-center bg-slate-50 border border-slate-200 rounded-md py-0.5 px-1 focus:border-emerald-500'
                          />
                        </div>
                      </td>

                      {/* ISTIRAHAT ROW FULL SPAN OR REGULAR DAY CELLS */}
                      {row.isBreak ? (
                        <td colSpan={DAYS.length} className='p-3 text-center bg-amber-100/70 text-amber-900 font-bold tracking-widest text-xs uppercase'>
                          <div className='flex items-center justify-center gap-2'>
                            <Coffee className='h-4 w-4 text-amber-700' />
                            <span>ISTIRAHAT / SHOLAT / KANTIN</span>
                          </div>
                        </td>
                      ) : (
                        DAYS.map((day) => (
                          <td key={day} className='p-2 border-r border-slate-200 text-center'>
                            <select
                              value={row.schedule[day] || ''}
                              onChange={(e) => handleCellChange(row.jamKe, day, e.target.value)}
                              className='w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-2 font-medium focus:border-emerald-500 cursor-pointer print:border-none print:bg-transparent print:text-center'
                            >
                              <option value=''>-- Kosong --</option>
                              {baselineSubjects.map((sub) => (
                                <option key={sub.id} value={sub.name}>
                                  {sub.name}
                                </option>
                              ))}
                              <option value='Upacara Bendera'>Upacara Bendera</option>
                              <option value='Senam & Olahraga'>Senam & Olahraga</option>
                              <option value='Pramuka / Ekstra'>Pramuka / Ekstra</option>
                              <option value='Tadarus & Literasi'>Tadarus & Literasi</option>
                            </select>
                          </td>
                        ))
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>

            {/* Table Footer Controls */}
            <div className='p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs print:hidden'>
              <div className='font-bold text-slate-700 uppercase tracking-wider'>
                JUMLAH BARIS JAM PELAJARAN: <span className='text-emerald-700'>{scheduleRows.length}</span>
              </div>

              <div className='flex items-center gap-2'>
                <Button
                  onClick={handleRemoveRow}
                  variant='outline'
                  className='border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-bold rounded-xl h-9 px-3 gap-1.5 text-xs shadow-xs cursor-pointer'
                >
                  <Minus className='h-3.5 w-3.5' />
                  <span>Kurangi Baris</span>
                </Button>
                <Button
                  onClick={handleAddRow}
                  variant='outline'
                  className='border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl h-9 px-3 gap-1.5 text-xs shadow-xs cursor-pointer'
                >
                  <Plus className='h-3.5 w-3.5' />
                  <span>Tambah Baris</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
