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
  getAttendanceSummaryForJournalDate,
} from '@/actions/journalActions';
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
  const [absentS, setAbsentS] = useState<number>(0);
  const [absentI, setAbsentI] = useState<number>(0);
  const [absentA, setAbsentA] = useState<number>(0);
  const [notes, setNotes] = useState('');
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

  // Handle Date Change -> Auto-fetch attendance summary
  const handleDateChange = async (newDateStr: string) => {
    setFormDate(newDateStr);
    if (!editingEntry) {
      setIsFetchingAttendance(true);
      try {
        const att = await getAttendanceSummaryForJournalDate(newDateStr);
        setAbsentS(att.absentS);
        setAbsentI(att.absentI);
        setAbsentA(att.absentA);
        if (att.notes && !notes) {
          setNotes(att.notes);
        }
      } catch (err) {
        console.error('Error fetching attendance summary:', err);
      } finally {
        setIsFetchingAttendance(false);
      }
    }
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
    setAbsentS(0);
    setAbsentI(0);
    setAbsentA(0);
    setNotes('');

    setJournalModalOpen(true);

    // Auto load attendance summary for today
    handleDateChange(todayStr);
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
    setAbsentS(entry.absentS || 0);
    setAbsentI(entry.absentI || 0);
    setAbsentA(entry.absentA || 0);
    setNotes(entry.notes || '');
    setJournalModalOpen(true);
  };

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
        absentS,
        absentI,
        absentA,
        notes,
      };

      if (editingEntry) {
        return await updateJournal(editingEntry._id, payload);
      } else {
        return await createJournal(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
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
          <h2 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent flex items-center gap-3'>
            <BookMarked className='h-7 w-7 text-emerald-500' />
            Jurnal Wali Kelas
          </h2>
          <p className='text-zinc-400 text-sm mt-1'>
            Pencatatan agenda harian mengajar guru, materi, KBM, dan rekapitulasi ketidakhadiran siswa.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2.5'>
          <Button
            onClick={() => setHeaderModalOpen(true)}
            variant='outline'
            className='border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 text-xs font-medium rounded-xl h-10 px-3.5 gap-2'
          >
            <Settings2 className='h-4 w-4 text-emerald-400' />
            Pengaturan Header
          </Button>
          <Button
            onClick={handleExportExcel}
            variant='outline'
            className='border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 text-xs font-medium rounded-xl h-10 px-3.5 gap-2'
          >
            <Download className='h-4 w-4 text-amber-400' />
            Ekspor Excel
          </Button>
          <Button
            onClick={() => window.print()}
            variant='outline'
            className='border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 text-xs font-medium rounded-xl h-10 px-3.5 gap-2'
          >
            <Printer className='h-4 w-4 text-blue-400' />
            Cetak Jurnal
          </Button>
          <Button
            onClick={handleOpenCreateModal}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl h-10 px-4 gap-2 shadow-lg shadow-emerald-950/30'
          >
            <Plus className='h-4 w-4' />
            Tambah Jurnal
          </Button>
        </div>
      </div>

      {/* Overview Cards & Analytics Section (Print Hidden) */}
      <div className='space-y-4 print:hidden'>
        <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-4'>
          <Card className='bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm shadow-xl rounded-2xl'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                Total Pertemuan
              </CardTitle>
              <div className='p-2 rounded-xl bg-emerald-950/60 border border-emerald-900/50 text-emerald-400'>
                <BookOpen className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tracking-tight text-white mb-1'>
                {totalEntries} Kali
              </div>
              <p className='text-[10px] text-zinc-500'>
                {thisMonthCount} pertemuan di bulan ini
              </p>
            </CardContent>
          </Card>

          <Card className='bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm shadow-xl rounded-2xl'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                Sakit (S)
              </CardTitle>
              <div className='p-2 rounded-xl bg-amber-950/60 border border-amber-900/50 text-amber-400'>
                <UserCheck className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tracking-tight text-amber-400 mb-1'>
                {totalS} Siswa
              </div>
              <p className='text-[10px] text-zinc-500'>Total ijin sakit</p>
            </CardContent>
          </Card>

          <Card className='bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm shadow-xl rounded-2xl'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                Izin (I)
              </CardTitle>
              <div className='p-2 rounded-xl bg-blue-950/60 border border-blue-900/50 text-blue-400'>
                <Calendar className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tracking-tight text-blue-400 mb-1'>
                {totalI} Siswa
              </div>
              <p className='text-[10px] text-zinc-500'>Total ijin keperluan</p>
            </CardContent>
          </Card>

          <Card className='bg-zinc-900/40 border-zinc-800/80 backdrop-blur-sm shadow-xl rounded-2xl'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-xs font-semibold text-zinc-400 uppercase tracking-wider'>
                Alpha (A)
              </CardTitle>
              <div className='p-2 rounded-xl bg-rose-950/60 border border-rose-900/50 text-rose-400'>
                <FileText className='h-4 w-4' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold tracking-tight text-rose-400 mb-1'>
                {totalA} Siswa
              </div>
              <p className='text-[10px] text-zinc-500'>Total tanpa keterangan</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Document Header Card (Formatted matching official document in image) */}
      <Card className='bg-zinc-900/40 border-zinc-800 shadow-xl rounded-2xl p-6 relative overflow-hidden group'>
        <div className='flex items-center justify-center relative mb-6 border-b border-zinc-800 pb-4'>
          <h1 className='text-xl font-extrabold text-white uppercase tracking-widest print:text-black print:text-2xl'>
            Jurnal Harian Guru
          </h1>
          <Button
            onClick={() => setHeaderModalOpen(true)}
            variant='ghost'
            size='sm'
            className='absolute right-0 text-xs text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/30 gap-1.5 rounded-xl print:hidden'
          >
            <Settings2 className='h-3.5 w-3.5' />
            Edit Header
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-8 text-xs text-zinc-300 print:text-black print:grid-cols-2 print:text-sm'>
          <div className='space-y-1.5'>
            <div className='flex justify-between border-b border-zinc-850 pb-1 print:border-zinc-300'>
              <span className='font-bold text-zinc-400 print:text-black w-36'>Sekolah</span>
              <span className='font-medium text-zinc-200 print:text-black flex-1'>
                : {headerForm.schoolName || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-zinc-850 pb-1 print:border-zinc-300'>
              <span className='font-bold text-zinc-400 print:text-black w-36'>Mata Pelajaran</span>
              <span className='font-medium text-zinc-200 print:text-black flex-1'>
                : {headerForm.subject || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-zinc-850 pb-1 print:border-zinc-300'>
              <span className='font-bold text-zinc-400 print:text-black w-36'>Kelas/Semester</span>
              <span className='font-medium text-zinc-200 print:text-black flex-1'>
                : {headerForm.classNameSemester || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-zinc-850 pb-1 print:border-zinc-300'>
              <span className='font-bold text-zinc-400 print:text-black w-36'>Tahun Pelajaran</span>
              <span className='font-medium text-zinc-200 print:text-black flex-1'>
                : {headerForm.academicYear || '-'}
              </span>
            </div>
          </div>

          <div className='space-y-1.5'>
            <div className='flex justify-between border-b border-zinc-850 pb-1 print:border-zinc-300'>
              <span className='font-bold text-zinc-400 print:text-black w-36'>Kurikulum</span>
              <span className='font-medium text-zinc-200 print:text-black flex-1'>
                : {headerForm.curriculum || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-zinc-850 pb-1 print:border-zinc-300'>
              <span className='font-bold text-zinc-400 print:text-black w-36'>Nama Guru</span>
              <span className='font-medium text-zinc-200 print:text-black flex-1'>
                : {headerForm.teacherName || '-'}
              </span>
            </div>
            <div className='flex justify-between border-b border-zinc-850 pb-1 print:border-zinc-300'>
              <span className='font-bold text-zinc-400 print:text-black w-36'>NIP</span>
              <span className='font-medium text-zinc-200 print:text-black flex-1'>
                : {headerForm.nip || '-'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Search Bar (Print Hidden) */}
      <div className='flex items-center gap-3 print:hidden'>
        <div className='relative flex-1'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500' />
          <Input
            placeholder='Cari tanggal, KD, materi, atau kegiatan pembelajaran...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-10 bg-zinc-900/50 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
          />
        </div>
      </div>

      {/* Main Journal Table (Matching Image Format Exactly) */}
      <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl overflow-hidden shadow-xl print:border-none print:shadow-none print:bg-white'>
        <CardContent className='p-0'>
          {isJournalsLoading ? (
            <div className='flex flex-col items-center justify-center py-20 text-zinc-500 text-sm'>
              <Loader2 className='h-8 w-8 animate-spin text-emerald-500 mb-3' />
              <span>Memuat data jurnal harian guru...</span>
            </div>
          ) : filteredJournals.length > 0 ? (
            <div className='overflow-x-auto'>
              <Table className='print:text-black print:border-collapse print:w-full'>
                <TableHeader className='bg-zinc-900/80 border-b border-zinc-800 print:bg-zinc-200'>
                  {/* Two-row merged header matching image */}
                  <TableRow className='border-b border-zinc-800 text-xs font-bold text-zinc-300 print:text-black print:border-black'>
                    <TableHead rowSpan={2} className='w-12 text-center text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      No.
                    </TableHead>
                    <TableHead rowSpan={2} className='w-36 text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      Hari / Tanggal
                    </TableHead>
                    <TableHead rowSpan={2} className='w-24 text-center text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      Pertemuan ke-
                    </TableHead>
                    <TableHead rowSpan={2} className='w-64 text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      Kompetensi Dasar
                    </TableHead>
                    <TableHead rowSpan={2} className='w-52 text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      Materi
                    </TableHead>
                    <TableHead rowSpan={2} className='w-64 text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      Kegiatan Belajar Mengajar
                    </TableHead>
                    <TableHead colSpan={3} className='text-center text-zinc-300 font-bold border-b border-r border-zinc-800 print:border-black print:text-black'>
                      Absensi Siswa
                    </TableHead>
                    <TableHead rowSpan={2} className='w-48 text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      Keterangan
                    </TableHead>
                    <TableHead rowSpan={2} className='w-24 text-center text-zinc-300 font-bold print:hidden'>
                      Aksi
                    </TableHead>
                  </TableRow>
                  <TableRow className='border-b border-zinc-800 text-xs font-bold text-zinc-300 print:text-black print:border-black'>
                    <TableHead className='w-10 text-center text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      S
                    </TableHead>
                    <TableHead className='w-10 text-center text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
                      I
                    </TableHead>
                    <TableHead className='w-10 text-center text-zinc-300 font-bold border-r border-zinc-800 print:border-black print:text-black'>
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
                        className='border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors text-xs print:border-black print:text-black'
                      >
                        <TableCell className='text-center font-semibold text-zinc-400 border-r border-zinc-850 print:border-black print:text-black'>
                          {index + 1}
                        </TableCell>
                        <TableCell className='font-medium text-zinc-200 border-r border-zinc-850 print:border-black print:text-black'>
                          {formattedDate}
                        </TableCell>
                        <TableCell className='text-center font-bold text-emerald-400 border-r border-zinc-850 print:border-black print:text-black'>
                          {entry.meetingNo}
                        </TableCell>
                        <TableCell className='whitespace-pre-line text-zinc-300 leading-relaxed border-r border-zinc-850 print:border-black print:text-black'>
                          {entry.basicCompetency}
                        </TableCell>
                        <TableCell className='whitespace-pre-line text-zinc-300 leading-relaxed border-r border-zinc-850 print:border-black print:text-black'>
                          {entry.material}
                        </TableCell>
                        <TableCell className='whitespace-pre-line text-zinc-300 leading-relaxed border-r border-zinc-850 print:border-black print:text-black'>
                          {entry.learningActivity}
                        </TableCell>
                        <TableCell className='text-center font-bold text-amber-400 border-r border-zinc-850 print:border-black print:text-black'>
                          {entry.absentS > 0 ? entry.absentS : ''}
                        </TableCell>
                        <TableCell className='text-center font-bold text-blue-400 border-r border-zinc-850 print:border-black print:text-black'>
                          {entry.absentI > 0 ? entry.absentI : ''}
                        </TableCell>
                        <TableCell className='text-center font-bold text-rose-400 border-r border-zinc-850 print:border-black print:text-black'>
                          {entry.absentA > 0 ? entry.absentA : ''}
                        </TableCell>
                        <TableCell className='whitespace-pre-line text-zinc-400 italic border-r border-zinc-850 print:border-black print:text-black'>
                          {entry.notes || '-'}
                        </TableCell>
                        <TableCell className='text-center print:hidden'>
                          <div className='flex items-center justify-center gap-1.5'>
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() => handleOpenEditModal(entry)}
                              className='h-7 w-7 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg'
                            >
                              <Edit2 className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              size='icon'
                              variant='ghost'
                              onClick={() => setDeleteId(entry._id)}
                              className='h-7 w-7 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg'
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
            <div className='flex flex-col items-center justify-center py-20 text-zinc-500'>
              <BookMarked className='h-12 w-12 text-zinc-700 mb-3' />
              <p className='text-sm font-semibold text-zinc-300'>Belum ada catatan jurnal.</p>
              <p className='text-xs text-zinc-600 mt-1'>
                Klik tombol "+ Tambah Jurnal" untuk mencatat agenda pembelajaran harian Anda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Dialog: Add / Edit Journal */}
      <Dialog open={journalModalOpen} onOpenChange={setJournalModalOpen}>
        <DialogContent className='bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-full sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-6 md:p-8'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveJournalMutation.mutate();
            }}
          >
            <DialogHeader className='pb-4 border-b border-zinc-800'>
              <DialogTitle className='text-lg font-bold text-zinc-100 flex items-center gap-2'>
                <BookOpen className='h-5 w-5 text-emerald-500' />
                {editingEntry ? 'Edit Catatan Jurnal' : 'Tambah Jurnal Harian Guru'}
              </DialogTitle>
              <DialogDescription className='text-xs text-zinc-400'>
                Isi rincian pertemuan, materi, kegiatan pembelajaran, dan absensi siswa.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-5 py-5'>
              {/* Row 1: Tanggal & Pertemuan ke */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <Label className='text-zinc-300 text-xs font-semibold flex items-center justify-between'>
                    <span>Hari / Tanggal</span>
                    {isFetchingAttendance && (
                      <span className='text-[10px] text-emerald-400 flex items-center gap-1'>
                        <Loader2 className='h-3 w-3 animate-spin' /> Cek Absensi...
                      </span>
                    )}
                  </Label>
                  <Input
                    type='date'
                    required
                    value={formDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-zinc-300 text-xs font-semibold'>Pertemuan ke-</Label>
                  <Input
                    type='number'
                    required
                    min={1}
                    value={meetingNo}
                    onChange={(e) => setMeetingNo(Number(e.target.value))}
                    className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-10'
                  />
                </div>
              </div>

              {/* Row 2: Kompetensi Dasar & Materi Pembelajaran */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-1.5'>
                  <Label className='text-zinc-300 text-xs font-semibold'>Kompetensi Dasar / Capaian Pembelajaran</Label>
                  <textarea
                    rows={3}
                    required
                    placeholder='Contoh: 4.2. Merencanakan rangkaian penjumlahan dan Pengurangan dengan Gerbang logika'
                    value={basicCompetency}
                    onChange={(e) => setBasicCompetency(e.target.value)}
                    className='w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-zinc-300 text-xs font-semibold'>Materi Pembelajaran</Label>
                  <textarea
                    rows={3}
                    required
                    placeholder='Contoh: - Gerbang Logika / Half-full adder'
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    className='w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none'
                  />
                </div>
              </div>

              {/* Row 3: Kegiatan Belajar Mengajar */}
              <div className='space-y-1.5'>
                <Label className='text-zinc-300 text-xs font-semibold'>Kegiatan Belajar Mengajar (KBM)</Label>
                <textarea
                  rows={3}
                  required
                  placeholder='Contoh: - Guru menjelaskan materi&#10;- Siswa mengerjakan latihan soal LKPD'
                  value={learningActivity}
                  onChange={(e) => setLearningActivity(e.target.value)}
                  className='w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none'
                />
              </div>

              {/* Row 4: Rekap Absensi Siswa & Keterangan Siswa Tidak Hadir */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-zinc-850 pt-4'>
                <div className='space-y-2'>
                  <Label className='text-zinc-300 text-xs font-bold uppercase tracking-wider block'>
                    Rekap Absensi Siswa (Terisi Otomatis Dari Absensi Kelas)
                  </Label>

                  <div className='grid grid-cols-3 gap-3'>
                    <div className='space-y-1'>
                      <Label className='text-zinc-400 text-[10px] font-semibold'>Sakit (S)</Label>
                      <Input
                        type='number'
                        min={0}
                        value={absentS}
                        onChange={(e) => setAbsentS(Number(e.target.value))}
                        className='bg-zinc-950 border-zinc-800 text-amber-400 font-bold text-center rounded-xl text-xs h-9'
                      />
                    </div>

                    <div className='space-y-1'>
                      <Label className='text-zinc-400 text-[10px] font-semibold'>Izin (I)</Label>
                      <Input
                        type='number'
                        min={0}
                        value={absentI}
                        onChange={(e) => setAbsentI(Number(e.target.value))}
                        className='bg-zinc-950 border-zinc-800 text-blue-400 font-bold text-center rounded-xl text-xs h-9'
                      />
                    </div>

                    <div className='space-y-1'>
                      <Label className='text-zinc-400 text-[10px] font-semibold'>Alpha (A)</Label>
                      <Input
                        type='number'
                        min={0}
                        value={absentA}
                        onChange={(e) => setAbsentA(Number(e.target.value))}
                        className='bg-zinc-950 border-zinc-800 text-rose-400 font-bold text-center rounded-xl text-xs h-9'
                      />
                    </div>
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-zinc-300 text-xs font-semibold'>
                    Keterangan / Nama Siswa Tidak Hadir
                  </Label>
                  <textarea
                    rows={2}
                    placeholder='Contoh: Alfan, Arif, Eko, Bayu (Sakit/Izin)'
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className='w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl p-3 text-xs text-white focus:outline-none'
                  />
                </div>
              </div>
            </div>

            <DialogFooter className='pt-3 border-t border-zinc-800 gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setJournalModalOpen(false)}
                className='text-zinc-400 hover:text-zinc-200 text-xs'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={saveJournalMutation.isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl px-5 gap-2'
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
        <DialogContent className='bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-lg p-6'>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveHeaderMutation.mutate(headerForm);
            }}
          >
            <DialogHeader className='pb-4 border-b border-zinc-800'>
              <DialogTitle className='text-lg font-bold text-zinc-100 flex items-center gap-2'>
                <Settings2 className='h-5 w-5 text-emerald-500' />
                Pengaturan Header Informasi Jurnal
              </DialogTitle>
              <DialogDescription className='text-xs text-zinc-400'>
                Sesuaikan metadata identitas jurnal harian guru untuk keperluan laporan dan cetak.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-3.5 py-4 text-xs'>
              <div className='space-y-1'>
                <Label className='text-zinc-300 text-xs font-semibold'>Nama Sekolah</Label>
                <Input
                  required
                  placeholder='Contoh: SMK 17 Seyegan'
                  value={headerForm.schoolName}
                  onChange={(e) => setHeaderForm({ ...headerForm, schoolName: e.target.value })}
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-9'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label className='text-zinc-300 text-xs font-semibold'>Mata Pelajaran</Label>
                  <Input
                    required
                    placeholder='Contoh: Sistem Operasi'
                    value={headerForm.subject}
                    onChange={(e) => setHeaderForm({ ...headerForm, subject: e.target.value })}
                    className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-9'
                  />
                </div>

                <div className='space-y-1'>
                  <Label className='text-zinc-300 text-xs font-semibold'>Kelas / Semester</Label>
                  <Input
                    required
                    placeholder='Contoh: XTKJ/Genap'
                    value={headerForm.classNameSemester}
                    onChange={(e) => setHeaderForm({ ...headerForm, classNameSemester: e.target.value })}
                    className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-9'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label className='text-zinc-300 text-xs font-semibold'>Tahun Pelajaran</Label>
                  <Input
                    required
                    placeholder='Contoh: 2022/2023'
                    value={headerForm.academicYear}
                    onChange={(e) => setHeaderForm({ ...headerForm, academicYear: e.target.value })}
                    className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-9'
                  />
                </div>

                <div className='space-y-1'>
                  <Label className='text-zinc-300 text-xs font-semibold'>Kurikulum</Label>
                  <Input
                    required
                    placeholder='Contoh: 2013 / Merdeka'
                    value={headerForm.curriculum}
                    onChange={(e) => setHeaderForm({ ...headerForm, curriculum: e.target.value })}
                    className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-9'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label className='text-zinc-300 text-xs font-semibold'>Nama Guru</Label>
                  <Input
                    required
                    placeholder='Nama lengkap guru'
                    value={headerForm.teacherName}
                    onChange={(e) => setHeaderForm({ ...headerForm, teacherName: e.target.value })}
                    className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-9'
                  />
                </div>

                <div className='space-y-1'>
                  <Label className='text-zinc-300 text-xs font-semibold'>NIP</Label>
                  <Input
                    placeholder='-'
                    value={headerForm.nip}
                    onChange={(e) => setHeaderForm({ ...headerForm, nip: e.target.value })}
                    className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl text-xs h-9'
                  />
                </div>
              </div>
            </div>

            <DialogFooter className='pt-3 border-t border-zinc-800 gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setHeaderModalOpen(false)}
                className='text-zinc-400 hover:text-zinc-200 text-xs'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={saveHeaderMutation.isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl px-5 gap-2'
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
