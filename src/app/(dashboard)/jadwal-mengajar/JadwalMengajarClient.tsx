'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  CalendarClock,
  Clock,
  Plus,
  Printer,
  BookOpen,
  School,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
  Calendar,
  ArrowRight,
  Sparkles,
  BookMarked,
  UserCheck,
  Building2,
  Award,
  GripVertical,
  ArrowLeftRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getProfile } from '@/actions/profileActions';
import { getSubjects } from '@/actions/gradeActions';

export interface TeachingSlot {
  id: string;
  day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  period: number; // Jam Ke- (1-8)
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
  room?: string;
}

const DAYS: ('Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu')[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '07:15', end: '07:55' },
  2: { start: '07:55', end: '08:35' },
  3: { start: '08:35', end: '09:15' },
  4: { start: '09:30', end: '10:10' },
  5: { start: '10:10', end: '10:50' },
  6: { start: '11:05', end: '11:45' },
  7: { start: '12:30', end: '13:10' },
  8: { start: '13:10', end: '13:50' },
};

const CLASS_COLORS: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  default: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
  },
  A: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  B: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
  },
  C: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  D: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
};

function getClassColor(className: string) {
  const lastChar = className.trim().slice(-1).toUpperCase();
  return CLASS_COLORS[lastChar] || CLASS_COLORS.default;
}

