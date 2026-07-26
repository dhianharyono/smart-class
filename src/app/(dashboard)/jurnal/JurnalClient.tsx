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
  Download,
  Printer,
  Search,
  Loader2,
  Settings2,
  Calendar,
  UserCheck,
  BookMarked,
  FileText,
  TrendingUp,
  BarChart3,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
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

  // Dialog States
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  // Form States for Journal Entry
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [meetingNo, setMeetingNo] = useState<number>(1);
  const [basicCompetency, setBasicCompetency] = useState('');
  const [material, setMaterial] = useState('');
  const [learningActivity, setLearningActivity] = useState('');

  // Student Attendance States
  const [studentAttendanceList, setStudentAttendanceList] = useState<StudentAttendanceItem[]>([]);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(false);

  // Header State
  const [headerForm, setHeaderForm] = useState({
    schoolName: '',
    subject: '',
    classNameSemester: '',
    academicYear: '',
    curriculum: '2013',
    teacherName: '',
    nip: '-',
  });

  // Queries
  const { data: journals, isLoading: isJournalsLoading } = useQuery<JournalEntry[]>({
    queryKey: ['journals'],
    queryFn: () => getJournals(),
  });

  const { data: headerData, isLoading: isHeaderLoading } = useQuery({
    queryKey: ['journalHeader'],
    queryFn: () => getJournalHeader(),
  });

  // Keep headerForm synced with fetched header
  React.useEffect(() => {
    if (headerData) {
      setHeaderForm({
        schoolName: headerData.schoolName || '',
        subject: headerData.subject || '',
        classNameSemester: headerData.classNameSemester || '',
        academicYear: headerData.academicYear || '',
        curriculum: headerData.curriculum || '2013',
        teacherName: headerData.teacherName || '',
        nip: headerData.nip || '-',
      });
    }
  }, [headerData]);

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
    const maxMeeting = journals && journals.length > 0
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
  const handleStudentStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentAttendanceList((prev) =>
      prev.map((st) => (st.studentId === studentId ? { ...st, status } : st))
    );
  };

  const handleMarkAllHadir = () => {
    setStudentAttendanceList((prev) => prev.map((st) => ({ ...st, status: 'Hadir' })));
    toast.success('Semua siswa ditandai Hadir');
  };

  // Calculated attendance metrics
  const currentCounts = React.useMemo(() => {
    const hadir = studentAttendanceList.filter((s) => s.status === 'Hadir').length;
    const sakit = studentAttendanceList.filter((s) => s.status === 'Sakit').length;
    const izin = studentAttendanceList.filter((s) => s.status === 'Izin').length;
    const alfa = studentAttendanceList.filter((s) => s.status === 'Alfa').length;
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
      (st) => st.name.toLowerCase().includes(q) || (st.nis && st.nis.toLowerCase().includes(q))
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
        editingEntry ? 'Catatan jurnal berhasil diperbarui!' : 'Catatan jurnal berhasil ditambahkan!'
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
  const filteredJournals = journals?.filter((j) => {
    const search = searchTerm.toLowerCase();
    const formattedDate = new Date(j.date).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).toLowerCase();

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
  const totalS = journals?.reduce((acc, curr) => acc + (curr.absentS || 0), 0) || 0;
  const totalI = journals?.reduce((acc, curr) => acc + (curr.absentI || 0), 0) || 0;
  const totalA = journals?.reduce((acc, curr) => acc + (curr.absentA || 0), 0) || 0;
  const totalAbsences = totalS + totalI + totalA;

  const thisMonthCount = React.useMemo(() => {
    if (!journals) return 0;
    const now = new Date();
    return journals.filter((j) => {
      const d = new Date(j.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [journals]);

  const monthlyChartData = React.useMemo(() => {
    if (!journals || journals.length === 0) return [];
    const map = new Map<
      string,
      { month: string; Pertemuan: number; Sakit: number; Izin: number; Alpha: number }
    >();

    journals.forEach((j) => {
      const d = new Date(j.date);
      const key = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
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
      {/* Header Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5 sm:gap-3'>
            <BookMarked className='h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-emerald-600 shrink-0' />
            <span>Jurnal Wali Kelas</span>
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Pencatatan agenda harian mengajar guru, materi, KBM, dan rekapitulasi ketidakhadiran siswa.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2.5'>
          <Button
            onClick={handleExportExcel}
            variant='outline'
            className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs'
          >
            <Download className='h-4 w-4 text-amber-600' />
            Ekspor Excel
          </Button>
          <Button
            onClick={() => window.print()}
            variant='outline'
            className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs'
          >
            <Printer className='h-4 w-4 text-blue-600' />
            Cetak Jurnal
          </Button>
          <Button
            onClick={handleOpenCreateModal}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-10 px-4 gap-2 shadow-xs'
          >
            <Plus className='h-4 w-4' />
            Tambah Jurnal
          </Button>
        </div>
      </div>

      {/* Overview Cards & Analytics Section (Print Hidden) */}
      <div className='space-y-4 print:hidden'>
        <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-4'>
          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                Total Pertemuan
              </CardTitle>
              <div className='p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700'>
                <BookOpen className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tracking-tight text-slate-900 mb-1'>
                {totalEntries} Kali
              </div>
              <p className='text-[10px] text-slate-500'>
                {thisMonthCount} pertemuan di bulan ini
              </p>
            </CardContent>
          </Card>

          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                Sakit (S)
              </CardTitle>
              <div className='p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700'>
                <UserCheck className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tracking-tight text-amber-600 mb-1'>
                {totalS} Siswa
              </div>
              <p className='text-[10px] text-slate-500'>Total ijin sakit</p>
            </CardContent>
          </Card>

          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                Izin (I)
              </CardTitle>
              <div className='p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700'>
                <Calendar className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tracking-tight text-blue-600 mb-1'>
                {totalI} Siswa
              </div>
              <p className='text-[10px] text-slate-500'>Total ijin keperluan</p>
            </CardContent>
          </Card>

          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                Alpha (A)
              </CardTitle>
              <div className='p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700'>
                <FileText className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tracking-tight text-rose-600 mb-1'>
                {totalA} Siswa
              </div>
              <p className='text-[10px] text-slate-500'>Total tanpa keterangan</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Header Card (Formatted matching official document in image) */}
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
              <span className='font-bold text-slate-500 print:text-black w-36'>Sekolah</span>
              <span className='font-bold text-slate-900 print:text-black flex-1'>
                : {headerForm.schoolName || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
              <span className='font-bold text-slate-500 print:text-black w-36'>Mata Pelajaran</span>
              <span className='font-bold text-slate-900 print:text-black flex-1'>
                : {headerForm.subject || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
              <span className='font-bold text-slate-500 print:text-black w-36'>Kelas/Semester</span>
              <span className='font-bold text-slate-900 print:text-black flex-1'>
                : {headerForm.classNameSemester || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
              <span className='font-bold text-slate-500 print:text-black w-36'>Tahun Pelajaran</span>
              <span className='font-bold text-slate-900 print:text-black flex-1'>
                : {headerForm.academicYear || '-'}
              </span>
            </div>
          </div>

          <div className='space-y-1.5'>
            <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
              <span className='font-bold text-slate-500 print:text-black w-36'>Kurikulum</span>
              <span className='font-bold text-slate-900 print:text-black flex-1'>
                : {headerForm.curriculum || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
              <span className='font-bold text-slate-500 print:text-black w-36'>Nama Guru</span>
              <span className='font-bold text-slate-900 print:text-black flex-1'>
                : {headerForm.teacherName || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-slate-100 pb-1 print:border-zinc-300'>
              <span className='font-bold text-slate-500 print:text-black w-36'>NIP</span>
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
          {isJournalsLoading ? (
            <div className='flex flex-col items-center justify-center py-20 text-slate-500 text-sm'>
              <Loader2 className='h-8 w-8 animate-spin text-emerald-600 mb-3' />
              <span>Memuat data jurnal harian guru...</span>
            </div>
          ) : filteredJournals.length > 0 ? (
            <div className='overflow-x-auto'>
              <Table className='print:text-black print:border-collapse print:w-full'>
                <TableHeader className='bg-slate-50/80 border-b border-slate-200 print:bg-zinc-200'>
                  {/* Two-row merged header matching image */}
                  <TableRow className='border-b border-slate-200 text-xs font-bold text-slate-700 print:text-black print:border-black'>
                    <TableHead rowSpan={2} className='w-12 text-center text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                      No.
                    </TableHead>
                    <TableHead rowSpan={2} className='w-36 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                      Hari / Tanggal
                    </TableHead>
                    <TableHead rowSpan={2} className='w-24 text-center text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                      Pertemuan ke-
                    </TableHead>
                    <TableHead rowSpan={2} className='w-64 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                      Kompetensi Dasar
                    </TableHead>
                    <TableHead rowSpan={2} className='w-52 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                      Materi
                    </TableHead>
                    <TableHead rowSpan={2} className='w-64 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                      Kegiatan Belajar Mengajar
                    </TableHead>
                    <TableHead colSpan={3} className='text-center text-slate-700 font-bold border-b border-r border-slate-200 print:border-black print:text-black'>
                      Absensi Siswa
                    </TableHead>
                    <TableHead rowSpan={2} className='w-48 text-slate-700 font-bold border-r border-slate-200 print:border-black print:text-black'>
                      Keterangan
                    </TableHead>
                    <TableHead rowSpan={2} className='w-24 text-center text-slate-700 font-bold print:hidden'>
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
                    const formattedDate = new Date(entry.date).toLocaleDateString('id-ID', {
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
            <div className='flex flex-col items-center justify-center py-20 text-slate-500'>
              <BookMarked className='h-12 w-12 text-slate-300 mb-3' />
              <p className='text-sm font-bold text-slate-700'>Belum ada catatan jurnal.</p>
              <p className='text-xs text-slate-400 mt-1'>
                Klik tombol "+ Tambah Jurnal" untuk mencatat agenda pembelajaran harian Anda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

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
                <span>{editingEntry ? 'Edit Catatan Jurnal' : 'Tambah Jurnal Harian Guru'}</span>
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-500 mt-0.5 pr-6'>
                Isi rincian pertemuan, materi, kegiatan pembelajaran, dan absensi siswa.
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
                        <Loader2 className='h-3 w-3 animate-spin' /> Cek Absensi...
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
                  <Label className='text-slate-700 text-xs font-semibold'>Pertemuan ke-</Label>
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
                  <Label className='text-slate-700 text-xs font-semibold'>Kompetensi Dasar / Capaian Pembelajaran</Label>
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
                  <Label className='text-slate-700 text-xs font-semibold'>Materi Pembelajaran</Label>
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
                <Label className='text-slate-700 text-xs font-semibold'>Kegiatan Belajar Mengajar (KBM)</Label>
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
                      Pilih siswa dan tentukan status kehadirannya untuk tanggal ini.
                    </p>
                  </div>

                  <div className='flex items-center gap-2 flex-wrap min-w-0'>
                    {/* Badge Counters */}
                    <div className='flex flex-wrap items-center gap-1.5 sm:gap-2 bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 text-[10px] sm:text-[11px] font-bold'>
                      <span className='text-emerald-700'>Hadir: {currentCounts.hadir}</span>
                      <span className='text-slate-300'>|</span>
                      <span className='text-amber-700'>Sakit: {currentCounts.sakit}</span>
                      <span className='text-slate-300'>|</span>
                      <span className='text-blue-700'>Izin: {currentCounts.izin}</span>
                      <span className='text-slate-300'>|</span>
                      <span className='text-rose-700'>Alfa: {currentCounts.alfa}</span>
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
                      Belum ada data siswa di kelas. Tambahkan siswa di menu Data Siswa.
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
                              <p className='font-bold text-slate-900 truncate'>{st.name}</p>
                              <p className='text-[10px] text-slate-500 font-mono truncate'>
                                {st.nis ? `NIS: ${st.nis}` : st.className || ''}
                              </p>
                            </div>
                          </div>

                          {/* Attendance Status Buttons */}
                          <div className='flex items-center gap-1 shrink-0 self-start sm:self-auto'>
                            <button
                              type='button'
                              onClick={() => handleStudentStatusChange(st.studentId, 'Hadir')}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${st.status === 'Hadir'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                                }`}
                            >
                              Hadir
                            </button>
                            <button
                              type='button'
                              onClick={() => handleStudentStatusChange(st.studentId, 'Sakit')}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${st.status === 'Sakit'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                                }`}
                            >
                              Sakit
                            </button>
                            <button
                              type='button'
                              onClick={() => handleStudentStatusChange(st.studentId, 'Izin')}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${st.status === 'Izin'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                                }`}
                            >
                              Izin
                            </button>
                            <button
                              type='button'
                              onClick={() => handleStudentStatusChange(st.studentId, 'Alfa')}
                              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${st.status === 'Alfa'
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

      {/* Modal Dialog: Settings Header Info */}
      <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl w-[calc(100%-2.5rem)] sm:w-full max-w-lg p-4 sm:p-6 shadow-2xl'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveHeaderMutation.mutate(headerForm);
            }}
          >
            <DialogHeader className='pb-4 border-b border-slate-200'>
              <DialogTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                <Settings2 className='h-5 w-5 text-emerald-600' />
                Pengaturan Header Informasi Jurnal
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-500'>
                Sesuaikan metadata identitas jurnal harian guru untuk keperluan laporan dan cetak.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3.5 py-4 text-xs'>
              <div className='space-y-1'>
                <Label className='text-slate-700 text-xs font-semibold'>Nama Sekolah</Label>
                <Input
                  required
                  placeholder='Contoh: SMK 17 Seyegan'
                  value={headerForm.schoolName}
                  onChange={(e) => setHeaderForm({ ...headerForm, schoolName: e.target.value })}
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label className='text-slate-700 text-xs font-semibold'>Mata Pelajaran</Label>
                  <Input
                    required
                    placeholder='Contoh: Sistem Operasi'
                    value={headerForm.subject}
                    onChange={(e) => setHeaderForm({ ...headerForm, subject: e.target.value })}
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                  />
                </div>

                <div className='space-y-1'>
                  <Label className='text-slate-700 text-xs font-semibold'>Kelas / Semester</Label>
                  <Input
                    required
                    placeholder='Contoh: XTKJ/Genap'
                    value={headerForm.classNameSemester}
                    onChange={(e) => setHeaderForm({ ...headerForm, classNameSemester: e.target.value })}
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label className='text-slate-700 text-xs font-semibold'>Tahun Pelajaran</Label>
                  <Input
                    required
                    placeholder='Contoh: 2022/2023'
                    value={headerForm.academicYear}
                    onChange={(e) => setHeaderForm({ ...headerForm, academicYear: e.target.value })}
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                  />
                </div>

                <div className='space-y-1'>
                  <Label className='text-slate-700 text-xs font-semibold'>Kurikulum</Label>
                  <Input
                    required
                    placeholder='Contoh: 2013 / Merdeka'
                    value={headerForm.curriculum}
                    onChange={(e) => setHeaderForm({ ...headerForm, curriculum: e.target.value })}
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label className='text-slate-700 text-xs font-semibold'>Nama Guru</Label>
                  <Input
                    required
                    placeholder='Nama lengkap guru'
                    value={headerForm.teacherName}
                    onChange={(e) => setHeaderForm({ ...headerForm, teacherName: e.target.value })}
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                  />
                </div>

                <div className='space-y-1'>
                  <Label className='text-slate-700 text-xs font-semibold'>NIP</Label>
                  <Input
                    placeholder='-'
                    value={headerForm.nip}
                    onChange={(e) => setHeaderForm({ ...headerForm, nip: e.target.value })}
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-9'
                  />
                </div>
              </div>
            </div>

            <DialogFooter className='pt-3 border-t border-slate-200 gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setHeaderModalOpen(false)}
                className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={saveHeaderMutation.isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 gap-2 shadow-xs'
              >
                {saveHeaderMutation.isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Simpan Header'
                )}
              </Button>
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
