'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJournals,
  getJournalHeader,
  saveJournalHeader,
  createJournal,
  updateJournal,
  deleteJournal,
} from '@/actions/journalActions';
import { getAttendanceByDate } from '@/actions/attendanceActions';
import { exportJournalToExcel } from '@/lib/excelExport';
import { toast } from 'sonner';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Printer,
  Search,
  Loader2,
  Settings2,
  UserCheck,
  BookMarked,
  FileText,
  Activity,
  CheckCircle2,
  Upload,
  RotateCcw,
  ImageIcon,
  School,
} from 'lucide-react';
import { getProfile } from '@/actions/profileActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import ConfirmDialog from '@/components/ConfirmDialog';

interface JournalEntry {
  _id: string;
  date: string;
  meetingNo: number;
  subject?: string;
  basicCompetency: string;
  material: string;
  learningActivity: string;
  absentS: number;
  absentI: number;
  absentA: number;
  notes?: string;
}

type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';

interface StudentAttendanceItem {
  studentId: string;
  name: string;
  nis: string;
  className?: string;
  gender?: string;
  status: AttendanceStatus;
}

export default function JurnalClient() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // View Tab State (Data Management vs A4 Print Live Preview)
  const [activeViewTab, setActiveViewTab] = useState<'data' | 'preview'>(
    'data',
  );

  // Interactive Document Header Title & Subtitle State for A4 Live Preview
  const [docHeaderTitle, setDocHeaderTitle] = useState(
    'AGENDA JURNAL HARIAN KBM',
  );
  const [docHeaderSubtitle, setDocHeaderSubtitle] = useState(
    'SEMESTER I (GANJIL) TAHUN PELAJARAN 2026/2027',
  );

  // Preset Kop Resmi Khusus SLB Purnama Asih
  const SLB_PURNAMA_ASIH_KOP = {
    logoUrl: '/logo-resmi-slb.png',
    schoolName: 'SEKOLAH LUAR BIASA PURNAMA ASIH',
    subHeader1: 'SATUAN PENDIDIKAN TKLB, SDLB, SMPLB, SMALB',
    subHeader2: 'Izin Kanwil Depdikbud Jawa Barat No. 293/I.02.3/T./17-4-1985',
    subHeader3: 'Registrasi Nomor : 421.9/1761-Disdik Tanggal 01 Mei 2007',
    addressLine:
      'Jl. Villa Duta No. 2 Desa Ciwaruga Kec. Parongpong Telp. (022) 2014794',
    cityRegency: 'KABUPATEN BANDUNG BARAT',
  };

  // Dynamic Document Header State (Kop Surat Resmi Dinas / Lembaga - Default Generik)
  const [docHeader, setDocHeader] = useState({
    useOfficialKop: false,
    logoUrl: '/icon.svg',
    schoolName: '',
    subHeader1: '',
    subHeader2: '',
    subHeader3: '',
    addressLine: '',
    cityRegency: '',
  });

  // Dynamic Interactive Signature Block State (Matching refined Absensi format)
  const [signatureData, setSignatureData] = useState({
    place: 'Bandung',
    date: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    supervisorTitle: 'Kepala Sekolah',
    supervisorName: '',
    supervisorNip: '-',
    teacherTitle: 'Guru Kelas / Wali Kelas',
    teacherName: '',
    teacherNip: '-',
  });

  const updateDocHeader = (
    updater:
      | Partial<typeof docHeader>
      | ((prev: typeof docHeader) => typeof docHeader),
  ) => {
    setDocHeader((prev) => {
      const next =
        typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem('smart_class_kop_settings', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const updateSignatureData = (
    updater:
      | Partial<typeof signatureData>
      | ((prev: typeof signatureData) => typeof signatureData),
  ) => {
    setSignatureData((prev) => {
      const next =
        typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      try {
        localStorage.setItem('smart_class_sig_settings', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran logo maksimal 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateDocHeader({ logoUrl: reader.result });
        toast.success('Logo sekolah berhasil diperbarui!');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    const isSlb =
      profile?.schoolName?.toLowerCase().includes('purnama asih') ||
      docHeader.schoolName?.toLowerCase().includes('purnama asih');
    const defaultLogo = isSlb ? '/logo-resmi-slb.png' : '/icon.svg';
    updateDocHeader({ logoUrl: defaultLogo });
    toast.success('Logo dikembalikan ke logo default.');
  };

  // Dialog States
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form States for Journal Entry
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [meetingNo, setMeetingNo] = useState<number>(1);
  const [basicCompetency, setBasicCompetency] = useState('');
  const [material, setMaterial] = useState('');
  const [learningActivity, setLearningActivity] = useState('');

  // Student Attendance States
  const [studentAttendanceList, setStudentAttendanceList] = useState<
    StudentAttendanceItem[]
  >([]);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // Header State
  const [headerForm, setHeaderForm] = useState({
    schoolName: '',
    subject: 'Mata Pelajaran',
    classNameSemester: '',
    academicYear: '2026/2027',
    curriculum: 'Kurikulum Merdeka',
    teacherName: '',
    nip: '-',
  });

  // Queries
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });

  const { data: journals, isLoading: isJournalsLoading } = useQuery<
    JournalEntry[]
  >({
    queryKey: ['journals'],
    queryFn: () => getJournals(),
  });

  const { data: headerData, isLoading: isHeaderLoading } = useQuery({
    queryKey: ['journalHeader'],
    queryFn: () => getJournalHeader(),
  });

  // Load saved kop settings & signature from localStorage on client mount
  React.useEffect(() => {
    try {
      const savedKop = localStorage.getItem('smart_class_kop_settings');
      if (savedKop) {
        const parsedKop = JSON.parse(savedKop);
        setDocHeader((prev) => ({ ...prev, ...parsedKop }));
      }
      const savedSig = localStorage.getItem('smart_class_sig_settings');
      if (savedSig) {
        const parsedSig = JSON.parse(savedSig);
        if (
          parsedSig.supervisorTitle === 'Kepala Sekolah' ||
          parsedSig.supervisorTitle === 'Mengetahui,'
        ) {
          parsedSig.supervisorTitle = 'Kepala Sekolah';
        }
        setSignatureData((prev) => ({ ...prev, ...parsedSig }));
      }
    } catch (e) {}
  }, []);

  // Keep headerForm synced with fetched header & profile
  React.useEffect(() => {
    const activeClass = profile?.activeClass || profile?.className || '';
    const school = profile?.schoolName || headerData?.schoolName || '';
    const teacherName = profile?.name || headerData?.teacherName || '';
    const teacherNip =
      profile?.nip && profile.nip !== '-'
        ? profile.nip
        : headerData?.nip && headerData.nip !== '-'
          ? headerData.nip
          : '-';
    const principalName =
      profile?.principalName || headerData?.principalName || '';
    const principalNip =
      profile?.principalNip && profile.principalNip !== '-'
        ? profile.principalNip
        : headerData?.principalNip && headerData.principalNip !== '-'
          ? headerData.principalNip
          : '-';

    setHeaderForm((prev) => ({
      schoolName: school || prev.schoolName,
      subject: headerData?.subject || prev.subject || 'Mata Pelajaran',
      classNameSemester:
        headerData?.classNameSemester &&
        !headerData.classNameSemester.includes('XTKJ')
          ? headerData.classNameSemester
          : activeClass
            ? `Kelas ${activeClass} / Ganjil`
            : prev.classNameSemester,
      academicYear:
        headerData?.academicYear || prev.academicYear || '2026/2027',
      curriculum:
        headerData?.curriculum || prev.curriculum || 'Kurikulum Merdeka',
      teacherName: teacherName || prev.teacherName,
      nip: teacherNip || prev.nip,
    }));

    if (headerData?.academicYear) {
      setDocHeaderSubtitle(
        `SEMESTER I (GANJIL) TAHUN PELAJARAN ${headerData.academicYear}`,
      );
    }

    if (school && !docHeader.schoolName) {
      setDocHeader((prev) => ({
        ...prev,
        schoolName: prev.schoolName || school,
      }));
    }

    setSignatureData((prev) => ({
      ...prev,
      supervisorName: prev.supervisorName || principalName,
      supervisorNip:
        prev.supervisorNip !== '-' ? prev.supervisorNip : principalNip,
      teacherName: prev.teacherName || teacherName,
      teacherNip: prev.teacherNip !== '-' ? prev.teacherNip : teacherNip,
    }));
  }, [headerData, profile]);

  // Load student attendance for target date
  const loadStudentAttendance = async (dateStr: string) => {
    setIsFetchingAttendance(true);
    try {
      const records = await getAttendanceByDate(dateStr);
      setStudentAttendanceList(records || []);
    } catch (err) {
      console.error('Error fetching student attendance:', err);
    } finally {
      setIsFetchingAttendance(false);
    }
  };

  // Handle Date Change -> load attendance
  const handleDateChange = async (newDateStr: string) => {
    setFormDate(newDateStr);
    await loadStudentAttendance(newDateStr);
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingEntry(null);
    const todayStr = new Date().toISOString().split('T')[0];
    setFormDate(todayStr);

    // Auto calculate meeting number
    const maxMeeting =
      journals && journals.length > 0
        ? Math.max(...journals.map((j) => j.meetingNo || 0))
        : 0;
    setMeetingNo(maxMeeting + 1);

    setBasicCompetency('');
    setMaterial('');
    setLearningActivity('');
    setAttendanceSearch('');
    setJournalModalOpen(true);

    loadStudentAttendance(todayStr);
  };

  // Open modal for Edit
  const handleOpenEditModal = (entry: JournalEntry) => {
    setEditingEntry(entry);
    const dStr = new Date(entry.date).toISOString().split('T')[0];
    setFormDate(dStr);
    setMeetingNo(entry.meetingNo);
    setBasicCompetency(entry.basicCompetency);
    setMaterial(entry.material);
    setLearningActivity(entry.learningActivity);
    setAttendanceSearch('');
    setJournalModalOpen(true);

    loadStudentAttendance(dStr);
  };

  // Student Attendance Handlers
  const handleStudentStatusChange = (
    studentId: string,
    status: AttendanceStatus,
  ) => {
    setStudentAttendanceList((prev) =>
      prev.map((st) => (st.studentId === studentId ? { ...st, status } : st)),
    );
  };

  const handleMarkAllHadir = () => {
    setStudentAttendanceList((prev) =>
      prev.map((st) => ({ ...st, status: 'Hadir' })),
    );
    toast.success('Semua siswa ditandai Hadir');
  };

  // Calculated attendance metrics
  const currentCounts = React.useMemo(() => {
    const hadir = studentAttendanceList.filter(
      (s) => s.status === 'Hadir',
    ).length;
    const sakit = studentAttendanceList.filter(
      (s) => s.status === 'Sakit',
    ).length;
    const izin = studentAttendanceList.filter(
      (s) => s.status === 'Izin',
    ).length;
    const alfa = studentAttendanceList.filter(
      (s) => s.status === 'Alfa',
    ).length;
    return { hadir, sakit, izin, alfa };
  }, [studentAttendanceList]);

  const generatedNotes = React.useMemo(() => {
    const nonHadir = studentAttendanceList.filter((s) => s.status !== 'Hadir');
    if (nonHadir.length === 0) return '';
    return nonHadir.map((s) => `${s.name} (${s.status})`).join(', ');
  }, [studentAttendanceList]);

  const filteredStudentList = React.useMemo(() => {
    if (!attendanceSearch.trim()) return studentAttendanceList;
    const q = attendanceSearch.toLowerCase();
    return studentAttendanceList.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        (st.nis && st.nis.toLowerCase().includes(q)),
    );
  }, [studentAttendanceList, attendanceSearch]);

  // Save Header Mutation
  const saveHeaderMutation = useMutation({
    mutationFn: saveJournalHeader,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalHeader'] });
      toast.success('Informasi header jurnal berhasil disimpan!');
      setHeaderModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan header jurnal.');
    },
  });

  // Create / Update Journal Mutation
  const saveJournalMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        date: formDate,
        meetingNo,
        subject: headerForm.subject,
        basicCompetency,
        material,
        learningActivity,
        absentS: currentCounts.sakit,
        absentI: currentCounts.izin,
        absentA: currentCounts.alfa,
        notes: generatedNotes,
        attendanceRecords: studentAttendanceList.map((s) => ({
          studentId: s.studentId,
          status: s.status,
        })),
      };

      if (editingEntry) {
        return await updateJournal(editingEntry._id, payload);
      } else {
        return await createJournal(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success(
        editingEntry
          ? 'Catatan jurnal berhasil diperbarui!'
          : 'Catatan jurnal berhasil ditambahkan!',
      );
      setJournalModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan jurnal.');
    },
  });

  // Delete Mutation
  const deleteJournalMutation = useMutation({
    mutationFn: (id: string) => deleteJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      toast.success('Jurnal berhasil dihapus.');
      setDeleteId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menghapus jurnal.');
    },
  });

  // Export Excel
  const handleExportExcel = async () => {
    if (!journals || journals.length === 0) {
      toast.error('Tidak ada data jurnal untuk diekspor!');
      return;
    }
    toast.promise(exportJournalToExcel(headerForm, journals), {
      loading: 'Menyusun laporan Excel Jurnal Wali Kelas...',
      success: 'Excel Jurnal Wali Kelas berhasil diunduh!',
      error: 'Gagal mengunduh Excel.',
    });
  };

  // Filter Journals
  const filteredJournals =
    journals?.filter((j) => {
      const search = searchTerm.toLowerCase();
      const formattedDate = new Date(j.date)
        .toLocaleDateString('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        .toLowerCase();

      return (
        formattedDate.includes(search) ||
        j.basicCompetency.toLowerCase().includes(search) ||
        j.material.toLowerCase().includes(search) ||
        j.learningActivity.toLowerCase().includes(search) ||
        (j.notes && j.notes.toLowerCase().includes(search)) ||
        j.meetingNo.toString().includes(search)
      );
    }) || [];

  // Totals for stats
  const totalEntries = journals?.length || 0;
  const totalS =
    journals?.reduce((acc, curr) => acc + (curr.absentS || 0), 0) || 0;
  const totalI =
    journals?.reduce((acc, curr) => acc + (curr.absentI || 0), 0) || 0;
  const totalA =
    journals?.reduce((acc, curr) => acc + (curr.absentA || 0), 0) || 0;
  const totalAbsences = totalS + totalI + totalA;

  const thisMonthCount = React.useMemo(() => {
    if (!journals) return 0;
    const now = new Date();
    return journals.filter((j) => {
      const d = new Date(j.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [journals]);

  const monthlyChartData = React.useMemo(() => {
    if (!journals || journals.length === 0) return [];
    const map = new Map<
      string,
      {
        month: string;
        Pertemuan: number;
        Sakit: number;
        Izin: number;
        Alpha: number;
      }
    >();

    journals.forEach((j) => {
      const d = new Date(j.date);
      const key = d.toLocaleDateString('id-ID', {
        month: 'short',
        year: '2-digit',
      });
      const current = map.get(key) || {
        month: key,
        Pertemuan: 0,
        Sakit: 0,
        Izin: 0,
        Alpha: 0,
      };
      current.Pertemuan += 1;
      current.Sakit += j.absentS || 0;
      current.Izin += j.absentI || 0;
      current.Alpha += j.absentA || 0;
      map.set(key, current);
    });

    return Array.from(map.values());
  }, [journals]);

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header Bar - Always Visible */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5 sm:gap-3'>
            <span>Jurnal Wali Kelas</span>
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Pencatatan agenda harian mengajar guru, materi, KBM, dan
            rekapitulasi ketidakhadiran siswa.
          </p>
        </div>

        <div className='relative flex flex-wrap items-center gap-2.5'>
          <Button
            onClick={handleOpenCreateModal}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer'
          >
            <Plus className='h-4 w-4' />
            Tambah Jurnal
          </Button>
        </div>
      </div>

      {/* Top View Mode Navigation Tabs (Matching UI reference) */}
      <div className='grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-200/80 border border-slate-300/80 rounded-2xl w-full sm:w-fit print:hidden'>
        <button
          onClick={() => setActiveViewTab('data')}
          className={`flex items-center justify-center text-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer w-full sm:w-auto ${
            activeViewTab === 'data'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className='h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0' />
          <span className='truncate'>Data Jurnal & Rekap</span>
        </button>
        <button
          onClick={() => setActiveViewTab('preview')}
          className={`flex items-center justify-center text-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer w-full sm:w-auto ${
            activeViewTab === 'preview'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className='h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0' />
          <span className='truncate'>Pratinjau Cetak (A4 PDF)</span>
        </button>
      </div>

      {activeViewTab === 'preview' ? (
        /* ==================== LIVE PREVIEW CETAK (A4 PDF) MODE ==================== */
        <div className='space-y-6'>
          {/* Live Preview Control Bar (Matching user reference UI header bar) */}
          <div className='bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs print:hidden'>
            <div className='flex items-center gap-3'>
              <div className='p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h3 className='text-sm sm:text-base font-extrabold text-slate-900'>
                    Live Preview Cetak Agenda Jurnal Wali Kelas
                  </h3>
                  <span className='text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider'>
                    FORMAT A4 PDF
                  </span>
                </div>
                <p className='text-xs text-slate-500 mt-0.5'>
                  Tampilan pratinjau langsung dokumen A4 siap cetak dengan tata
                  letak resmi dan blok tanda tangan.
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2.5 shrink-0'>
              <Button
                onClick={() => setHeaderModalOpen(true)}
                variant='outline'
                className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs cursor-pointer'
              >
                <Settings2 className='h-4 w-4 text-emerald-600' />
                Edit Kop & TTD
              </Button>
              <Button
                onClick={() => window.print()}
                variant='outline'
                className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-4.5 gap-2 shadow-xs cursor-pointer'
              >
                <Printer className='h-4 w-4 text-blue-600' />
                Cetak PDF
              </Button>
            </div>
          </div>

          {/* Centered A4 Document Canvas Container */}
          <div className='bg-slate-200/70 p-4 sm:p-10 rounded-2xl border border-slate-300/80 overflow-x-auto min-h-[900px] flex justify-center shadow-inner print:p-0 print:m-0 print:bg-white print:border-none print:min-h-0'>
            <div className='w-full max-w-[850px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-14 print:p-0 print:m-0 print:shadow-none print:border-none print:w-full print:max-w-none print:text-black font-sans leading-relaxed print:overflow-visible'>
              {/* Document KOP / Interactive Header Title */}
              {docHeader.useOfficialKop ? (
                <div className='mb-6'>
                  <div className='flex items-center justify-between gap-3 sm:gap-4'>
                    {/* Left: School Emblem / Circular Logo */}
                    <div className='w-28 sm:w-32 shrink-0 flex flex-col items-center justify-center relative group'>
                      <img
                        src={docHeader.logoUrl || '/icon.svg'}
                        alt='Logo Sekolah'
                        className='w-28 h-28 sm:w-[124px] sm:h-[124px] object-contain transition-transform group-hover:scale-105'
                      />
                      {/* Floating edit button on hover (hidden in print) */}
                      <label
                        htmlFor='quick-logo-upload-jurnal'
                        className='absolute inset-0 bg-black/40 text-white text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity print:hidden'
                        title='Klik untuk ganti logo'
                      >
                        <Upload className='h-4 w-4 mb-0.5' />
                        <span>Ganti</span>
                      </label>
                      <input
                        id='quick-logo-upload-jurnal'
                        type='file'
                        accept='image/*'
                        onChange={handleLogoUpload}
                        className='hidden'
                      />
                    </div>

                    {/* Center: Official Letterhead Text Block (Times New Roman / Serif style) */}
                    <div className='flex-1 text-center font-serif text-slate-900 print:text-black space-y-[2px] px-1'>
                      {/* Baris 1: Nama Sekolah / Yayasan */}
                      {Boolean(
                        docHeader.schoolName && docHeader.schoolName.trim(),
                      ) && (
                        <input
                          value={docHeader.schoolName}
                          onChange={(e) =>
                            updateDocHeader({ schoolName: e.target.value })
                          }
                          className='w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-emerald-50/20 p-0 text-center outline-none transition-all print:border-none print:p-0 font-serif font-bold uppercase text-base sm:text-xl md:text-[22px] text-slate-900 print:text-black leading-tight tracking-normal'
                          placeholder='NAMA YAYASAN / DINAS PENDIDIKAN'
                        />
                      )}
                      {/* Baris 2: Satuan Pendidikan */}
                      {Boolean(
                        docHeader.subHeader1 && docHeader.subHeader1.trim(),
                      ) && (
                        <input
                          value={docHeader.subHeader1}
                          onChange={(e) =>
                            updateDocHeader({ subHeader1: e.target.value })
                          }
                          className='w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-emerald-50/20 p-0 text-center outline-none transition-all print:border-none print:p-0 font-serif font-normal uppercase text-xs sm:text-sm md:text-[14.5px] text-slate-900 print:text-black leading-tight tracking-normal'
                          placeholder='SATUAN PENDIDIKAN / NAMA SEKOLAH'
                        />
                      )}
                      {/* Baris 3: Izin Kanwil */}
                      {Boolean(
                        docHeader.subHeader2 && docHeader.subHeader2.trim(),
                      ) && (
                        <input
                          value={docHeader.subHeader2}
                          onChange={(e) =>
                            updateDocHeader({ subHeader2: e.target.value })
                          }
                          className='w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-emerald-50/20 p-0 text-center outline-none transition-all print:border-none print:p-0 font-serif font-normal text-[11px] sm:text-xs md:text-[13px] text-slate-800 print:text-black leading-tight'
                          placeholder='Izin Operasional / NPSN'
                        />
                      )}
                      {/* Baris 4: Nomor Registrasi */}
                      {Boolean(
                        docHeader.subHeader3 && docHeader.subHeader3.trim(),
                      ) && (
                        <input
                          value={docHeader.subHeader3}
                          onChange={(e) =>
                            updateDocHeader({ subHeader3: e.target.value })
                          }
                          className='w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-emerald-50/20 p-0 text-center outline-none transition-all print:border-none print:p-0 font-serif font-normal text-[11px] sm:text-xs md:text-[13px] text-slate-800 print:text-black leading-tight'
                          placeholder='Nomor Registrasi / SK Akreditasi'
                        />
                      )}
                      {/* Baris 5: Alamat & Kontak */}
                      {Boolean(
                        docHeader.addressLine && docHeader.addressLine.trim(),
                      ) && (
                        <input
                          value={docHeader.addressLine}
                          onChange={(e) =>
                            updateDocHeader({ addressLine: e.target.value })
                          }
                          className='w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-emerald-50/20 p-0 text-center outline-none transition-all print:border-none print:p-0 font-serif font-normal text-[11px] sm:text-xs md:text-[13px] text-slate-800 print:text-black leading-tight'
                          placeholder='Alamat Lengkap & Kontak'
                        />
                      )}
                      {/* Baris 6: Kabupaten / Kota */}
                      {Boolean(
                        docHeader.cityRegency && docHeader.cityRegency.trim(),
                      ) && (
                        <input
                          value={docHeader.cityRegency}
                          onChange={(e) =>
                            updateDocHeader({ cityRegency: e.target.value })
                          }
                          className='w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-emerald-600 focus:bg-emerald-50/20 p-0 text-center outline-none transition-all print:border-none print:p-0 font-serif font-bold uppercase text-xs sm:text-sm md:text-[14.5px] text-slate-900 print:text-black leading-tight tracking-normal'
                          placeholder='KABUPATEN / KOTA'
                        />
                      )}
                      {!docHeader.schoolName?.trim() &&
                        !docHeader.subHeader1?.trim() &&
                        !docHeader.subHeader2?.trim() &&
                        !docHeader.subHeader3?.trim() &&
                        !docHeader.addressLine?.trim() &&
                        !docHeader.cityRegency?.trim() && (
                          <div className='py-4 text-center text-slate-400 text-xs italic print:hidden'>
                            *Kop surat dinas masih kosong. Klik tombol
                            &quot;Edit Kop &amp; TTD&quot; untuk mengisi teks
                            kop surat.
                          </div>
                        )}
                    </div>

                    {/* Right spacer for centering symmetry */}
                    <div
                      className='w-28 sm:w-32 shrink-0 hidden sm:block pointer-events-none'
                      aria-hidden='true'
                    />
                  </div>

                  {/* Official Double Line Divider */}
                  <div className='mt-2.5 mb-4 space-y-[2px] print:mt-1.5 print:mb-3'>
                    <div className='border-b-[3px] border-black' />
                    <div className='border-b border-black' />
                  </div>

                  {/* Report Title & Subtitle */}
                  <div className='text-center space-y-1 mb-4'>
                    <Input
                      value={docHeaderTitle}
                      onChange={(e) => setDocHeaderTitle(e.target.value)}
                      className='text-center font-black uppercase tracking-wider text-base sm:text-2xl text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-auto py-1 outline-none transition-all print:border-none print:p-0 bg-transparent w-full font-sans'
                      placeholder='AGENDA JURNAL HARIAN KBM'
                    />
                    <Input
                      value={docHeaderSubtitle}
                      onChange={(e) => setDocHeaderSubtitle(e.target.value)}
                      className='text-center font-bold uppercase text-xs sm:text-sm text-slate-800 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-auto py-1 outline-none transition-all print:border-none print:p-0 bg-transparent w-full mt-1 font-sans'
                      placeholder='SEMESTER I (GANJIL) TAHUN PELAJARAN 2026/2027'
                    />
                  </div>
                </div>
              ) : (
                <div className='text-center mb-8 border-b-2 border-slate-900 pb-4 print:border-black space-y-1'>
                  <Input
                    value={docHeaderTitle}
                    onChange={(e) => setDocHeaderTitle(e.target.value)}
                    className='text-center font-black uppercase tracking-wider text-base sm:text-2xl text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-auto py-1 outline-none transition-all print:border-none print:p-0 bg-transparent w-full font-sans'
                    placeholder='AGENDA JURNAL HARIAN KBM'
                  />
                  <Input
                    value={docHeaderSubtitle}
                    onChange={(e) => setDocHeaderSubtitle(e.target.value)}
                    className='text-center font-bold uppercase text-xs sm:text-sm text-slate-800 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-auto py-1 outline-none transition-all print:border-none print:p-0 bg-transparent w-full mt-1 font-sans'
                    placeholder='SEMESTER I (GANJIL) TAHUN PELAJARAN 2026/2027'
                  />
                </div>
              )}

              {/* Document Metadata Grid */}
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8 text-xs font-semibold text-slate-800 print:text-black mb-6 border-b border-slate-200 pb-4 print:border-zinc-300'>
                <div className='space-y-1.5'>
                  <div className='flex'>
                    <span className='w-32 text-slate-500 font-bold shrink-0 print:text-black'>
                      Nama Sekolah
                    </span>
                    <span className='font-bold text-slate-900 print:text-black'>
                      : {headerForm.schoolName || '-'}
                    </span>
                  </div>
                  <div className='flex'>
                    <span className='w-32 text-slate-500 font-bold shrink-0 print:text-black'>
                      Kelas / Semester
                    </span>
                    <span className='font-bold text-slate-900 print:text-black'>
                      : {headerForm.classNameSemester || '-'}
                    </span>
                  </div>
                  <div className='flex'>
                    <span className='w-32 text-slate-500 font-bold shrink-0 print:text-black'>
                      Mata Pelajaran
                    </span>
                    <span className='font-bold text-slate-900 print:text-black'>
                      : {headerForm.subject || '-'}
                    </span>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <div className='flex'>
                    <span className='w-32 text-slate-500 font-bold shrink-0 print:text-black'>
                      Kurikulum
                    </span>
                    <span className='font-bold text-slate-900 print:text-black'>
                      : {headerForm.curriculum || '-'}
                    </span>
                  </div>
                  <div className='flex'>
                    <span className='w-32 text-slate-500 font-bold shrink-0 print:text-black'>
                      Nama Guru
                    </span>
                    <span className='font-bold text-slate-900 print:text-black'>
                      : {headerForm.teacherName || '-'}
                    </span>
                  </div>
                  <div className='flex'>
                    <span className='w-32 text-slate-500 font-bold shrink-0 print:text-black'>
                      NIP/NUPTK Guru
                    </span>
                    <span className='font-bold text-slate-900 print:text-black'>
                      : {headerForm.nip || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table of Entries */}
              <div className='overflow-x-auto mb-8'>
                <table className='w-full border-collapse border border-slate-900 text-xs text-left print:border-black'>
                  <thead>
                    <tr className='bg-slate-100 print:bg-zinc-200 border-b border-slate-900 font-bold text-slate-900 print:text-black print:border-black text-[11px]'>
                      <th className='border border-slate-900 p-2 text-center w-8 print:border-black'>
                        NO
                      </th>
                      <th className='border border-slate-900 p-2 w-28 print:border-black'>
                        HARI / TGL
                      </th>
                      <th className='border border-slate-900 p-2 text-center w-10 print:border-black'>
                        KE-
                      </th>
                      <th className='border border-slate-900 p-2 print:border-black'>
                        KD / CAPAIAN (TP)
                      </th>
                      <th className='border border-slate-900 p-2 print:border-black'>
                        MATERI KBM
                      </th>
                      <th className='border border-slate-900 p-2 print:border-black'>
                        KEGIATAN KBM
                      </th>
                      <th className='border border-slate-900 p-1 text-center w-16 print:border-black'>
                        ABSEN (S/I/A)
                      </th>
                      <th className='border border-slate-900 p-2 w-28 print:border-black'>
                        CATATAN / PARAF
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJournals && filteredJournals.length > 0 ? (
                      filteredJournals.map((j, idx) => {
                        const dStr = new Date(j.date).toLocaleDateString(
                          'id-ID',
                          {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                          },
                        );
                        const absSummary =
                          [
                            j.absentS > 0 ? `${j.absentS}S` : '',
                            j.absentI > 0 ? `${j.absentI}I` : '',
                            j.absentA > 0 ? `${j.absentA}A` : '',
                          ]
                            .filter(Boolean)
                            .join(' ') || '-';

                        return (
                          <tr
                            key={j._id}
                            className='border-b border-slate-900 print:border-black text-[11px]'
                          >
                            <td className='border border-slate-900 p-2 text-center font-bold print:border-black'>
                              {idx + 1}
                            </td>
                            <td className='border border-slate-900 p-2 font-semibold print:border-black'>
                              {dStr}
                            </td>
                            <td className='border border-slate-900 p-2 text-center font-bold print:border-black'>
                              {j.meetingNo}
                            </td>
                            <td className='border border-slate-900 p-2 whitespace-pre-line print:border-black'>
                              {j.basicCompetency}
                            </td>
                            <td className='border border-slate-900 p-2 whitespace-pre-line print:border-black'>
                              {j.material}
                            </td>
                            <td className='border border-slate-900 p-2 whitespace-pre-line print:border-black'>
                              {j.learningActivity}
                            </td>
                            <td className='border border-slate-900 p-1 text-center font-bold print:border-black'>
                              {absSummary}
                            </td>
                            <td className='border border-slate-900 p-2 italic text-slate-600 print:text-black print:border-black'>
                              {j.notes || '-'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={8}
                          className='border border-slate-900 p-4 text-center text-slate-500 italic'
                        >
                          Belum ada data jurnal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className='bg-slate-100 font-bold border-t-2 border-slate-900 print:bg-zinc-100 print:border-black text-[11px]'>
                      <td
                        colSpan={3}
                        className='border border-slate-900 p-2 text-center print:border-black'
                      >
                        JUMLAH PERTEMUAN: {totalEntries}
                      </td>
                      <td
                        colSpan={3}
                        className='border border-slate-900 p-2 text-right print:border-black'
                      >
                        TOTAL REKAP ABSENSI SISWA:
                      </td>
                      <td className='border border-slate-900 p-2 text-center print:border-black'>
                        S:{totalS} | I:{totalI} | A:{totalA}
                      </td>
                      <td className='border border-slate-900 p-2 text-center print:border-black'>
                        HER: {totalEntries}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Official Interactive Signature Section */}
              <div className='mt-12 pt-6 text-xs text-slate-900 print:text-black font-semibold break-inside-avoid'>
                <div className='grid grid-cols-2 gap-8'>
                  {/* Kolom Kiri: Pengesahan Kepala Sekolah */}
                  <div className='w-full max-w-[280px] sm:max-w-[320px] space-y-1.5 text-left'>
                    {/* Baris 1: Mengetahui, */}
                    <p className='font-bold text-xs h-6 flex items-center text-slate-800 print:text-black'>
                      Mengetahui,
                    </p>
                    {/* Baris 2: Jabatan Kepala Sekolah */}
                    <div className='hidden print:flex font-bold text-xs text-black h-6 items-center'>
                      {signatureData.supervisorTitle || 'Kepala Sekolah'}
                    </div>
                    <Input
                      value={signatureData.supervisorTitle}
                      placeholder='Kepala Sekolah'
                      onChange={(e) =>
                        updateSignatureData({
                          supervisorTitle: e.target.value,
                        })
                      }
                      className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full print:hidden'
                    />
                    {/* Baris 3: Ruang Tanda Tangan */}
                    <div className='h-20' />
                    {/* Baris 4: Nama Kepala Sekolah */}
                    <div className='hidden print:flex font-bold text-xs text-black h-6 items-center'>
                      {signatureData.supervisorName || '................................'}
                    </div>
                    <Input
                      placeholder='Ketik nama kepsek...'
                      value={signatureData.supervisorName}
                      onChange={(e) =>
                        updateSignatureData({
                          supervisorName: e.target.value,
                        })
                      }
                      className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full print:hidden'
                    />
                    {/* Baris 5: NIP Kepala Sekolah */}
                    <div className='hidden print:flex text-[11px] text-black h-5 items-center gap-1'>
                      <span>NIP/NUPTK.</span>
                      <span>{signatureData.supervisorNip || '................................'}</span>
                    </div>
                    <div className='flex items-center gap-1 text-[11px] text-slate-700 h-5 print:hidden'>
                      <span>NIP/NUPTK.</span>
                      <Input
                        placeholder='Ketik NIP...'
                        value={signatureData.supervisorNip}
                        onChange={(e) =>
                          updateSignatureData({
                            supervisorNip: e.target.value,
                          })
                        }
                        className='text-[11px] border-b border-slate-300 border-x-0 border-t-0 rounded-none h-5 px-0 focus:border-emerald-600 w-44'
                      />
                    </div>
                  </div>

                  {/* Kolom Kanan: Guru Kelas / Wali Kelas (Rata Kanan) */}
                  <div className='flex justify-end'>
                    <div className='w-full max-w-[280px] sm:max-w-[320px] space-y-1.5 flex flex-col items-end text-right'>
                      {/* Baris 1: Tempat & Tanggal (Sejajar dengan 'Mengetahui,') */}
                      <div className='h-6 flex items-center justify-end font-bold text-xs text-slate-900 print:text-black w-full'>
                        {/* Teks murni saat dicetak */}
                        <div className='hidden print:block text-right w-full'>
                          {signatureData.place ? `${signatureData.place}, ` : ''}
                          {signatureData.date}
                        </div>
                        {/* Input interaktif saat di layar */}
                        <div className='flex items-center justify-end gap-1 print:hidden w-full'>
                          <Input
                            value={signatureData.place}
                            onChange={(e) =>
                              updateSignatureData({
                                place: e.target.value,
                              })
                            }
                            style={{
                              width: `${Math.max((signatureData.place || '').length * 9 + 18, 95)}px`,
                              fieldSizing: 'content',
                            }}
                            className='font-bold text-xs text-right border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-1 focus:border-emerald-600'
                          />
                          <span>,</span>
                          <Input
                            value={signatureData.date}
                            onChange={(e) =>
                              updateSignatureData({
                                date: e.target.value,
                              })
                            }
                            style={{
                              width: `${Math.max((signatureData.date || '').length * 8.5 + 14, 135)}px`,
                              fieldSizing: 'content',
                            }}
                            className='font-bold text-xs text-right border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-1 focus:border-emerald-600'
                          />
                        </div>
                      </div>

                      {/* Baris 2: Jabatan Guru (Sejajar dengan 'Kepala Sekolah') */}
                      <div className='hidden print:flex font-bold text-xs text-black h-6 items-center justify-end w-full text-right'>
                        {signatureData.teacherTitle || 'Guru Kelas / Wali Kelas'}
                      </div>
                      <Input
                        value={signatureData.teacherTitle}
                        placeholder='Guru Kelas / Wali Kelas'
                        onChange={(e) =>
                          updateSignatureData({
                            teacherTitle: e.target.value,
                          })
                        }
                        className='font-bold text-xs text-right border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full print:hidden'
                      />

                      {/* Baris 3: Ruang Tanda Tangan */}
                      <div className='h-20' />

                      {/* Baris 4: Nama Guru (Sejajar dengan Nama Kepala Sekolah) */}
                      <div className='hidden print:flex font-bold text-xs text-black h-6 items-center justify-end w-full text-right'>
                        {signatureData.teacherName || headerForm.teacherName || '................................'}
                      </div>
                      <Input
                        value={
                          signatureData.teacherName || headerForm.teacherName
                        }
                        placeholder='Nama Guru...'
                        onChange={(e) => {
                          updateSignatureData({
                            teacherName: e.target.value,
                          });
                          setHeaderForm((prev) => ({
                            ...prev,
                            teacherName: e.target.value,
                          }));
                        }}
                        className='font-bold text-xs text-right border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full print:hidden'
                      />

                      {/* Baris 5: NIP Guru (Sejajar dengan NIP Kepala Sekolah) */}
                      {/* Teks murni saat dicetak agar rapi dan rata kanan sempurna */}
                      <div className='hidden print:flex text-[11px] text-black h-5 items-center justify-end w-full text-right'>
                        {signatureData.teacherNip || headerForm.nip
                          ? `NIP/NUPTK. ${signatureData.teacherNip || headerForm.nip}`
                          : 'NIP/NUPTK. -'}
                      </div>
                      {/* Input interaktif saat di layar */}
                      <div className='flex items-center justify-end gap-1 text-[11px] text-slate-700 h-5 w-full print:hidden'>
                        <span>NIP/NUPTK.</span>
                        <input
                          type='text'
                          value={signatureData.teacherNip || headerForm.nip}
                          placeholder='-'
                          onChange={(e) => {
                            updateSignatureData({
                              teacherNip: e.target.value,
                            });
                            setHeaderForm((prev) => ({
                              ...prev,
                              nip: e.target.value,
                            }));
                          }}
                          style={{
                            width: (signatureData.teacherNip || headerForm.nip)
                              ? `${Math.max((signatureData.teacherNip || headerForm.nip).length, 1) * 7.5 + 4}px`
                              : '28px',
                            fieldSizing: 'content',
                          }}
                          className='text-[11px] text-right border-b border-slate-300 border-x-0 border-t-0 rounded-none h-5 px-0 focus:border-emerald-600 bg-transparent outline-none'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== DATA MANAGEMENT & ANALYTICS MODE ==================== */
        <>
          {/* Overview Cards & Analytics Section (Print Hidden) */}
          <div className='space-y-4 print:hidden'>
            <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-4'>
              <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 sm:p-5 py-3.5 sm:py-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Total Pertemuan
                  </span>
                  <div className='p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700'>
                    <BookOpen className='h-4 w-4' />
                  </div>
                </div>
                <div className='mt-2'>
                  <div className='text-2xl font-bold tracking-tight text-slate-900 leading-none'>
                    {totalEntries} Kali
                  </div>
                  <p className='text-[10px] text-slate-500 mt-1'>
                    {thisMonthCount} pertemuan di bulan ini
                  </p>
                </div>
              </Card>

              <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 sm:p-5 py-3.5 sm:py-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Sakit (S)
                  </span>
                  <div className='p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700'>
                    <Activity className='h-4 w-4' />
                  </div>
                </div>
                <div className='mt-2'>
                  <div className='text-2xl font-bold tracking-tight text-slate-900 leading-none'>
                    {totalS} Siswa
                  </div>
                  <p className='text-[10px] text-slate-500 mt-1'>
                    Akumulasi siswa sakit
                  </p>
                </div>
              </Card>

              <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 sm:p-5 py-3.5 sm:py-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Izin (I)
                  </span>
                  <div className='p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700'>
                    <UserCheck className='h-4 w-4' />
                  </div>
                </div>
                <div className='mt-2'>
                  <div className='text-2xl font-bold tracking-tight text-slate-900 leading-none'>
                    {totalI} Siswa
                  </div>
                  <p className='text-[10px] text-slate-500 mt-1'>
                    Akumulasi siswa izin
                  </p>
                </div>
              </Card>

              <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-4 sm:p-5 py-3.5 sm:py-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                    Tanpa Keterangan (A)
                  </span>
                  <div className='p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700'>
                    <FileText className='h-4 w-4' />
                  </div>
                </div>
                <div className='mt-2'>
                  <div className='text-2xl font-bold tracking-tight text-slate-900 leading-none'>
                    {totalA} Siswa
                  </div>
                  <p className='text-[10px] text-slate-500 mt-1'>
                    Total tanpa keterangan
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Document Header Card */}
          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-6 relative overflow-hidden group'>
            <div className='flex items-center justify-center relative mb-6 border-b border-slate-200 pb-4'>
              <h1 className='text-xl font-extrabold text-slate-900 uppercase tracking-widest print:text-black print:text-2xl'>
                Jurnal Harian Guru
              </h1>
              <Button
                onClick={() => setHeaderModalOpen(true)}
                variant='ghost'
                size='sm'
                className='absolute right-0 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1.5 rounded-xl print:hidden'
              >
                <Settings2 className='h-3.5 w-3.5' />
                Edit Header
              </Button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-xs text-slate-700 print:text-black print:grid-cols-2 print:text-sm'>
              <div className='space-y-1.5'>
                <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
                  <span className='font-bold text-slate-500 print:text-black w-36'>
                    Sekolah
                  </span>
                  <span className='font-bold text-slate-900 print:text-black flex-1'>
                    : {headerForm.schoolName || '-'}
                  </span>
                </div>
                <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
                  <span className='font-bold text-slate-500 print:text-black w-36'>
                    Mata Pelajaran
                  </span>
                  <span className='font-bold text-slate-900 print:text-black flex-1'>
                    : {headerForm.subject || '-'}
                  </span>
                </div>
                <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
                  <span className='font-bold text-slate-500 print:text-black w-36'>
                    Kelas/Semester
                  </span>
                  <span className='font-bold text-slate-900 print:text-black flex-1'>
                    : {headerForm.classNameSemester || '-'}
                  </span>
                </div>
                <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
                  <span className='font-bold text-slate-500 print:text-black w-36'>
                    Tahun Pelajaran
                  </span>
                  <span className='font-bold text-slate-900 print:text-black flex-1'>
                    : {headerForm.academicYear || '-'}
                  </span>
                </div>
              </div>

              <div className='space-y-1.5'>
                <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
                  <span className='font-bold text-slate-500 print:text-black w-36'>
                    Kurikulum
                  </span>
                  <span className='font-bold text-slate-900 print:text-black flex-1'>
                    : {headerForm.curriculum || '-'}
                  </span>
                </div>
                <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
                  <span className='font-bold text-slate-500 print:text-black w-36'>
                    Nama Guru
                  </span>
                  <span className='font-bold text-slate-900 print:text-black flex-1'>
                    : {headerForm.teacherName || '-'}
                  </span>
                </div>
                <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
                  <span className='font-bold text-slate-500 print:text-black w-36'>
                    NIP/NUPTK
                  </span>
                  <span className='font-bold text-slate-900 print:text-black flex-1'>
                    : {headerForm.nip || '-'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Search Bar (Print Hidden) */}
          <div className='flex items-center gap-3 print:hidden'>
            <div className='relative flex-1'>
              <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
              <Input
                placeholder='Cari tanggal, KD, materi, atau kegiatan pembelajaran...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-10 shadow-xs'
              />
            </div>
          </div>

          {/* Main Journal Table */}
          <Card className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs print:border-none print:shadow-none print:bg-white'>
            <CardContent className='p-0'>
              {filteredJournals && filteredJournals.length > 0 ? (
                <div className='overflow-x-auto'>
                  <Table className='print:text-black print:border-collapse print:w-full'>
                    <TableHeader className='bg-slate-50/80 border-b border-slate-200 print:bg-zinc-200'>
                      <TableRow className='border-b border-slate-200 text-xs font-bold text-slate-700 print:text-black print:border-black'>
                        <TableHead
                          rowSpan={2}
                          className='w-12 text-center text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'
                        >
                          No
                        </TableHead>
                        <TableHead
                          rowSpan={2}
                          className='w-36 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'
                        >
                          Hari / Tanggal
                        </TableHead>
                        <TableHead
                          rowSpan={2}
                          className='w-24 text-center text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'
                        >
                          Pertemuan ke-
                        </TableHead>
                        <TableHead
                          rowSpan={2}
                          className='w-64 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'
                        >
                          Kompetensi Dasar / CP
                        </TableHead>
                        <TableHead
                          rowSpan={2}
                          className='w-52 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'
                        >
                          Materi Pembelajaran
                        </TableHead>
                        <TableHead
                          rowSpan={2}
                          className='w-64 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'
                        >
                          Kegiatan KBM
                        </TableHead>
                        <TableHead
                          colSpan={3}
                          className='text-center text-slate-700 font-bold border-b border-r border-slate-200 print:border-black print:text-black'
                        >
                          Absensi Siswa
                        </TableHead>
                        <TableHead
                          rowSpan={2}
                          className='w-48 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'
                        >
                          Catatan / Keterangan
                        </TableHead>
                        <TableHead
                          rowSpan={2}
                          className='w-24 text-center text-slate-700 font-bold print:hidden'
                        >
                          Aksi
                        </TableHead>
                      </TableRow>
                      <TableRow className='border-b border-slate-200 text-xs font-bold text-slate-700 print:text-black print:border-black'>
                        <TableHead className='w-10 text-center text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                          S
                        </TableHead>
                        <TableHead className='w-10 text-center text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                          I
                        </TableHead>
                        <TableHead className='w-10 text-center text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                          A
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredJournals.map((entry, index) => {
                        const formattedDate = new Date(
                          entry.date,
                        ).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        });

                        return (
                          <TableRow
                            key={entry._id}
                            className='border-b border-slate-100 hover:bg-slate-50/80 transition-colors text-xs print:border-black print:text-black'
                          >
                            <TableCell className='text-center font-medium text-slate-500 border-r border-slate-200 print:border-black print:text-black'>
                              {index + 1}
                            </TableCell>
                            <TableCell className='font-semibold text-slate-900 border-r border-slate-200 print:border-black print:text-black'>
                              {formattedDate}
                            </TableCell>
                            <TableCell className='text-center font-bold text-emerald-600 border-r border-slate-200 print:border-black print:text-black'>
                              {entry.meetingNo}
                            </TableCell>
                            <TableCell className='whitespace-pre-line text-slate-700 leading-relaxed border-r border-slate-200 print:border-black print:text-black'>
                              {entry.basicCompetency}
                            </TableCell>
                            <TableCell className='whitespace-pre-line text-slate-700 leading-relaxed border-r border-slate-200 print:border-black print:text-black'>
                              {entry.material}
                            </TableCell>
                            <TableCell className='whitespace-pre-line text-slate-700 leading-relaxed border-r border-slate-200 print:border-black print:text-black'>
                              {entry.learningActivity}
                            </TableCell>
                            <TableCell className='text-center font-bold text-amber-600 border-r border-slate-200 print:border-black print:text-black'>
                              {entry.absentS > 0 ? entry.absentS : ''}
                            </TableCell>
                            <TableCell className='text-center font-bold text-blue-600 border-r border-slate-200 print:border-black print:text-black'>
                              {entry.absentI > 0 ? entry.absentI : ''}
                            </TableCell>
                            <TableCell className='text-center font-bold text-rose-600 border-r border-slate-200 print:border-black print:text-black'>
                              {entry.absentA > 0 ? entry.absentA : ''}
                            </TableCell>
                            <TableCell className='whitespace-pre-line text-slate-500 italic border-r border-slate-200 print:border-black print:text-black'>
                              {entry.notes || '-'}
                            </TableCell>
                            <TableCell className='text-center print:hidden'>
                              <div className='flex items-center justify-center gap-1.5'>
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  onClick={() => handleOpenEditModal(entry)}
                                  className='h-7 w-7 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg'
                                >
                                  <Edit2 className='h-3.5 w-3.5' />
                                </Button>
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  onClick={() => setDeleteId(entry._id)}
                                  className='h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg'
                                >
                                  <Trash2 className='h-3.5 w-3.5' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center text-slate-500 max-w-md mx-auto'>
                  <BookMarked className='h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mb-2 shrink-0' />
                  <p className='text-sm sm:text-base font-extrabold text-slate-800 tracking-tight'>
                    Belum ada catatan jurnal.
                  </p>
                  <p className='text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed'>
                    Klik tombol "+ Tambah Jurnal" untuk mencatat agenda
                    pembelajaran harian Anda.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal Dialog: Add / Edit Journal */}
      <Dialog open={journalModalOpen} onOpenChange={setJournalModalOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-4xl lg:max-w-5xl max-h-[85vh] sm:max-h-[88vh] p-0 shadow-2xl overflow-hidden box-border flex flex-col'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveJournalMutation.mutate();
            }}
            className='flex flex-col h-full max-h-[85vh] sm:max-h-[88vh] overflow-hidden min-w-0 w-full'
          >
            <DialogHeader className='p-4 sm:p-6 pb-3 sm:pb-4 border-b border-slate-200 shrink-0 bg-white relative'>
              <DialogTitle className='text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 pr-8'>
                <BookOpen className='h-5 w-5 text-emerald-600 shrink-0' />
                <span>
                  {editingEntry
                    ? 'Edit Catatan Jurnal'
                    : 'Tambah Jurnal Harian Guru'}
                </span>
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-500 mt-0.5 pr-6'>
                Isi rincian pertemuan, materi, kegiatan pembelajaran, dan
                absensi siswa.
              </DialogDescription>
            </DialogHeader>

            <div className='flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5 box-border min-w-0 w-full'>
              {/* Row 1: Tanggal & Pertemuan ke */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0'>
                <div className='space-y-1.5 w-full min-w-0'>
                  <Label className='text-slate-700 text-xs font-semibold flex items-center justify-between'>
                    <span>Hari / Tanggal</span>
                    {isFetchingAttendance && (
                      <span className='text-[10px] text-emerald-600 flex items-center gap-1'>
                        <Loader2 className='h-3 w-3 animate-spin' /> Cek
                        Absensi...
                      </span>
                    )}
                  </Label>
                  <Input
                    type='date'
                    required
                    value={formDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className='w-full min-w-0 max-w-full bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-10 outline-none transition-all box-border'
                  />
                </div>

                <div className='space-y-1.5 w-full min-w-0'>
                  <Label className='text-slate-700 text-xs font-semibold'>
                    Pertemuan ke-
                  </Label>
                  <Input
                    type='number'
                    required
                    min={1}
                    value={meetingNo}
                    onChange={(e) => setMeetingNo(Number(e.target.value))}
                    className='w-full min-w-0 max-w-full bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-10 outline-none transition-all box-border'
                  />
                </div>
              </div>

              {/* Row 2: Kompetensi Dasar & Materi Pembelajaran */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0'>
                <div className='space-y-1.5 w-full min-w-0'>
                  <Label className='text-slate-700 text-xs font-semibold'>
                    Kompetensi Dasar / Capaian Pembelajaran
                  </Label>
                  <textarea
                    rows={3}
                    required
                    placeholder='Contoh: 4.2. Merencanakan rangkaian penjumlahan dan Pengurangan dengan Gerbang logika'
                    value={basicCompetency}
                    onChange={(e) => setBasicCompetency(e.target.value)}
                    className='w-full min-w-0 max-w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-900 outline-none transition-all box-border'
                  />
                </div>

                <div className='space-y-1.5 w-full min-w-0'>
                  <Label className='text-slate-700 text-xs font-semibold'>
                    Materi Pembelajaran
                  </Label>
                  <textarea
                    rows={3}
                    required
                    placeholder='Contoh: - Gerbang Logika / Half-full adder'
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className='w-full min-w-0 max-w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-900 outline-none transition-all box-border'
                  />
                </div>
              </div>

              {/* Row 3: Kegiatan Belajar Mengajar */}
              <div className='space-y-1.5 w-full min-w-0'>
                <Label className='text-slate-700 text-xs font-semibold'>
                  Kegiatan Belajar Mengajar (KBM)
                </Label>
                <textarea
                  rows={3}
                  required
                  placeholder='Contoh: - Guru menjelaskan materi&#10;- Siswa mengerjakan latihan soal LKPD'
                  value={learningActivity}
                  onChange={(e) => setLearningActivity(e.target.value)}
                  className='w-full min-w-0 max-w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-900 outline-none transition-all box-border'
                />
              </div>

              {/* Row 4: Input Absensi Siswa */}
              <div className='border-t border-slate-200 pt-5 space-y-4 w-full min-w-0'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 w-full'>
                  <div className='min-w-0'>
                    <Label className='text-slate-900 text-sm font-bold flex items-center gap-2'>
                      <UserCheck className='h-4 w-4 text-emerald-600 shrink-0' />
                      <span>Input Absensi Siswa</span>
                    </Label>
                    <p className='text-[11px] text-slate-500 mt-0.5'>
                      Pilih siswa dan tentukan status kehadirannya untuk tanggal
                      ini.
                    </p>
                  </div>

                  <div className='flex items-center gap-2 flex-wrap min-w-0'>
                    {/* Badge Counters */}
                    <div className='flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] sm:text-[11px] font-bold'>
                      <span className='text-emerald-700'>
                        Hadir: {currentCounts.hadir}
                      </span>
                      <span className='text-slate-300'>|</span>
                      <span className='text-amber-700'>
                        Sakit: {currentCounts.sakit}
                      </span>
                      <span className='text-slate-300'>|</span>
                      <span className='text-blue-700'>
                        Izin: {currentCounts.izin}
                      </span>
                      <span className='text-slate-300'>|</span>
                      <span className='text-rose-700'>
                        Alfa: {currentCounts.alfa}
                      </span>
                    </div>

                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleMarkAllHadir}
                      className='border-slate-200 bg-white hover:bg-slate-100 text-emerald-700 text-xs font-semibold rounded-xl h-8 px-2.5 gap-1.5'
                    >
                      <CheckCircle2 className='h-3.5 w-3.5' />
                      Tandai Semua Hadir
                    </Button>
                  </div>
                </div>

                {/* Filter / Search Siswa */}
                <div className='flex items-center gap-3 w-full min-w-0'>
                  <div className='relative flex-1 min-w-0'>
                    <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400' />
                    <Input
                      placeholder='Cari nama siswa atau NIS...'
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className='w-full min-w-0 max-w-full pl-9 bg-slate-50 border-slate-200 text-slate-900 text-xs h-8.5 rounded-xl focus:border-emerald-500 box-border'
                    />
                  </div>
                </div>

                {/* Student Attendance Selection List */}
                <div className='bg-slate-50 border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto w-full min-w-0'>
                  {isFetchingAttendance ? (
                    <div className='flex items-center justify-center py-8 text-slate-500 text-xs gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin text-emerald-600' />
                      <span>Memuat data absensi siswa...</span>
                    </div>
                  ) : studentAttendanceList.length === 0 ? (
                    <div className='text-center py-6 text-slate-400 text-xs'>
                      Belum ada data siswa di kelas. Tambahkan siswa di menu
                      Data Siswa.
                    </div>
                  ) : (
                    <div className='divide-y divide-slate-200/80 w-full min-w-0'>
                      {filteredStudentList.map((st, idx) => (
                        <div
                          key={st.studentId}
                          className='flex flex-col sm:flex-row sm:items-center justify-between p-2.5 hover:bg-white transition-colors text-xs gap-2 w-full min-w-0'
                        >
                          <div className='flex items-center gap-2.5 min-w-0 pr-2'>
                            <span className='text-[10px] text-slate-400 w-5 text-center font-semibold shrink-0'>
                              {idx + 1}
                            </span>
                            <div className='truncate min-w-0'>
                              <p className='font-bold text-slate-900 truncate'>
                                {st.name}
                              </p>
                              <p className='text-[10px] text-slate-500 font-mono truncate'>
                                {st.nis ? `NIS: ${st.nis}` : st.className || ''}
                              </p>
                            </div>
                          </div>

                          {/* Attendance Status Buttons */}
                          <div className='flex items-center gap-1 shrink-0 self-start sm:self-auto'>
                            <button
                              type='button'
                              onClick={() =>
                                handleStudentStatusChange(st.studentId, 'Hadir')
                              }
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                                st.status === 'Hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                              }`}
                            >
                              Hadir
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                handleStudentStatusChange(st.studentId, 'Sakit')
                              }
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                                st.status === 'Sakit'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                              }`}
                            >
                              Sakit
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                handleStudentStatusChange(st.studentId, 'Izin')
                              }
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                                st.status === 'Izin'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                              }`}
                            >
                              Izin
                            </button>
                            <button
                              type='button'
                              onClick={() =>
                                handleStudentStatusChange(st.studentId, 'Alfa')
                              }
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                                st.status === 'Alfa'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                              }`}
                            >
                              Alfa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className='p-4 sm:p-6 py-3 border-t border-slate-200 shrink-0 bg-slate-50/90 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setJournalModalOpen(false)}
                className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs w-full sm:w-auto'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={saveJournalMutation.isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 gap-2 shadow-xs w-full sm:w-auto'
              >
                {saveJournalMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : editingEntry ? (
                  'Simpan Perubahan'
                ) : (
                  'Tambah Catatan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Kustomisasi Kop Surat & Tanda Tangan */}
      <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-4xl lg:max-w-5xl p-0 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveHeaderMutation.mutate(headerForm);
              updateDocHeader(docHeader);
              updateSignatureData(signatureData);
            }}
            className='flex flex-col h-full max-h-[90vh]'
          >
            <DialogHeader className='p-5 sm:px-7 sm:py-5 border-b border-slate-200 shrink-0 bg-slate-50/70'>
              <DialogTitle className='text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2.5'>
                <div>
                  <div>Kustomisasi Kop Surat & Tanda Tangan</div>
                  <DialogDescription className='text-xs text-slate-500 font-normal mt-0.5'>
                    Konfigurasi format kop dinas, logo instansi, metadata
                    jurnal, dan identitas pengesahan laporan.
                  </DialogDescription>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className='p-5 sm:p-7 pb-8 overflow-y-auto space-y-6 text-xs flex-1'>
              {/* Switch / Toggle: Gunakan Kop Resmi */}
              <div className='flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60'>
                <div className='space-y-0.5'>
                  <div className='font-bold text-slate-900 text-sm flex items-center gap-2'>
                    Format Kop Surat Dinas
                    <span className='px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800'>
                      {docHeader.useOfficialKop ? 'Aktif (Resmi)' : 'Standar'}
                    </span>
                  </div>
                  <p className='text-[11px] text-slate-500'>
                    Tampilkan logo sekolah di sisi kiri, 6 baris identitas
                    serif, dan garis ganda kop surat dinas.
                  </p>
                </div>
                <Button
                  type='button'
                  size='sm'
                  variant={docHeader.useOfficialKop ? 'default' : 'outline'}
                  onClick={() =>
                    updateDocHeader({
                      useOfficialKop: !docHeader.useOfficialKop,
                    })
                  }
                  className={`rounded-xl text-xs font-semibold h-8 px-3 transition-all cursor-pointer ${
                    docHeader.useOfficialKop
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {docHeader.useOfficialKop
                    ? 'Gunakan Format Standar'
                    : 'Aktifkan Kop Resmi'}
                </Button>
              </div>

              {/* Section Kop Surat Resmi (Jika diaktifkan) */}
              {docHeader.useOfficialKop && (
                <div className='space-y-4 rounded-xl border border-slate-200 bg-slate-50/30 p-4'>
                  <div className='flex items-center justify-between pb-2 border-b border-slate-200/80'>
                    <h5 className='font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]'>
                      <ImageIcon className='h-3.5 w-3.5 text-emerald-600' />
                      Logo Lembaga / Sekolah
                    </h5>
                    <div className='flex items-center gap-2'>
                      <label
                        htmlFor='modal-logo-file-input-jurnal'
                        className='cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-colors'
                      >
                        <Upload className='h-3 w-3' />
                        Upload Logo Baru
                      </label>
                      <input
                        id='modal-logo-file-input-jurnal'
                        type='file'
                        accept='image/*'
                        onChange={handleLogoUpload}
                        className='hidden'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={handleResetLogo}
                        className='h-7 px-2 text-slate-500 hover:text-slate-700 text-xs gap-1 cursor-pointer'
                        title='Kembalikan ke logo default'
                      >
                        <RotateCcw className='h-3 w-3' />
                        Reset
                      </Button>
                    </div>
                  </div>

                  {/* Preset Template Selector */}
                  <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl'>
                    <div>
                      <p className='text-xs font-bold text-slate-800'>
                        Pilihan Template Format Kop
                      </p>
                      <p className='text-[11px] text-slate-500'>
                        Terapkan format standar sekolah atau gunakan format
                        khusus.
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          updateDocHeader({
                            logoUrl: '/icon.svg',
                            schoolName:
                              profile?.schoolName ||
                              headerForm.schoolName ||
                              'NAMA SEKOLAH',
                            subHeader1: '',
                            subHeader2: '',
                            subHeader3: '',
                            addressLine: '',
                            cityRegency: '',
                          });
                          toast.success(
                            'Format kop di-reset ke format standar sekolah.',
                          );
                        }}
                        className='text-[11px] h-7 px-2.5 rounded-lg border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer'
                      >
                        Format Standar
                      </Button>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          updateDocHeader({
                            ...SLB_PURNAMA_ASIH_KOP,
                          });
                          toast.success(
                            'Template resmi SLB Purnama Asih berhasil dimuat.',
                          );
                        }}
                        className='text-[11px] h-7 px-2.5 rounded-lg border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold cursor-pointer'
                      >
                        Template SLB Purnama Asih
                      </Button>
                    </div>
                  </div>

                  {/* Logo Preview & Tip */}
                  <div className='flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200'>
                    <div className='w-14 h-14 shrink-0 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-1 overflow-hidden shadow-xs'>
                      <img
                        src={docHeader.logoUrl || '/icon.svg'}
                        alt='Preview Logo'
                        className='max-w-full max-h-full object-contain'
                      />
                    </div>
                    <div className='text-[11px] text-slate-600 leading-tight'>
                      <p className='font-semibold text-slate-800'>
                        Logo Kop Laporan
                      </p>
                      <p className='text-slate-500 mt-0.5'>
                        Format JPG/PNG/WebP/SVG, disarankan logo transparan atau
                        latar putih bundar.
                      </p>
                    </div>
                  </div>

                  {/* 6 Baris Teks Kop Dinas */}
                  <div className='space-y-3 pt-1'>
                    <div className='space-y-1'>
                      <Label className='text-slate-700 font-semibold flex items-center justify-between'>
                        <span>Baris 1 (Nama Yayasan / Lembaga)</span>
                        <span className='text-[10px] text-slate-400 font-normal'>
                          Font Besar / Tebal
                        </span>
                      </Label>
                      <Input
                        value={docHeader.schoolName}
                        onChange={(e) =>
                          updateDocHeader({ schoolName: e.target.value })
                        }
                        placeholder='Contoh: DINAS PENDIDIKAN PROVINSI / NAMA YAYASAN'
                        className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                      />
                    </div>

                    <div className='space-y-1'>
                      <Label className='text-slate-700 font-semibold flex items-center justify-between'>
                        <span>Baris 2 (Satuan Pendidikan)</span>
                        <span className='text-[10px] text-slate-400 font-normal'>
                          Font Tebal
                        </span>
                      </Label>
                      <Input
                        value={docHeader.subHeader1}
                        onChange={(e) =>
                          updateDocHeader({ subHeader1: e.target.value })
                        }
                        placeholder='Contoh: SEKOLAH MENENGAH PERTAMA / NAMA SEKOLAH'
                        className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                      />
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          Baris 3 (Izin Operasional / NPSN)
                        </Label>
                        <Input
                          value={docHeader.subHeader2}
                          onChange={(e) =>
                            updateDocHeader({ subHeader2: e.target.value })
                          }
                          placeholder='Contoh: NPSN: 12345678 / Izin Kanwil'
                          className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          Baris 4 (Nomor Registrasi / Akreditasi)
                        </Label>
                        <Input
                          value={docHeader.subHeader3}
                          onChange={(e) =>
                            updateDocHeader({ subHeader3: e.target.value })
                          }
                          placeholder='Contoh: Akreditasi A (Unggul)'
                          className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                        />
                      </div>
                    </div>

                    <div className='space-y-1'>
                      <Label className='text-slate-700 font-semibold'>
                        Baris 5 (Alamat & Kontak)
                      </Label>
                      <Input
                        value={docHeader.addressLine}
                        onChange={(e) =>
                          updateDocHeader({ addressLine: e.target.value })
                        }
                        placeholder='Contoh: Jl. Merdeka No. 45 Telp. (022) 123456'
                        className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                      />
                    </div>

                    <div className='space-y-1'>
                      <Label className='text-slate-700 font-semibold flex items-center justify-between'>
                        <span>Baris 6 (Kabupaten / Kota)</span>
                        <span className='text-[10px] text-slate-400 font-normal'>
                          Huruf Kapital Tebal
                        </span>
                      </Label>
                      <Input
                        value={docHeader.cityRegency}
                        onChange={(e) =>
                          updateDocHeader({ cityRegency: e.target.value })
                        }
                        placeholder='Contoh: KABUPATEN BANDUNG'
                        className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs font-semibold'
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Identitas & Metadata Dokumen Jurnal */}
              <div className='space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4'>
                <h5 className='font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200/80'>
                  <BookOpen className='h-3.5 w-3.5 text-emerald-600' />
                  Metadata Dokumen Jurnal
                </h5>

                <div className='space-y-1'>
                  <Label className='text-slate-700 font-semibold'>
                    Nama Sekolah
                  </Label>
                  <Input
                    required
                    placeholder='Nama Sekolah'
                    value={headerForm.schoolName}
                    onChange={(e) =>
                      setHeaderForm({
                        ...headerForm,
                        schoolName: e.target.value,
                      })
                    }
                    className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-slate-700 font-semibold'>
                      Mata Pelajaran
                    </Label>
                    <Input
                      required
                      placeholder='Contoh: Matematika'
                      value={headerForm.subject}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          subject: e.target.value,
                        })
                      }
                      className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-slate-700 font-semibold'>
                      Kelas / Semester
                    </Label>
                    <Input
                      required
                      placeholder='Contoh: Kelas 7A / Ganjil'
                      value={headerForm.classNameSemester}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          classNameSemester: e.target.value,
                        })
                      }
                      className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-slate-700 font-semibold'>
                      Tahun Pelajaran
                    </Label>
                    <Input
                      required
                      placeholder='Contoh: 2026/2027'
                      value={headerForm.academicYear}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          academicYear: e.target.value,
                        })
                      }
                      className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                    />
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-slate-700 font-semibold'>
                      Kurikulum
                    </Label>
                    <Input
                      required
                      placeholder='Contoh: Kurikulum Merdeka'
                      value={headerForm.curriculum}
                      onChange={(e) =>
                        setHeaderForm({
                          ...headerForm,
                          curriculum: e.target.value,
                        })
                      }
                      className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                    />
                  </div>
                </div>
              </div>

              {/* Section: Pengesahan & Tanda Tangan */}
              <div className='space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4'>
                <h5 className='font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200/80'>
                  <UserCheck className='h-3.5 w-3.5 text-emerald-600' />
                  Identitas Pengesahan & Tanda Tangan
                </h5>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <div className='space-y-1'>
                    <Label className='text-slate-700 font-semibold'>
                      Tempat Pengesahan
                    </Label>
                    <Input
                      value={signatureData.place}
                      onChange={(e) =>
                        updateSignatureData({ place: e.target.value })
                      }
                      placeholder='Contoh: Bandung'
                      className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label className='text-slate-700 font-semibold'>
                      Tanggal Pengesahan
                    </Label>
                    <Input
                      value={signatureData.date}
                      onChange={(e) =>
                        updateSignatureData({ date: e.target.value })
                      }
                      placeholder='Contoh: 10 September 2026'
                      className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1'>
                  {/* Supervisor / Kepala Sekolah */}
                  <div className='space-y-2 p-3 bg-white border border-slate-200 rounded-xl'>
                    <p className='font-bold text-slate-800 text-[11px]'>
                      Pihak Mengetahui (Kiri)
                    </p>
                    <div className='space-y-1'>
                      <Label className='text-slate-600 text-[11px]'>
                        Jabatan
                      </Label>
                      <Input
                        value={signatureData.supervisorTitle}
                        onChange={(e) =>
                          updateSignatureData({
                            supervisorTitle: e.target.value,
                          })
                        }
                        placeholder='Kepala Sekolah'
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-lg text-xs h-8'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-slate-600 text-[11px]'>
                        Nama Kepala Sekolah
                      </Label>
                      <Input
                        value={signatureData.supervisorName}
                        onChange={(e) =>
                          updateSignatureData({
                            supervisorName: e.target.value,
                          })
                        }
                        placeholder='Nama lengkap & gelar'
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-lg text-xs h-8'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-slate-600 text-[11px]'>
                        NIP/NUPTK
                      </Label>
                      <Input
                        value={signatureData.supervisorNip}
                        onChange={(e) =>
                          updateSignatureData({ supervisorNip: e.target.value })
                        }
                        placeholder='NIP/NUPTK'
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-lg text-xs h-8'
                      />
                    </div>
                  </div>

                  {/* Guru */}
                  <div className='space-y-2 p-3 bg-white border border-slate-200 rounded-xl'>
                    <p className='font-bold text-slate-800 text-[11px]'>
                      Pihak Pembuat (Kanan)
                    </p>
                    <div className='space-y-1'>
                      <Label className='text-slate-600 text-[11px]'>
                        Jabatan
                      </Label>
                      <Input
                        value={signatureData.teacherTitle}
                        onChange={(e) =>
                          updateSignatureData({ teacherTitle: e.target.value })
                        }
                        placeholder='Guru Kelas / Wali Kelas'
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-lg text-xs h-8'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-slate-600 text-[11px]'>
                        Nama Guru
                      </Label>
                      <Input
                        value={
                          signatureData.teacherName || headerForm.teacherName
                        }
                        onChange={(e) => {
                          updateSignatureData({ teacherName: e.target.value });
                          setHeaderForm((prev) => ({
                            ...prev,
                            teacherName: e.target.value,
                          }));
                        }}
                        placeholder='Nama lengkap & gelar'
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-lg text-xs h-8'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-slate-600 text-[11px]'>
                        NIP/NUPTK
                      </Label>
                      <Input
                        value={signatureData.teacherNip || headerForm.nip}
                        onChange={(e) => {
                          updateSignatureData({ teacherNip: e.target.value });
                          setHeaderForm((prev) => ({
                            ...prev,
                            nip: e.target.value,
                          }));
                        }}
                        placeholder='NIP/NUPTK'
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-lg text-xs h-8'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className='p-4 sm:px-7 sm:py-4 border-t border-slate-200 gap-3 shrink-0 bg-slate-50 flex flex-row items-center justify-between'>
              <span className='text-xs text-slate-500 font-medium hidden sm:inline'>
                Perubahan tersimpan otomatis di browser & profil jurnal
              </span>
              <div className='flex items-center gap-2 ml-auto'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => setHeaderModalOpen(false)}
                  className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs rounded-xl h-9 px-4 cursor-pointer'
                >
                  Batal
                </Button>
                <Button
                  type='submit'
                  disabled={saveHeaderMutation.isPending}
                  className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 h-9 gap-2 shadow-xs cursor-pointer'
                >
                  {saveHeaderMutation.isPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    'Simpan Pengaturan'
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title='Hapus Catatan Jurnal'
        description='Apakah Anda yakin ingin menghapus catatan jurnal harian ini?'
        confirmText='Ya, Hapus'
        cancelText='Batal'
        variant='danger'
        isLoading={deleteJournalMutation.isPending}
        onConfirm={() => {
          if (deleteId) deleteJournalMutation.mutate(deleteId);
        }}
      />
    </div>
  );
}