export default function JadwalMengajarClient() {
  const { data: profile } = useQuery({
    queryKey: ['teacherProfile'],
    queryFn: () => getProfile(),
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ['teacherSubjects'],
    queryFn: () => getSubjects(),
  });

  const teacherClasses: string[] =
    profile?.classes && profile.classes.length > 0
      ? profile.classes
      : [profile?.className || 'Kelas 1'];

  // Initial Seed Slots
  const initialSlots: TeachingSlot[] = [
    {
      id: 'slot-1',
      day: 'Senin',
      period: 1,
      startTime: '07:15',
      endTime: '07:55',
      className: teacherClasses[0] || 'Kelas 1',
      subject: 'Matematika',
      room: 'Ruang Teori',
    },
    {
      id: 'slot-2',
      day: 'Senin',
      period: 2,
      startTime: '07:55',
      endTime: '08:35',
      className: teacherClasses[0] || 'Kelas 1',
      subject: 'Matematika',
      room: 'Ruang Teori',
    },
    {
      id: 'slot-3',
      day: 'Selasa',
      period: 3,
      startTime: '08:35',
      endTime: '09:15',
      className: teacherClasses[0] || 'Kelas 1',
      subject: 'IPA',
      room: 'Laboratorium',
    },
    {
      id: 'slot-4',
      day: 'Rabu',
      period: 2,
      startTime: '07:55',
      endTime: '08:35',
      className: teacherClasses[0] || 'Kelas 1',
      subject: 'Bahasa Indonesia',
      room: 'Ruang Teori',
    },
    {
      id: 'slot-5',
      day: 'Kamis',
      period: 4,
      startTime: '09:30',
      endTime: '10:10',
      className: teacherClasses[0] || 'Kelas 1',
      subject: 'Pendidikan Pancasila',
      room: 'Ruang Teori',
    },
    {
      id: 'slot-6',
      day: 'Jumat',
      period: 1,
      startTime: '07:15',
      endTime: '07:55',
      className: teacherClasses[0] || 'Kelas 1',
      subject: 'Bahasa Inggris',
      room: 'Ruang Multimedia',
    },
  ];

  const [teachingSlots, setTeachingSlots] =
    useState<TeachingSlot[]>(initialSlots);
  const [activeTab, setActiveTab] = useState<'grid' | 'today'>('grid');

  // Drag and Drop State
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<{
    day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
    period: number;
  } | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    day: 'Senin' as 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
    period: 1,
    startTime: '07:15',
    endTime: '07:55',
    className: '',
    subject: '',
    room: '',
  });

  // Load from LocalStorage
  const [kopSettings, setKopSettings] = useState<{
    useOfficialKop: boolean;
    schoolName: string;
    subHeader1: string;
    subHeader2: string;
    subHeader3: string;
    addressLine: string;
    cityRegency: string;
    logoUrl: string;
  }>({
    useOfficialKop: false,
    schoolName: '',
    subHeader1: '',
    subHeader2: '',
    subHeader3: '',
    addressLine: '',
    cityRegency: '',
    logoUrl: '/icon.svg',
  });

  const [sigSettings, setSigSettings] = useState<{
    supervisorTitle: string;
    supervisorName: string;
    supervisorNip: string;
    teacherTitle: string;
    teacherName: string;
    teacherNip: string;
    place: string;
    date: string;
  }>({
    supervisorTitle: 'Kepala Sekolah',
    supervisorName: '',
    supervisorNip: '',
    teacherTitle: 'Guru Mata Pelajaran / Wali Kelas',
    teacherName: '',
    teacherNip: '',
    place: 'Bandung',
    date: '',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('smart_class_jadwal_mengajar');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTeachingSlots(parsed);
        }
      }
      const savedKop = localStorage.getItem('smart_class_kop_settings');
      if (savedKop) {
        const parsedKop = JSON.parse(savedKop);
        setKopSettings((prev) => ({ ...prev, ...parsedKop }));
      }
      const savedSig = localStorage.getItem('smart_class_sig_settings');
      if (savedSig) {
        const parsedSig = JSON.parse(savedSig);
        setSigSettings((prev) => ({ ...prev, ...parsedSig }));
      }
    } catch (e) {}
  }, []);

  // Sync default form className & subject once loaded
  useEffect(() => {
    if (teacherClasses.length > 0 && !formData.className) {
      setFormData((prev) => ({ ...prev, className: teacherClasses[0] }));
    }
    if (subjects.length > 0 && !formData.subject) {
      setFormData((prev) => ({ ...prev, subject: subjects[0] }));
    }
  }, [teacherClasses, subjects]);

  const saveToLocalStorage = (slots: TeachingSlot[]) => {
    setTeachingSlots(slots);
    try {
      localStorage.setItem(
        'smart_class_jadwal_mengajar',
        JSON.stringify(slots),
      );
    } catch (e) {}
  };

  const handleOpenAddModal = (
    day?: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
    period?: number,
  ) => {
    const selectedPeriod = period || 1;
    const times = PERIOD_TIMES[selectedPeriod] || {
      start: '07:15',
      end: '07:55',
    };
    setEditingSlotId(null);
    setFormData({
      day: day || 'Senin',
      period: selectedPeriod,
      startTime: times.start,
      endTime: times.end,
      className: teacherClasses[0] || '',
      subject: subjects[0] || 'Matematika',
      room: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (slot: TeachingSlot) => {
    setEditingSlotId(slot.id);
    setFormData({
      day: slot.day,
      period: slot.period,
      startTime: slot.startTime,
      endTime: slot.endTime,
      className: slot.className,
      subject: slot.subject,
      room: slot.room || '',
    });
    setModalOpen(true);
  };

  const handleDeleteSlot = (id: string) => {
    const updated = teachingSlots.filter((s) => s.id !== id);
    saveToLocalStorage(updated);
    toast.success('Jadwal mengajar berhasil dihapus.');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, slotId: string) => {
    e.dataTransfer.setData('text/plain', slotId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedSlotId(slotId);
  };

  const handleDragEnd = () => {
    setDraggedSlotId(null);
    setDragOverTarget(null);
  };

  const handleDragOver = (
    e: React.DragEvent,
    day: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
    period: number,
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (
      !dragOverTarget ||
      dragOverTarget.day !== day ||
      dragOverTarget.period !== period
    ) {
      setDragOverTarget({ day, period });
    }
  };

  const handleDragLeave = (
    e: React.DragEvent,
    day: string,
    period: number,
  ) => {
    if (dragOverTarget?.day === day && dragOverTarget?.period === period) {
      setDragOverTarget(null);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    targetDay: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu',
    targetPeriod: number,
  ) => {
    e.preventDefault();
    const sourceSlotId = e.dataTransfer.getData('text/plain') || draggedSlotId;
    setDraggedSlotId(null);
    setDragOverTarget(null);

    if (!sourceSlotId) return;

    const sourceSlot = teachingSlots.find((s) => s.id === sourceSlotId);
    if (!sourceSlot) return;

    // Jika dilepas di hari dan jam yang sama persis, abaikan
    if (sourceSlot.day === targetDay && sourceSlot.period === targetPeriod) {
      return;
    }

    const targetSlot = teachingSlots.find(
      (s) => s.day === targetDay && s.period === targetPeriod,
    );

    const targetTimes = PERIOD_TIMES[targetPeriod] || {
      start: '07:15',
      end: '07:55',
    };

    if (targetSlot) {
      // SWAP: Tukar posisi antara sourceSlot dan targetSlot
      const sourceTimes = PERIOD_TIMES[sourceSlot.period] || {
        start: '07:15',
        end: '07:55',
      };

      const updatedSlots = teachingSlots.map((s) => {
        if (s.id === sourceSlot.id) {
          return {
            ...s,
            day: targetDay,
            period: targetPeriod,
            startTime: targetTimes.start,
            endTime: targetTimes.end,
          };
        }
        if (s.id === targetSlot.id) {
          return {
            ...s,
            day: sourceSlot.day,
            period: sourceSlot.period,
            startTime: sourceTimes.start,
            endTime: sourceTimes.end,
          };
        }
        return s;
      });

      saveToLocalStorage(updatedSlots);
      toast.success(
        `Jadwal ditukar: ${sourceSlot.subject} (${targetDay} Jam ${targetPeriod}) ⇄ ${targetSlot.subject} (${sourceSlot.day} Jam ${sourceSlot.period})`,
      );
    } else {
      // MOVE TO EMPTY SLOT
      const updatedSlots = teachingSlots.map((s) => {
        if (s.id === sourceSlot.id) {
          return {
            ...s,
            day: targetDay,
            period: targetPeriod,
            startTime: targetTimes.start,
            endTime: targetTimes.end,
          };
        }
        return s;
      });

      saveToLocalStorage(updatedSlots);
      toast.success(
        `Jadwal ${sourceSlot.subject} (${sourceSlot.className}) dipindahkan ke ${targetDay} Jam Ke-${targetPeriod}`,
      );
    }
  };

  const handlePeriodChange = (val: string | null) => {
    if (!val) return;
    const pNum = Number(val);
    const times = PERIOD_TIMES[pNum] || { start: '07:15', end: '07:55' };
    setFormData((prev) => ({
      ...prev,
      period: pNum,
      startTime: times.start,
      endTime: times.end,
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className.trim()) {
      toast.error('Pilih kelas mengajar.');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Pilih atau masukkan mata pelajaran.');
      return;
    }

    if (editingSlotId) {
      // Edit existing
      const updated = teachingSlots.map((s) =>
        s.id === editingSlotId
          ? {
              ...s,
              day: formData.day,
              period: Number(formData.period),
              startTime: formData.startTime,
              endTime: formData.endTime,
              className: formData.className.trim(),
              subject: formData.subject.trim(),
              room: formData.room.trim() || undefined,
            }
          : s,
      );
      saveToLocalStorage(updated);
      toast.success('Jadwal mengajar berhasil diperbarui!');
    } else {
      // Add new
      const newSlot: TeachingSlot = {
        id: `slot-${Date.now()}`,
        day: formData.day,
        period: Number(formData.period),
        startTime: formData.startTime,
        endTime: formData.endTime,
        className: formData.className.trim(),
        subject: formData.subject.trim(),
        room: formData.room.trim() || undefined,
      };
      saveToLocalStorage([...teachingSlots, newSlot]);
      toast.success('Jadwal mengajar berhasil ditambahkan!');
    }

    setModalOpen(false);
  };

  // Get current day name in Indonesian
  const dayNames = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];
  const currentDayIndex = new Date().getDay();
  const currentDayName = (dayNames[currentDayIndex] as any) || 'Senin';

  // Metrics Calculation
  const totalHours = teachingSlots.length; // 1 slot = 1 JP (Jam Pelajaran)
  const isTargetMet = totalHours >= 24;
  const uniqueTaughtClasses = Array.from(
    new Set(teachingSlots.map((s) => s.className)),
  );
  const uniqueTaughtSubjects = Array.from(
    new Set(teachingSlots.map((s) => s.subject)),
  );
  const todaySlots = teachingSlots
    .filter((s) => s.day === currentDayName)
    .sort((a, b) => a.period - b.period);

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* HEADER SECTION */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs print:hidden'>
        <div className='flex items-center gap-3.5'>
          <div>
            <div className='flex items-center gap-2 flex-wrap'>
              <h1 className='text-lg sm:text-xl font-black text-slate-900 tracking-tight'>
                Jadwal Mengajar Guru
              </h1>
              <span className='px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                {profile?.schoolName || 'Tatap Muka Mingguan'}
              </span>
            </div>
            <p className='text-xs text-slate-500 mt-0.5'>
              Kelola agenda jam mengajar pribadi guru, pemetaan kelas tatap
              muka, dan monitoring beban jam mengajar (JJM).
            </p>
          </div>
        </div>

        <div className='flex items-center gap-2 shrink-0'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => window.print()}
            className='border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-10 px-3.5 gap-2 text-xs font-semibold cursor-pointer'
          >
            <Printer className='h-4 w-4 text-slate-500' />
            <span>Cetak Jadwal</span>
          </Button>
          <Button
            size='sm'
            onClick={() => handleOpenAddModal()}
            className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 px-4 gap-2 text-xs shadow-xs cursor-pointer'
          >
            <Plus className='h-4 w-4' />
            <span>Tambah Jadwal</span>
          </Button>
        </div>
      </div>

      {/* METRICS & WORKLOAD MONITORING CARDS */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden'>
        {/* Metric 1: Total JP */}
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0'>
              <Clock className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center justify-between'>
                <p className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                  Beban Mengajar
                </p>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${
                    isTargetMet
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isTargetMet ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {isTargetMet ? 'Sertifikasi Terpenuhi' : 'Kurang dari 24 JP'}
                </span>
              </div>
              <div className='flex items-baseline gap-1.5 mt-1'>
                <span className='text-2xl font-black text-slate-900'>
                  {totalHours}
                </span>
                <span className='text-xs font-semibold text-slate-500'>
                  JP / Minggu
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 2: Jam Hari Ini */}
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0'>
              <Calendar className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                Jadwal Hari Ini ({currentDayName})
              </p>
              <div className='flex items-baseline gap-1.5 mt-1'>
                <span className='text-2xl font-black text-slate-900'>
                  {todaySlots.length}
                </span>
                <span className='text-xs font-semibold text-slate-500'>
                  Jam Pelajaran
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 3: Kelas Diampu */}
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 shrink-0'>
              <School className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                Distribusi Kelas
              </p>
              <div className='flex items-baseline gap-1.5 mt-1'>
                <span className='text-2xl font-black text-slate-900'>
                  {uniqueTaughtClasses.length}
                </span>
                <span className='text-xs font-semibold text-slate-500'>
                  Kelas Mengajar
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metric 4: Mata Pelajaran */}
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0'>
              <BookOpen className='h-5 w-5' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                Mata Pelajaran
              </p>
              <div className='flex items-baseline gap-1.5 mt-1'>
                <span className='text-2xl font-black text-slate-900'>
                  {uniqueTaughtSubjects.length}
                </span>
                <span className='text-xs font-semibold text-slate-500'>
                  Mata Pelajaran
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VIEW TABS NAVIGATION */}
      <div className='flex items-center justify-between gap-3 border-b border-slate-200 pb-2 print:hidden'>
        <div className='flex items-center gap-2'>
          <button
            type='button'
            onClick={() => setActiveTab('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'grid'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className='h-4 w-4' />
            <span>Matriks Mingguan (Senin - Sabtu)</span>
          </button>
          <button
            type='button'
            onClick={() => setActiveTab('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'today'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className='h-4 w-4' />
            <span>Agenda Hari Ini ({todaySlots.length} JP)</span>
          </button>
        </div>

        <p className='text-xs text-slate-500 hidden sm:block'>
          *Klik sel untuk tambah/ubah. Drag & drop kartu jadwal untuk memindahkan atau menukar jam mengajar.
        </p>
      </div>

      {/* TAB 1: WEEKLY TIMETABLE GRID */}
      {activeTab === 'grid' && (
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden'>
          <CardContent className='p-0 overflow-x-auto'>
            <table className='w-full text-left border-collapse min-w-[760px]'>
              <thead>
                <tr className='bg-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold'>
                  <th className='p-3.5 w-24 text-center border-r border-slate-200'>
                    Jam Ke-
                  </th>
                  {DAYS.map((day) => (
                    <th
                      key={day}
                      className={`p-3.5 text-center font-extrabold border-r border-slate-200 last:border-r-0 ${
                        day === currentDayName
                          ? 'bg-emerald-50/80 text-emerald-800'
                          : 'text-slate-800'
                      }`}
                    >
                      <div className='flex items-center justify-center gap-1.5'>
                        <span>{day}</span>
                        {day === currentDayName && (
                          <span className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 text-xs'>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
                  const times = PERIOD_TIMES[period] || { start: '', end: '' };
                  return (
                    <tr
                      key={period}
                      className='hover:bg-slate-50/40 transition-colors'
                    >
                      {/* Jam & Waktu Col */}
                      <td className='p-3 text-center border-r border-slate-200 bg-slate-50/60'>
                        <span className='font-black text-slate-900 block text-sm'>
                          {period}
                        </span>
                        <span className='text-[10px] font-semibold text-slate-500'>
                          {times.start} - {times.end}
                        </span>
                      </td>

                      {/* Day Columns */}
                      {DAYS.map((day) => {
                        const slot = teachingSlots.find(
                          (s) => s.day === day && s.period === period,
                        );
                        const isDragOver =
                          dragOverTarget?.day === day &&
                          dragOverTarget?.period === period;
                        const isBeingDragged =
                          slot && slot.id === draggedSlotId;

                        return (
                          <td
                            key={`${day}-${period}`}
                            onDragOver={(e) => handleDragOver(e, day, period)}
                            onDragLeave={(e) => handleDragLeave(e, day, period)}
                            onDrop={(e) => handleDrop(e, day, period)}
                            className={`p-2 border-r border-slate-200 last:border-r-0 align-top transition-colors ${
                              day === currentDayName ? 'bg-emerald-50/10' : ''
                            } ${isDragOver ? 'bg-emerald-50/50' : ''}`}
                          >
                            {slot ? (
                              <div
                                draggable={true}
                                onDragStart={(e) => handleDragStart(e, slot.id)}
                                onDragEnd={handleDragEnd}
                                className={`p-2.5 rounded-xl border relative group transition-all shadow-2xs cursor-grab active:cursor-grabbing select-none ${
                                  getClassColor(slot.className).bg
                                } ${getClassColor(slot.className).border} ${
                                  isBeingDragged
                                    ? 'opacity-40 scale-95 border-dashed border-emerald-500'
                                    : isDragOver
                                    ? 'ring-2 ring-blue-500 bg-blue-50/90 scale-[1.02] shadow-md border-blue-300'
                                    : 'hover:shadow-xs hover:border-slate-300'
                                }`}
                              >
                                {isDragOver && !isBeingDragged && (
                                  <div className='absolute -top-2 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[9px] flex items-center gap-1 shadow-sm whitespace-nowrap animate-bounce'>
                                    <ArrowLeftRight className='h-2.5 w-2.5' /> Tukar Jadwal
                                  </div>
                                )}

                                <div className='flex items-center justify-between gap-1'>
                                  <div className='flex items-center gap-1 min-w-0'>
                                    <GripVertical className='h-3 w-3 text-slate-400 group-hover:text-slate-600 shrink-0 print:hidden' />
                                    <span
                                      className={`font-black text-xs truncate ${
                                        getClassColor(slot.className).text
                                      }`}
                                    >
                                      {slot.className}
                                    </span>
                                  </div>
                                  {slot.room && (
                                    <span className='text-[10px] text-slate-500 font-medium truncate max-w-[80px]'>
                                      {slot.room}
                                    </span>
                                  )}
                                </div>
                                <p className='font-bold text-slate-900 mt-1 truncate text-xs pl-4'>
                                  {slot.subject}
                                </p>

                                {/* Action Buttons overlay on hover */}
                                <div className='absolute right-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-white/95 rounded-lg p-0.5 border border-slate-200 shadow-xs print:hidden z-10'>
                                  <button
                                    type='button'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditModal(slot);
                                    }}
                                    className='p-1 rounded text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer'
                                    title='Edit Jadwal'
                                  >
                                    <Pencil className='h-3 w-3' />
                                  </button>
                                  <button
                                    type='button'
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSlot(slot.id);
                                    }}
                                    className='p-1 rounded text-slate-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer'
                                    title='Hapus'
                                  >
                                    <Trash2 className='h-3 w-3' />
                                  </button>
                                </div>
                              </div>
                            ) : isDragOver ? (
                              <div className='w-full h-14 rounded-xl border-2 border-dashed border-emerald-500 bg-emerald-100/70 text-emerald-800 flex flex-col items-center justify-center gap-0.5 scale-[1.02] transition-all shadow-xs animate-pulse'>
                                <span className='text-[11px] font-bold flex items-center gap-1'>
                                  <Plus className='h-3.5 w-3.5' /> Lepas di Sini
                                </span>
                                <span className='text-[9px] text-emerald-600 font-medium'>
                                  Jam Ke-{period} ({times.start})
                                </span>
                              </div>
                            ) : (
                              <button
                                type='button'
                                onClick={() => handleOpenAddModal(day, period)}
                                className='w-full h-14 rounded-xl border border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all group cursor-pointer print:hidden'
                                title={`Tambah jadwal ${day} Jam Ke-${period}`}
                              >
                                <Plus className='h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity' />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: TODAY'S AGENDA VIEW */}
      {activeTab === 'today' && (
        <div className='space-y-4 print:hidden'>
          <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs overflow-hidden'>
            <div className='p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between'>
              <div className='flex items-center gap-2.5'>
                <div className='p-2 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs'>
                  {currentDayName}
                </div>
                <div>
                  <h3 className='text-sm font-extrabold text-slate-900'>
                    Agenda Mengajar Hari Ini
                  </h3>
                  <p className='text-xs text-slate-500'>
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <span className='px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200'>
                {todaySlots.length} Jam Pelajaran
              </span>
            </div>

            <CardContent className='p-5'>
              {todaySlots.length === 0 ? (
                <div className='py-12 text-center text-slate-400 space-y-2'>
                  <CheckCircle2 className='h-10 w-10 text-emerald-400 mx-auto' />
                  <p className='text-sm font-bold text-slate-700'>
                    Tidak Ada Jadwal Mengajar Hari Ini
                  </p>
                  <p className='text-xs text-slate-500 max-w-sm mx-auto'>
                    Anda tidak memiliki jam tatap muka yang dijadwalkan pada
                    hari {currentDayName}.
                  </p>
                  <Button
                    onClick={() => handleOpenAddModal(currentDayName as any)}
                    className='bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-4 gap-1.5 mt-2 cursor-pointer'
                  >
                    <Plus className='h-3.5 w-3.5' />
                    <span>Tambah Jadwal Hari {currentDayName}</span>
                  </Button>
                </div>
              ) : (
                <div className='space-y-3'>
                  {todaySlots.map((slot) => (
                    <div
                      key={slot.id}
                      className='p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:bg-white hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                    >
                      <div className='flex items-center gap-3.5'>
                        <div className='w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center shrink-0 shadow-xs'>
                          <span className='text-[10px] font-medium leading-none'>
                            JAM
                          </span>
                          <span className='text-lg font-black leading-tight'>
                            {slot.period}
                          </span>
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <span className='px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-200'>
                              {slot.className}
                            </span>
                            <span className='text-xs font-semibold text-slate-500 flex items-center gap-1'>
                              <Clock className='h-3.5 w-3.5' />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            {slot.room && (
                              <span className='text-xs text-slate-400'>
                                • {slot.room}
                              </span>
                            )}
                          </div>
                          <h4 className='text-sm sm:text-base font-black text-slate-900 mt-1'>
                            {slot.subject}
                          </h4>
                        </div>
                      </div>

                      {/* Action Links to Jurnal & Absensi */}
                      <div className='flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 shrink-0'>
                        <Link href='/jurnal'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-8 text-xs font-bold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl gap-1.5 cursor-pointer'
                          >
                            <BookMarked className='h-3.5 w-3.5 text-emerald-600' />
                            <span>Jurnal KBM</span>
                          </Button>
                        </Link>
                        <Link href='/absensi'>
                          <Button
                            size='sm'
                            className='h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5 cursor-pointer shadow-xs'
                          >
                            <UserCheck className='h-3.5 w-3.5' />
                            <span>Presensi</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* PRINT VIEW (Clean A4 Document layout for print) */}
      <div className='hidden print:block p-0 space-y-6 text-black'>
        {kopSettings.useOfficialKop ? (
          <div className='mb-6'>
            <div className='flex items-center justify-between gap-4'>
              {/* Left: School Emblem */}
              <div className='w-28 shrink-0 flex items-center justify-center'>
                <img
                  src={kopSettings.logoUrl || '/icon.svg'}
                  alt='Logo Sekolah'
                  className='w-24 h-24 object-contain'
                />
              </div>

              {/* Center: Official Letterhead Text */}
              <div className='flex-1 text-center font-serif text-black space-y-[2px] px-1'>
                {Boolean(kopSettings.schoolName?.trim()) && (
                  <div className='font-serif font-bold uppercase text-lg leading-tight tracking-normal'>
                    {kopSettings.schoolName}
                  </div>
                )}
                {Boolean(kopSettings.subHeader1?.trim()) && (
                  <div className='font-serif font-normal uppercase text-xs leading-tight tracking-normal'>
                    {kopSettings.subHeader1}
                  </div>
                )}
                {Boolean(kopSettings.subHeader2?.trim()) && (
                  <div className='font-serif font-normal text-[11px] leading-tight'>
                    {kopSettings.subHeader2}
                  </div>
                )}
                {Boolean(kopSettings.subHeader3?.trim()) && (
                  <div className='font-serif font-normal text-[11px] leading-tight'>
                    {kopSettings.subHeader3}
                  </div>
                )}
                {Boolean(kopSettings.addressLine?.trim()) && (
                  <div className='font-serif font-normal text-[11px] leading-tight'>
                    {kopSettings.addressLine}
                  </div>
                )}
                {Boolean(kopSettings.cityRegency?.trim()) && (
                  <div className='font-serif font-bold uppercase text-xs leading-tight tracking-normal'>
                    {kopSettings.cityRegency}
                  </div>
                )}
              </div>

              {/* Right spacer for symmetry */}
              <div className='w-28 shrink-0' aria-hidden='true' />
            </div>

            {/* Double line divider */}
            <div className='mt-2.5 mb-4 space-y-[2px]'>
              <div className='border-b-[3px] border-black' />
              <div className='border-b border-black' />
            </div>

            {/* Title */}
            <div className='text-center space-y-1 mb-4'>
              <h2 className='text-base font-bold uppercase tracking-wide'>
                JADWAL MENGAJAR GURU (TATAP MUKA MINGGUAN)
              </h2>
              <p className='text-xs'>
                Nama Guru:{' '}
                <strong>
                  {profile?.name || sigSettings.teacherName || '-'}
                </strong>{' '}
                | NIP: {profile?.nip || sigSettings.teacherNip || '-'}
              </p>
            </div>
          </div>
        ) : (
          <div className='text-center border-b-2 border-black pb-4'>
            <h2 className='text-xl font-bold uppercase tracking-wide'>
              {profile?.schoolName || 'SMART CLASS'}
            </h2>
            <h3 className='text-base font-bold uppercase mt-0.5'>
              JADWAL MENGAJAR GURU (TATAP MUKA MINGGUAN)
            </h3>
            <p className='text-xs mt-1'>
              Nama Guru: <strong>{profile?.name || '-'}</strong> | NIP:{' '}
              {profile?.nip || '-'}
            </p>
          </div>
        )}

        <table className='w-full border-collapse border border-black text-xs'>
          <thead>
            <tr className='bg-slate-100'>
              <th className='border border-black p-2 text-center w-16'>
                Jam Ke
              </th>
              <th className='border border-black p-2 text-center w-24'>
                Waktu
              </th>
              {DAYS.map((d) => (
                <th
                  key={d}
                  className='border border-black p-2 text-center font-bold'
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
              const times = PERIOD_TIMES[period] || { start: '', end: '' };
              return (
                <tr key={period}>
                  <td className='border border-black p-2 text-center font-bold'>
                    {period}
                  </td>
                  <td className='border border-black p-2 text-center'>
                    {times.start} - {times.end}
                  </td>
                  {DAYS.map((day) => {
                    const slot = teachingSlots.find(
                      (s) => s.day === day && s.period === period,
                    );
                    return (
                      <td
                        key={day}
                        className='border border-black p-2 text-center'
                      >
                        {slot ? (
                          <div>
                            <div className='font-bold'>{slot.className}</div>
                            <div>{slot.subject}</div>
                            {slot.room && (
                              <div className='text-[10px]'>({slot.room})</div>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className='pt-8 text-xs break-inside-avoid'>
          <div className='grid grid-cols-2 gap-8'>
            {/* Kolom Kiri: Pengesahan Kepala Sekolah */}
            <div className='w-full max-w-[280px] space-y-1.5 text-left'>
              {/* Baris 1: Mengetahui, */}
              <p className='font-bold h-6 flex items-center'>
                Mengetahui,
              </p>
              {/* Baris 2: Jabatan */}
              <p className='font-bold h-6 flex items-center'>
                {sigSettings.supervisorTitle || 'Kepala Sekolah'}
              </p>
              {/* Baris 3: Ruang Tanda Tangan */}
              <div className='h-16' />
              {/* Baris 4: Nama */}
              <p className='font-bold underline h-6 flex items-center'>
                {sigSettings.supervisorName ||
                  profile?.principalName ||
                  '................................'}
              </p>
              {/* Baris 5: NIP */}
              <div className='flex items-center gap-1 h-5'>
                <span>NIP/NUPTK.</span>
                <span>
                  {sigSettings.supervisorNip ||
                    profile?.principalNip ||
                    '................................'}
                </span>
              </div>
            </div>

            {/* Kolom Kanan: Guru (Rata Kanan) */}
            <div className='flex justify-end'>
              <div className='w-full max-w-[280px] space-y-1.5 flex flex-col items-end text-right'>
                {/* Baris 1: Tempat & Tanggal */}
                <p className='font-bold h-6 flex items-center justify-end w-full text-right'>
                  {sigSettings.place ? `${sigSettings.place}, ` : ''}
                  {sigSettings.date ||
                    new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                </p>
                {/* Baris 2: Jabatan */}
                <p className='font-bold h-6 flex items-center justify-end w-full text-right'>
                  {sigSettings.teacherTitle || 'Guru Mata Pelajaran / Wali Kelas'}
                </p>
                {/* Baris 3: Ruang Tanda Tangan */}
                <div className='h-16' />
                {/* Baris 4: Nama */}
                <p className='font-bold underline h-6 flex items-center justify-end w-full text-right'>
                  {sigSettings.teacherName ||
                    profile?.name ||
                    '................................'}
                </p>
                {/* Baris 5: NIP */}
                <div className='flex items-center justify-end gap-1 h-5 w-full text-right'>
                  <span>NIP/NUPTK.</span>
                  <span>
                    {sigSettings.teacherNip ||
                      profile?.nip ||
                      '................................'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ADD / EDIT TEACHING SLOT */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className='bg-white border-slate-200 text-slate-900 rounded-2xl max-w-md p-6 shadow-2xl'>
          <form onSubmit={handleFormSubmit}>
            <DialogHeader>
              <DialogTitle className='text-base font-bold text-slate-900 flex items-center gap-2'>
                <CalendarClock className='h-5 w-5 text-emerald-600' />
                <span>
                  {editingSlotId
                    ? 'Edit Jadwal Mengajar'
                    : 'Tambah Jadwal Mengajar'}
                </span>
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-500'>
                Plotting alokasi hari, jam pelajaran, kelas, dan mata pelajaran
                tatap muka Anda.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              {/* Hari & Jam Ke- */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <Label className='text-slate-700 font-bold text-xs'>
                    Hari
                  </Label>
                  <Select
                    value={formData.day}
                    onValueChange={(val) => {
                      if (val)
                        setFormData((prev) => ({ ...prev, day: val as any }));
                    }}
                  >
                    <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs'>
                      <SelectValue placeholder='Pilih Hari' />
                    </SelectTrigger>
                    <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                      {DAYS.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-slate-700 font-bold text-xs'>
                    Jam Ke-
                  </Label>
                  <Select
                    value={String(formData.period)}
                    onValueChange={handlePeriodChange}
                  >
                    <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs'>
                      <SelectValue placeholder='Jam Ke-' />
                    </SelectTrigger>
                    <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                        <SelectItem key={p} value={String(p)}>
                          Jam ke-{p} ({PERIOD_TIMES[p]?.start} -{' '}
                          {PERIOD_TIMES[p]?.end})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kelas & Mata Pelajaran */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <Label className='text-slate-700 font-bold text-xs'>
                    Kelas Mengajar
                  </Label>
                  <Select
                    value={formData.className}
                    onValueChange={(val) => {
                      if (val)
                        setFormData((prev) => ({ ...prev, className: val }));
                    }}
                  >
                    <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs'>
                      <SelectValue placeholder='Pilih Kelas' />
                    </SelectTrigger>
                    <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                      {teacherClasses.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-slate-700 font-bold text-xs'>
                    Mata Pelajaran
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(val) => {
                      if (val)
                        setFormData((prev) => ({ ...prev, subject: val }));
                    }}
                  >
                    <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 text-xs'>
                      <SelectValue placeholder='Pilih Mapel' />
                    </SelectTrigger>
                    <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ruangan / Lokasi */}
              <div className='space-y-1.5'>
                <Label className='text-slate-700 font-bold text-xs'>
                  Ruangan / Tempat{' '}
                  <span className='text-slate-400 font-normal'>(Opsional)</span>
                </Label>
                <Input
                  placeholder='Contoh: Ruang 7A, Lab Komputer, Lapangan...'
                  value={formData.room}
                  onChange={(e) =>
                    setFormData({ ...formData, room: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-10 text-xs'
                />
              </div>
            </div>

            <DialogFooter className='pt-2 flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setModalOpen(false)}
                className='border-slate-200 text-slate-700 rounded-xl h-10 text-xs font-semibold cursor-pointer'
              >
                Batal
              </Button>
              <Button
                type='submit'
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-10 text-xs px-5 shadow-xs cursor-pointer'
              >
                {editingSlotId ? 'Simpan Perubahan' : 'Tambahkan ke Jadwal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
