'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Loader2,
  Check,
  Plus,
  BookOpen,
  GraduationCap,
  Settings,
  Printer,
  FileText,
  Sparkles,
  ChevronLeft,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  getGradesByFilter,
  saveBulkGrades,
  getAllGradesRecap,
  getAllSubjectsGradesRecap,
} from '@/actions/gradeActions';
import { updateTeacherKkm } from '@/actions/dashboardActions';
import { getAttendanceHeaderInfo } from '@/actions/attendanceActions';
import {
  exportGradesToExcel,
  exportGradesRecapToExcel,
  exportAllSubjectsGradesRecapToExcel,
} from '@/lib/excelExport';

interface GradeRow {
  studentId: string;
  name: string;
  nis: string;
  className: string;
  score: number | '';
}

interface NilaiClientProps {
  initialSubjects: string[];
  initialKkm: number;
}

export default function NilaiClient({
  initialSubjects,
  initialKkm,
}: NilaiClientProps) {
  const queryClient = useQueryClient();
  const [activeViewTab, setActiveViewTab] = useState<'data' | 'preview'>(
    'data',
  );
  const [reportViewMode, setReportViewMode] = useState<
    'all_subjects' | 'recap' | 'single'
  >('all_subjects');

  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [kkm, setKkm] = useState<number>(initialKkm);
  const [kkmInput, setKkmInput] = useState<string>(String(initialKkm));
  const [editKkmOpen, setEditKkmOpen] = useState(false);
  const [isUpdatingKkm, setIsUpdatingKkm] = useState(false);

  // Dynamic Header & Document Settings Modal State
  const [headerModalOpen, setHeaderModalOpen] = useState(false);

  // Dynamic Document Header State
  const [docHeader, setDocHeader] = useState({
    schoolName: 'SMK NEGERI 1',
    teacherName: '',
    nip: '-',
    className: '',
    academicYear: '2026/2027',
  });

  // Dynamic Interactive Signature Block State
  const [signatureData, setSignatureData] = useState({
    place: 'Bandung',
    date: new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
    supervisorTitle: 'Mengetahui, Kepala Sekolah',
    supervisorName: '',
    supervisorNip: '-',
    teacherTitle: 'Guru Mata Pelajaran / Wali Kelas',
    teacherName: '',
    teacherNip: '-',
  });

  // Active filter states
  const [selectedSubject, setSelectedSubject] = useState<string>(
    subjects[0] || 'Matematika',
  );
  const [selectedCategory, setSelectedCategory] = useState<
    'Tugas' | 'UH' | 'UTS' | 'UAS'
  >('Tugas');

  // Local list states
  const [localGrades, setLocalGrades] = useState<GradeRow[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch header info for formal print document
  const { data: headerInfo } = useQuery({
    queryKey: ['attendanceHeaderInfo'],
    queryFn: () => getAttendanceHeaderInfo(),
  });

  // Sync headerInfo to docHeader & signatureData
  useEffect(() => {
    if (headerInfo) {
      const activeNip = (headerInfo.nip && headerInfo.nip.trim() !== '') ? headerInfo.nip : '-';
      setDocHeader((prev) => ({
        ...prev,
        schoolName: headerInfo.schoolName || prev.schoolName,
        teacherName: headerInfo.teacherName || prev.teacherName,
        nip: activeNip,
        className: headerInfo.className || prev.className,
      }));
      setSignatureData((prev) => ({
        ...prev,
        teacherName: headerInfo.teacherName || prev.teacherName,
        teacherNip: activeNip,
        supervisorName: headerInfo.principalName || prev.supervisorName,
        supervisorNip: (headerInfo.principalNip && headerInfo.principalNip.trim() !== '') ? headerInfo.principalNip : prev.supervisorNip,
      }));
    }
  }, [headerInfo]);

  // Fetch single category grades for data input
  const {
    data: serverGrades,
    isLoading,
    isError,
  } = useQuery<GradeRow[]>({
    queryKey: ['grades', selectedSubject, selectedCategory],
    queryFn: () => getGradesByFilter(selectedSubject, selectedCategory),
    enabled: !!selectedSubject && !!selectedCategory,
  });

  // Fetch single subject full grades recap for preview mode
  const { data: recapGrades, isLoading: isRecapLoading } = useQuery({
    queryKey: ['gradesRecap', selectedSubject],
    queryFn: () => getAllGradesRecap(selectedSubject),
    enabled: activeViewTab === 'preview' && reportViewMode === 'recap',
  });

  // Fetch all subjects grades recap for preview mode (Leger Rapor Kelas)
  const { data: allSubjectsRecapData, isLoading: isAllSubjectsLoading } =
    useQuery({
      queryKey: ['allSubjectsGradesRecap'],
      queryFn: () => getAllSubjectsGradesRecap(),
      enabled: activeViewTab === 'preview' && reportViewMode === 'all_subjects',
    });

  useEffect(() => {
    if (serverGrades) {
      setLocalGrades(serverGrades);
    }
  }, [serverGrades]);

  const handleSaveKkm = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(kkmInput);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('KKM harus berupa angka antara 0 dan 100.');
      return;
    }
    setIsUpdatingKkm(true);
    try {
      const res = await updateTeacherKkm(val);
      if (res.success) {
        setKkm(val);
        setEditKkmOpen(false);
        toast.success(`Batas KKM berhasil diperbarui menjadi ${val}`);
        queryClient.invalidateQueries({ queryKey: ['grades'] });
        queryClient.invalidateQueries({ queryKey: ['gradesRecap'] });
        queryClient.invalidateQueries({ queryKey: ['allSubjectsGradesRecap'] });
      } else {
        toast.error(res.error || 'Gagal memperbarui KKM.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memperbarui KKM.');
    } finally {
      setIsUpdatingKkm(false);
    }
  };

  const handleScoreChange = (studentId: string, value: string) => {
    if (value === '') {
      setLocalGrades((prev) =>
        prev.map((g) => (g.studentId === studentId ? { ...g, score: '' } : g)),
      );
      return;
    }

    const numVal = Number(value);
    if (numVal < 0 || numVal > 100 || isNaN(numVal)) {
      return;
    }

    setLocalGrades((prev) =>
      prev.map((g) =>
        g.studentId === studentId ? { ...g, score: numVal } : g,
      ),
    );
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      toast.error('Nama mata pelajaran tidak boleh kosong!');
      return;
    }

    if (subjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Mata pelajaran ini sudah ada.');
      return;
    }

    setSubjects((prev) => [...prev, trimmed].sort());
    setSelectedSubject(trimmed);
    setNewSubjectName('');
    setAddSubjectOpen(false);
    toast.success(`Berhasil menambahkan mata pelajaran "${trimmed}"`);
  };

  const handleSave = () => {
    if (localGrades.length === 0) {
      toast.error('Tidak ada data siswa untuk disimpan.');
      return;
    }

    startTransition(async () => {
      try {
        await saveBulkGrades(selectedSubject, selectedCategory, localGrades);

        queryClient.invalidateQueries({
          queryKey: ['grades', selectedSubject, selectedCategory],
        });
        queryClient.invalidateQueries({
          queryKey: ['gradesRecap', selectedSubject],
        });
        queryClient.invalidateQueries({
          queryKey: ['allSubjectsGradesRecap'],
        });

        toast.success(
          `Nilai ${selectedSubject} (${selectedCategory}) berhasil disimpan!`,
        );
      } catch (err: any) {
        toast.error(err.message || 'Gagal menyimpan nilai.');
      }
    });
  };

  const allSubjList = allSubjectsRecapData?.subjects || [];
  const allSubjRecapRows = allSubjectsRecapData?.recap || [];

  const handleExcelExport = async () => {
    if (reportViewMode === 'all_subjects') {
      if (!allSubjRecapRows || allSubjRecapRows.length === 0) {
        toast.error('Tidak ada data leger nilai untuk diekspor!');
        return;
      }
      toast.promise(
        exportAllSubjectsGradesRecapToExcel(allSubjList, allSubjRecapRows, kkm),
        {
          loading: 'Menyusun laporan Excel Leger Semua Mapel...',
          success: 'Excel Leger Nilai berhasil diunduh!',
          error: 'Gagal mengunduh Excel.',
        },
      );
    } else if (reportViewMode === 'recap') {
      if (!recapGrades || recapGrades.length === 0) {
        toast.error('Tidak ada data rekap nilai untuk diekspor!');
        return;
      }
      toast.promise(
        exportGradesRecapToExcel(recapGrades, selectedSubject, kkm),
        {
          loading: 'Menyusun laporan Excel Rekap Nilai...',
          success: 'Excel Rekap Nilai berhasil diunduh!',
          error: 'Gagal mengunduh Excel.',
        },
      );
    } else {
      if (localGrades.length === 0) {
        toast.error('Tidak ada data nilai untuk diekspor!');
        return;
      }
      toast.promise(
        exportGradesToExcel(localGrades, selectedSubject, selectedCategory),
        {
          loading: 'Menyusun laporan Excel nilai...',
          success: 'Excel nilai berhasil diunduh!',
          error: 'Gagal mengunduh Excel.',
        },
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Stats for All Subjects Mode
  const allSubjScoresOnly = allSubjRecapRows
    .map((g: any) =>
      g.overallAverage !== '' ? Number(g.overallAverage) : null,
    )
    .filter((s: number | null): s is number => s !== null);

  const allSubjTotalStudents = allSubjRecapRows.length;
  const allSubjAverageScore =
    allSubjScoresOnly.length > 0
      ? (
        allSubjScoresOnly.reduce((a: number, b: number) => a + b, 0) /
        allSubjScoresOnly.length
      ).toFixed(1)
      : '-';
  const allSubjPassedCount = allSubjRecapRows.filter(
    (g: any) => g.overallAverage !== '' && Number(g.overallAverage) >= kkm,
  ).length;
  const allSubjRemedialCount = allSubjRecapRows.filter(
    (g: any) => g.overallAverage !== '' && Number(g.overallAverage) < kkm,
  ).length;

  // Single Subject Recap Stats
  const recapScoresOnly = (recapGrades || [])
    .map((g: any) => (g.finalScore !== '' ? Number(g.finalScore) : null))
    .filter((s: number | null): s is number => s !== null);

  const recapTotalStudents = recapGrades?.length || 0;
  const recapAverageScore =
    recapScoresOnly.length > 0
      ? (
        recapScoresOnly.reduce((a: number, b: number) => a + b, 0) /
        recapScoresOnly.length
      ).toFixed(1)
      : '-';
  const recapPassedCount = (recapGrades || []).filter(
    (g: any) => g.finalScore !== '' && Number(g.finalScore) >= kkm,
  ).length;
  const recapRemedialCount = (recapGrades || []).filter(
    (g: any) => g.finalScore !== '' && Number(g.finalScore) < kkm,
  ).length;

  // Single Exam Category Stats
  const singleScoresOnly = localGrades
    .map((g) => (g.score !== '' ? Number(g.score) : null))
    .filter((s: number | null): s is number => s !== null);
  const singleAverageScore =
    singleScoresOnly.length > 0
      ? (
        singleScoresOnly.reduce((a: number, b: number) => a + b, 0) /
        singleScoresOnly.length
      ).toFixed(1)
      : '-';

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Top Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2'>
            Nilai Akademik
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Input dan kelola perolehan skor nilai tugas, UH, UTS, dan UAS siswa
            secara terstruktur.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
          <Dialog open={editKkmOpen} onOpenChange={setEditKkmOpen}>
            <DialogTrigger
              render={
                <Button
                  variant='outline'
                  className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer'
                />
              }
            >
              <Settings className='h-4 w-4 text-emerald-600' />
              <span>KKM: {kkm}</span>
            </DialogTrigger>
            <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm p-5 sm:p-6 shadow-2xl'>
              <form onSubmit={handleSaveKkm}>
                <DialogHeader>
                  <DialogTitle className='text-lg font-bold text-slate-900'>
                    Pengaturan Batas KKM
                  </DialogTitle>
                  <DialogDescription className='text-xs text-slate-500'>
                    Tentukan batas Kriteria Ketuntasan Minimal (KKM) untuk
                    evaluasi akademik kelas Anda.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4 py-4'>
                  <div className='space-y-1.5'>
                    <Label
                      htmlFor='kkm-input'
                      className='text-slate-700 text-sm font-semibold'
                    >
                      Batas Nilai KKM
                    </Label>
                    <Input
                      id='kkm-input'
                      type='number'
                      required
                      min={0}
                      max={100}
                      value={kkmInput}
                      onChange={(e) => setKkmInput(e.target.value)}
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl font-bold text-center text-lg'
                    />
                  </div>
                </div>
                <DialogFooter className='gap-2 sm:gap-0'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setEditKkmOpen(false)}
                    className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  >
                    Batal
                  </Button>
                  <Button
                    type='submit'
                    disabled={isUpdatingKkm}
                    className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 shadow-xs'
                  >
                    {isUpdatingKkm ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      'Simpan'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {activeViewTab === 'data' && (
            <Button
              onClick={handleSave}
              disabled={isPending || isLoading}
              className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-10 px-6 gap-2 shadow-xs cursor-pointer'
            >
              {isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <Check className='h-4 w-4' />
              )}
              Simpan Nilai
            </Button>
          )}
        </div>
      </div>

      {/* Top View Mode Navigation Tabs (Matching Jurnal Wali Kelas UI) */}
      <div className='flex items-center gap-2 p-1.5 bg-slate-200/80 border border-slate-300/80 rounded-2xl w-fit print:hidden'>
        <button
          onClick={() => setActiveViewTab('data')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeViewTab === 'data'
            ? 'bg-white text-emerald-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <GraduationCap className='h-4 w-4' />
          <span>Data Nilai Akademik</span>
        </button>
        <button
          onClick={() => setActiveViewTab('preview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeViewTab === 'preview'
            ? 'bg-white text-emerald-700 shadow-xs'
            : 'text-slate-600 hover:text-slate-900'
            }`}
        >
          <FileText className='h-4 w-4' />
          <span>Pratinjau Cetak (A4 PDF)</span>
        </button>
      </div>

      {/* Filter Card for Subject & Category (Input Mode) */}
      {activeViewTab === 'data' && (
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs print:hidden'>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 w-full'>
            {/* Subject Dropdown */}
            <div className='w-full sm:max-w-xs sm:flex-1'>
              <Select
                value={selectedSubject}
                onValueChange={(val) => val && setSelectedSubject(val)}
              >
                <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10'>
                  <SelectValue placeholder='Pilih Mata Pelajaran' />
                </SelectTrigger>
                <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                  {subjects.map((subj) => (
                    <SelectItem key={subj} value={subj}>
                      {subj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add Subject Dialog */}
            <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
              <DialogTrigger className='border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl h-10 px-4 gap-2 flex items-center justify-center cursor-pointer font-medium text-xs sm:text-sm shrink-0'>
                <Plus className='h-4 w-4 text-emerald-600' />
                Mata Pelajaran Baru
              </DialogTrigger>
              <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm p-5 sm:p-6 shadow-2xl'>
                <form onSubmit={handleAddSubject}>
                  <DialogHeader>
                    <DialogTitle className='text-lg font-bold text-slate-900'>
                      Tambah Mata Pelajaran
                    </DialogTitle>
                    <DialogDescription className='text-xs text-slate-500'>
                      Buat subjek/mapel baru yang belum ada di daftar bimbingan
                      kelas Anda.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-1.5'>
                      <Label
                        htmlFor='subj-name'
                        className='text-slate-700 text-sm font-semibold'
                      >
                        Nama Mata Pelajaran
                      </Label>
                      <Input
                        id='subj-name'
                        required
                        placeholder='Contoh: Fisika, Sejarah, Agama'
                        value={newSubjectName}
                        onChange={(e) => setNewSubjectName(e.target.value)}
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                      />
                    </div>
                  </div>
                  <DialogFooter className='gap-2 sm:gap-0'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={() => setAddSubjectOpen(false)}
                      className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                    >
                      Batal
                    </Button>
                    <Button
                      type='submit'
                      className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 shadow-xs'
                    >
                      Tambah
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <span className='hidden sm:inline text-slate-300'>|</span>

            {/* Test Category Dropdown */}
            <div className='w-full sm:w-48'>
              <Select
                value={selectedCategory}
                onValueChange={(val) => val && setSelectedCategory(val as any)}
              >
                <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10'>
                  <SelectValue placeholder='Pilih Kategori' />
                </SelectTrigger>
                <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                  <SelectItem value='Tugas'>Tugas</SelectItem>
                  <SelectItem value='UH'>UH (Ulangan Harian)</SelectItem>
                  <SelectItem value='UTS'>UTS (Tengah Semester)</SelectItem>
                  <SelectItem value='UAS'>UAS (Akhir Semester)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* MODE 1: DATA NILAI INPUT TABLE */}
      {activeViewTab === 'data' && (
        <Card className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs'>
          <CardContent className='p-0'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center py-20 text-slate-500 text-sm'>
                <Loader2 className='h-8 w-8 animate-spin text-emerald-600 mb-3' />
                <span>Memuat daftar nilai...</span>
              </div>
            ) : isError ? (
              <div className='text-center py-20 text-rose-600 text-sm font-medium'>
                Gagal memuat data nilai. Periksa koneksi server.
              </div>
            ) : localGrades.length > 0 ? (
              <Table>
                <TableHeader className='bg-slate-50/80 border-b border-slate-200'>
                  <TableRow className='border-b border-slate-200 hover:bg-transparent'>
                    <TableHead className='w-12 text-center text-slate-700 font-bold'>
                      No
                    </TableHead>
                    <TableHead className='w-32 text-slate-700 font-bold'>
                      NIS
                    </TableHead>
                    <TableHead className='text-slate-700 font-bold'>
                      Nama Lengkap
                    </TableHead>
                    <TableHead className='w-32 text-slate-700 font-bold'>
                      Kelas
                    </TableHead>
                    <TableHead className='w-48 text-center text-slate-700 font-bold'>
                      Nilai (0 - 100)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localGrades.map((row, index) => (
                    <TableRow
                      key={row.studentId}
                      className='border-b border-slate-100 hover:bg-slate-50/80 text-slate-700 transition-colors'
                    >
                      <TableCell className='text-center font-medium'>
                        {index + 1}
                      </TableCell>
                      <TableCell className='font-mono font-medium'>
                        {row.nis}
                      </TableCell>
                      <TableCell className='font-bold text-slate-900'>
                        {row.name}
                      </TableCell>
                      <TableCell className='font-medium'>
                        {row.className}
                      </TableCell>
                      <TableCell>
                        <div className='flex justify-center'>
                          <div className='relative w-28'>
                            <Input
                              type='number'
                              placeholder='Kosong'
                              min={0}
                              max={100}
                              value={row.score}
                              onChange={(e) =>
                                handleScoreChange(row.studentId, e.target.value)
                              }
                              className={`text-center font-bold rounded-xl focus:ring-1 focus:ring-emerald-500 h-9 pr-2 ${row.score !== '' && row.score < kkm
                                ? 'border-rose-300 text-rose-700 bg-rose-50 focus:border-rose-500'
                                : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500'
                                }`}
                            />
                            {row.score !== '' && row.score < kkm && (
                              <span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-extrabold text-rose-600 uppercase tracking-wider'>
                                &lt; KKM
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className='flex flex-col items-center justify-center py-20 text-slate-500'>
                <GraduationCap className='h-10 w-10 text-slate-300 mb-2' />
                <p className='text-sm font-bold text-slate-700'>
                  Tidak ada siswa terdaftar di kelas.
                </p>
                <p className='text-xs text-slate-400 mt-1'>
                  Silakan tambahkan siswa terlebih dahulu di halaman Data Siswa.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODE 2: PRATINJAU CETAK (A4 LIVE PRINT PREVIEW WITH INTERACTIVE DYNAMIC HEADER) */}
      {activeViewTab === 'preview' && (
        <div className='space-y-6'>
          {/* Live Preview Control Bar */}
          <div className='bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs print:hidden'>
            <div className='flex items-center gap-3'>
              <div className='p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h3 className='text-sm sm:text-base font-extrabold text-slate-900'>
                    Live Preview Cetak Nilai Akademik
                  </h3>
                  <span className='text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider'>
                    FORMAT A4 PDF
                  </span>
                </div>
                <p className='text-xs text-slate-500 mt-0.5'>
                  Klik teks header & tanda tangan di lembar A4 untuk mengedit
                  secara dinamis sebelum dicetak.
                </p>
              </div>
            </div>

            {/* Mode & Subject Selectors + Actions */}
            <div className='flex flex-wrap items-center gap-2.5'>
              {/* Header Info Dialog Modal Trigger Button */}
              <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant='outline'
                      className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs cursor-pointer'
                    />
                  }
                >
                  <Settings2 className='h-4 w-4 text-emerald-600' />
                  <span>Pengaturan Header</span>
                </DialogTrigger>
                <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md p-5 sm:p-6 shadow-2xl'>
                  <DialogHeader className='pb-3 border-b border-slate-200'>
                    <DialogTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                      <Settings2 className='h-5 w-5 text-emerald-600' />
                      Pengaturan Header & Tanda Tangan
                    </DialogTitle>
                    <DialogDescription className='text-xs text-slate-500'>
                      Edit metadata identitas sekolah, guru, dan pengesahan
                      cetak laporan secara dinamis.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-3.5 py-3 text-xs'>
                    <div className='space-y-1'>
                      <Label className='text-slate-700 font-semibold'>
                        Nama Sekolah / Instansi
                      </Label>
                      <Input
                        value={docHeader.schoolName}
                        onChange={(e) =>
                          setDocHeader({
                            ...docHeader,
                            schoolName: e.target.value,
                          })
                        }
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                      />
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          Nama Guru / Wali Kelas
                        </Label>
                        <Input
                          value={docHeader.teacherName}
                          onChange={(e) => {
                            setDocHeader({
                              ...docHeader,
                              teacherName: e.target.value,
                            });
                            setSignatureData((prev) => ({
                              ...prev,
                              teacherName: e.target.value,
                            }));
                          }}
                          className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          NIP Guru
                        </Label>
                        <Input
                          value={docHeader.nip}
                          onChange={(e) => {
                            setDocHeader({ ...docHeader, nip: e.target.value });
                            setSignatureData((prev) => ({
                              ...prev,
                              teacherNip: e.target.value,
                            }));
                          }}
                          className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          Kelas
                        </Label>
                        <Input
                          value={docHeader.className}
                          onChange={(e) =>
                            setDocHeader({
                              ...docHeader,
                              className: e.target.value,
                            })
                          }
                          className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          Jabatan Pengesah (Kiri)
                        </Label>
                        <Input
                          value={signatureData.supervisorTitle}
                          onChange={(e) =>
                            setSignatureData({
                              ...signatureData,
                              supervisorTitle: e.target.value,
                            })
                          }
                          className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          Nama Kepala Sekolah
                        </Label>
                        <Input
                          placeholder='Drs. H. Ahmad Dahlan, M.Pd.'
                          value={signatureData.supervisorName}
                          onChange={(e) =>
                            setSignatureData({
                              ...signatureData,
                              supervisorName: e.target.value,
                            })
                          }
                          className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          NIP Kepala Sekolah
                        </Label>
                        <Input
                          placeholder='19750812 200003 1 002'
                          value={signatureData.supervisorNip}
                          onChange={(e) =>
                            setSignatureData({
                              ...signatureData,
                              supervisorNip: e.target.value,
                            })
                          }
                          className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                        />
                      </div>
                    </div>
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          Kota Cetak
                        </Label>
                        <Input
                          value={signatureData.place}
                          onChange={(e) =>
                            setSignatureData({
                              ...signatureData,
                              place: e.target.value,
                            })
                          }
                          className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                        />
                      </div>
                      <div className='space-y-1'>
                        <Label className='text-slate-700 font-semibold'>
                          Tanggal Cetak
                        </Label>
                        <Input
                          value={signatureData.date}
                          onChange={(e) =>
                            setSignatureData({
                              ...signatureData,
                              date: e.target.value,
                            })
                          }
                          className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9'
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setHeaderModalOpen(false)}
                      className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl w-full'
                    >
                      Selesai Edit
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Report View Mode Selector Pills */}
              <div className='flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80'>
                <button
                  onClick={() => setReportViewMode('all_subjects')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${reportViewMode === 'all_subjects'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                >
                  Semua Mapel (Leger)
                </button>
                <button
                  onClick={() => setReportViewMode('recap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${reportViewMode === 'recap'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                >
                  Per Mapel (Lengkap)
                </button>
                <button
                  onClick={() => setReportViewMode('single')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${reportViewMode === 'single'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                >
                  Per Kategori
                </button>
              </div>

              {/* Subject Selector (Visible in recap & single modes) */}
              {(reportViewMode === 'recap' || reportViewMode === 'single') && (
                <Select
                  value={selectedSubject}
                  onValueChange={(val) => val && setSelectedSubject(val)}
                >
                  <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 w-44 text-xs font-semibold'>
                    <SelectValue placeholder='Pilih Mapel' />
                  </SelectTrigger>
                  <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                    {subjects.map((subj) => (
                      <SelectItem key={subj} value={subj}>
                        {subj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Category Selector (Only in single mode) */}
              {reportViewMode === 'single' && (
                <Select
                  value={selectedCategory}
                  onValueChange={(val) =>
                    val && setSelectedCategory(val as any)
                  }
                >
                  <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 w-32 text-xs font-semibold'>
                    <SelectValue placeholder='Kategori' />
                  </SelectTrigger>
                  <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                    <SelectItem value='Tugas'>Tugas</SelectItem>
                    <SelectItem value='UH'>UH</SelectItem>
                    <SelectItem value='UTS'>UTS</SelectItem>
                    <SelectItem value='UAS'>UAS</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Button
                onClick={handleExcelExport}
                variant='outline'
                className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs cursor-pointer'
              >
                <Download className='h-4 w-4 text-emerald-600' />
                Ekspor Excel
              </Button>
              <Button
                onClick={handlePrint}
                variant='outline'
                className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-4.5 gap-2 shadow-xs cursor-pointer'
              >
                <Printer className='h-4 w-4 text-blue-600' />
                Cetak PDF
              </Button>
            </div>
          </div>

          {/* Printable A4 Document Wrapper (With Interactive Editable Dynamic Headers & Signatures) */}
          <div className='bg-slate-200/70 p-4 sm:p-10 rounded-2xl border border-slate-300/80 flex justify-center shadow-inner print:p-0 print:bg-white print:border-none'>
            <div className='w-full max-w-[950px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-14 print:p-0 print:shadow-none print:border-none print:w-full print:max-w-none print:text-black font-sans leading-relaxed'>
              {/* Document KOP / Interactive Header Title */}
              <div className='text-center mb-6 border-b-2 border-slate-900 pb-4 print:border-black space-y-1'>
                <Input
                  value={docHeader.schoolName}
                  onChange={(e) =>
                    setDocHeader({ ...docHeader, schoolName: e.target.value })
                  }
                  className='text-center font-black uppercase tracking-wider text-lg sm:text-2xl text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-auto py-1 outline-none transition-all print:border-none print:p-0 bg-transparent w-full font-sans'
                  placeholder='SMK NEGERI 1'
                />
                <Input
                  value={
                    reportViewMode === 'all_subjects'
                      ? `LEGER REKAPITULASI HASIL EVALUASI NILAI AKADEMIK KELAS (SEMUA MAPEL)`
                      : reportViewMode === 'recap'
                        ? `LEGER REKAPITULASI HASIL EVALUASI NILAI AKADEMIK (${selectedSubject.toUpperCase()})`
                        : `LAPORAN HASIL EVALUASI NILAI AKADEMIK (${selectedSubject.toUpperCase()} - ${selectedCategory.toUpperCase()})`
                  }
                  readOnly
                  className='text-center font-bold uppercase text-xs sm:text-sm text-slate-800 print:text-black border-b border-transparent rounded-none h-auto py-1 outline-none print:border-none print:p-0 bg-transparent w-full font-sans cursor-default'
                />
                <Input
                  value={
                    reportViewMode === 'all_subjects'
                      ? `Transkrip Nilai Rapor Semua Mata Pelajaran Bimbingan`
                      : reportViewMode === 'recap'
                        ? `Mata Pelajaran: ${selectedSubject} | Rekapan Semua Nilai (Tugas, UH, UTS, UAS)`
                        : `Mata Pelajaran: ${selectedSubject} | Kategori: ${selectedCategory}`
                  }
                  readOnly
                  className='text-center font-medium italic text-xs text-slate-500 print:text-slate-800 border-b border-transparent rounded-none h-auto py-0.5 outline-none print:border-none print:p-0 bg-transparent w-full font-sans cursor-default'
                />
              </div>

              {/* Metadata Info Grid (Interactive Inputs) */}
              <div className='grid grid-cols-2 gap-y-2 gap-x-8 text-xs font-semibold text-slate-800 print:text-black mb-6 border-b border-slate-200 pb-4 print:border-zinc-300'>
                <div className='flex items-center gap-1.5'>
                  <span className='w-28 text-slate-500 font-bold shrink-0 print:text-black'>
                    Nama Sekolah
                  </span>
                  <span className='text-slate-400 font-bold'>:</span>
                  <Input
                    value={docHeader.schoolName}
                    onChange={(e) =>
                      setDocHeader({ ...docHeader, schoolName: e.target.value })
                    }
                    className='font-bold text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-6 px-1 py-0 outline-none transition-all print:border-none print:p-0 bg-transparent w-full text-xs'
                  />
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='w-28 text-slate-500 font-bold shrink-0 print:text-black'>
                    Wali Kelas / Guru
                  </span>
                  <span className='text-slate-400 font-bold'>:</span>
                  <Input
                    value={docHeader.teacherName}
                    onChange={(e) =>
                      setDocHeader({
                        ...docHeader,
                        teacherName: e.target.value,
                      })
                    }
                    className='font-bold text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-6 px-1 py-0 outline-none transition-all print:border-none print:p-0 bg-transparent w-full text-xs'
                  />
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='w-28 text-slate-500 font-bold shrink-0 print:text-black'>
                    Kelas
                  </span>
                  <span className='text-slate-400 font-bold'>:</span>
                  <Input
                    value={docHeader.className}
                    onChange={(e) =>
                      setDocHeader({ ...docHeader, className: e.target.value })
                    }
                    className='font-bold text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-6 px-1 py-0 outline-none transition-all print:border-none print:p-0 bg-transparent w-full text-xs'
                  />
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='w-28 text-slate-500 font-bold shrink-0 print:text-black'>
                    NIP
                  </span>
                  <span className='text-slate-400 font-bold'>:</span>
                  <Input
                    value={docHeader.nip}
                    onChange={(e) =>
                      setDocHeader({ ...docHeader, nip: e.target.value })
                    }
                    className='font-bold text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-6 px-1 py-0 outline-none transition-all print:border-none print:p-0 bg-transparent w-full text-xs'
                  />
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='w-28 text-slate-500 font-bold shrink-0 print:text-black'>
                    Rentang Laporan
                  </span>
                  <span className='text-slate-400 font-bold'>:</span>
                  <span className='font-bold text-slate-900 print:text-black px-1'>
                    {reportViewMode === 'all_subjects'
                      ? 'Semua Mata Pelajaran'
                      : selectedSubject}
                  </span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='w-28 text-slate-500 font-bold shrink-0 print:text-black'>
                    Batas KKM
                  </span>
                  <span className='text-slate-400 font-bold'>:</span>
                  <span className='font-bold text-emerald-700 print:text-black px-1'>
                    {kkm}
                  </span>
                </div>
              </div>

              {/* Summary Stats Badges */}
              <div className='grid grid-cols-4 gap-3 mb-6 p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs print:border-slate-300 print:bg-transparent'>
                <div>
                  <p className='text-[10px] text-slate-500 font-bold uppercase print:text-black'>
                    Total Siswa
                  </p>
                  <p className='text-sm font-extrabold text-slate-900 print:text-black'>
                    {reportViewMode === 'all_subjects'
                      ? allSubjTotalStudents
                      : reportViewMode === 'recap'
                        ? recapTotalStudents
                        : localGrades.length}
                  </p>
                </div>
                <div>
                  <p className='text-[10px] text-slate-500 font-bold uppercase print:text-black'>
                    Rata-Rata Nilai
                  </p>
                  <p className='text-sm font-extrabold text-emerald-700 print:text-black'>
                    {reportViewMode === 'all_subjects'
                      ? allSubjAverageScore
                      : reportViewMode === 'recap'
                        ? recapAverageScore
                        : singleAverageScore}
                  </p>
                </div>
                <div>
                  <p className='text-[10px] text-slate-500 font-bold uppercase print:text-black'>
                    Tuntas (&ge; KKM)
                  </p>
                  <p className='text-sm font-extrabold text-blue-700 print:text-black'>
                    {reportViewMode === 'all_subjects'
                      ? allSubjPassedCount
                      : reportViewMode === 'recap'
                        ? recapPassedCount
                        : localGrades.filter(
                          (g) => g.score !== '' && Number(g.score) >= kkm,
                        ).length}{' '}
                    Siswa
                  </p>
                </div>
                <div>
                  <p className='text-[10px] text-slate-500 font-bold uppercase print:text-black'>
                    Remedial (&lt; KKM)
                  </p>
                  <p className='text-sm font-extrabold text-rose-700 print:text-black'>
                    {reportViewMode === 'all_subjects'
                      ? allSubjRemedialCount
                      : reportViewMode === 'recap'
                        ? recapRemedialCount
                        : localGrades.filter(
                          (g) => g.score !== '' && Number(g.score) < kkm,
                        ).length}{' '}
                    Siswa
                  </p>
                </div>
              </div>

              {/* Printable Table MODE 1: ALL SUBJECTS LEGER MATRIX */}
              {reportViewMode === 'all_subjects' ? (
                <div className='mb-8 overflow-x-auto'>
                  {isAllSubjectsLoading ? (
                    <div className='flex items-center justify-center py-12 text-slate-500 text-xs'>
                      <Loader2 className='h-6 w-6 animate-spin text-emerald-600 mr-2' />
                      <span>
                        Memuat leger rekapitulasi semua mata pelajaran...
                      </span>
                    </div>
                  ) : (
                    <table className='w-full border-collapse border border-slate-300 text-xs'>
                      <thead>
                        <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-8'>
                            No
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-20'>
                            NIS
                          </th>
                          <th className='border border-slate-300 px-3 py-2 text-left font-bold'>
                            Nama Lengkap
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-16'>
                            Kelas
                          </th>
                          {allSubjList.map((subj: string) => (
                            <th
                              key={subj}
                              className='border border-slate-300 px-2 py-2 text-center font-bold'
                            >
                              {subj}
                            </th>
                          ))}
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-20 bg-emerald-50 print:bg-slate-300'>
                            Rata Rapor
                          </th>
                          <th className='border border-slate-300 px-2.5 py-2 text-center font-bold w-24'>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSubjRecapRows.map((row: any, idx: number) => {
                          const isScored = row.overallAverage !== '';
                          const isPassed =
                            isScored && Number(row.overallAverage) >= kkm;

                          return (
                            <tr
                              key={row.studentId}
                              className='border-b border-slate-200 hover:bg-slate-50'
                            >
                              <td className='border border-slate-300 px-2 py-2 text-center'>
                                {idx + 1}
                              </td>
                              <td className='border border-slate-300 px-2 py-2 text-center font-mono'>
                                {row.nis}
                              </td>
                              <td className='border border-slate-300 px-3 py-2 font-bold text-slate-900 print:text-black'>
                                {row.name}
                              </td>
                              <td className='border border-slate-300 px-2 py-2 text-center'>
                                {row.className}
                              </td>
                              {allSubjList.map((subj: string) => {
                                const sc = row.subjectScores[subj];
                                const isLow =
                                  sc !== '' &&
                                  sc !== undefined &&
                                  Number(sc) < kkm;
                                return (
                                  <td
                                    key={subj}
                                    className={`border border-slate-300 px-2 py-2 text-center font-semibold ${isLow
                                      ? 'text-rose-600 print:text-black font-bold'
                                      : ''
                                      }`}
                                  >
                                    {sc !== '' && sc !== undefined ? sc : '-'}
                                  </td>
                                );
                              })}
                              <td className='border border-slate-300 px-2 py-2 text-center font-black text-sm bg-slate-50 print:bg-transparent'>
                                {isScored ? row.overallAverage : '-'}
                              </td>
                              <td className='border border-slate-300 px-2.5 py-2 text-center font-bold'>
                                {!isScored ? (
                                  <span className='text-slate-400 print:text-black'>
                                    Belum Ada Nilai
                                  </span>
                                ) : isPassed ? (
                                  <span className='text-emerald-700 print:text-black'>
                                    Tuntas
                                  </span>
                                ) : (
                                  <span className='text-rose-700 print:text-black'>
                                    Remedial
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : reportViewMode === 'recap' ? (
                /* Printable Table MODE 2: SINGLE SUBJECT RECAP (Tugas, UH, UTS, UAS) */
                <div className='mb-8 overflow-x-auto'>
                  {isRecapLoading ? (
                    <div className='flex items-center justify-center py-12 text-slate-500 text-xs'>
                      <Loader2 className='h-6 w-6 animate-spin text-emerald-600 mr-2' />
                      <span>
                        Memuat rekapitulasi nilai {selectedSubject}...
                      </span>
                    </div>
                  ) : (
                    <table className='w-full border-collapse border border-slate-300 text-xs'>
                      <thead>
                        <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-10'>
                            No
                          </th>
                          <th className='border border-slate-300 px-2.5 py-2 text-center font-bold w-24'>
                            NIS
                          </th>
                          <th className='border border-slate-300 px-3 py-2 text-left font-bold'>
                            Nama Lengkap
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-20'>
                            Kelas
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-16'>
                            Tugas
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-16'>
                            UH
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-16'>
                            UTS
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-16'>
                            UAS
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-20 bg-emerald-50 print:bg-slate-300'>
                            Nilai Akhir
                          </th>
                          <th className='border border-slate-300 px-3 py-2 text-center font-bold w-28'>
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(recapGrades || []).map((row: any, idx: number) => {
                          const isScored = row.finalScore !== '';
                          const isPassed =
                            isScored && Number(row.finalScore) >= kkm;
                          return (
                            <tr
                              key={row.studentId}
                              className='border-b border-slate-200 hover:bg-slate-50'
                            >
                              <td className='border border-slate-300 px-2 py-2 text-center'>
                                {idx + 1}
                              </td>
                              <td className='border border-slate-300 px-2.5 py-2 text-center font-mono'>
                                {row.nis}
                              </td>
                              <td className='border border-slate-300 px-3 py-2 font-bold text-slate-900 print:text-black'>
                                {row.name}
                              </td>
                              <td className='border border-slate-300 px-2 py-2 text-center'>
                                {row.className}
                              </td>
                              <td className='border border-slate-300 px-2 py-2 text-center'>
                                {row.tugas !== '' ? row.tugas : '-'}
                              </td>
                              <td className='border border-slate-300 px-2 py-2 text-center'>
                                {row.uh !== '' ? row.uh : '-'}
                              </td>
                              <td className='border border-slate-300 px-2 py-2 text-center'>
                                {row.uts !== '' ? row.uts : '-'}
                              </td>
                              <td className='border border-slate-300 px-2 py-2 text-center'>
                                {row.uas !== '' ? row.uas : '-'}
                              </td>
                              <td className='border border-slate-300 px-2 py-2 text-center font-black text-sm bg-slate-50 print:bg-transparent'>
                                {isScored ? row.finalScore : '-'}
                              </td>
                              <td className='border border-slate-300 px-3 py-2 text-center font-bold'>
                                {!isScored ? (
                                  <span className='text-slate-400 print:text-black'>
                                    Belum Ada Nilai
                                  </span>
                                ) : isPassed ? (
                                  <span className='text-emerald-700 print:text-black'>
                                    Tuntas
                                  </span>
                                ) : (
                                  <span className='text-rose-700 print:text-black'>
                                    Remedial
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                /* Printable Table MODE 3: SINGLE EXAM CATEGORY */
                <div className='mb-8'>
                  <table className='w-full border-collapse border border-slate-300 text-xs'>
                    <thead>
                      <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                        <th className='border border-slate-300 px-3 py-2 text-center font-bold w-12'>
                          No
                        </th>
                        <th className='border border-slate-300 px-3 py-2 text-center font-bold w-32'>
                          NIS
                        </th>
                        <th className='border border-slate-300 px-3 py-2 text-left font-bold'>
                          Nama Lengkap
                        </th>
                        <th className='border border-slate-300 px-3 py-2 text-center font-bold w-24'>
                          Kelas
                        </th>
                        <th className='border border-slate-300 px-3 py-2 text-center font-bold w-28'>
                          Nilai ({selectedCategory})
                        </th>
                        <th className='border border-slate-300 px-3 py-2 text-center font-bold w-32'>
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {localGrades.map((row, idx) => {
                        const isScored = row.score !== '';
                        const isPassed = isScored && Number(row.score) >= kkm;
                        return (
                          <tr
                            key={row.studentId}
                            className='border-b border-slate-200'
                          >
                            <td className='border border-slate-300 px-3 py-2 text-center'>
                              {idx + 1}
                            </td>
                            <td className='border border-slate-300 px-3 py-2 text-center font-mono'>
                              {row.nis}
                            </td>
                            <td className='border border-slate-300 px-3 py-2 font-bold'>
                              {row.name}
                            </td>
                            <td className='border border-slate-300 px-3 py-2 text-center'>
                              {row.className}
                            </td>
                            <td className='border border-slate-300 px-3 py-2 text-center font-extrabold text-sm'>
                              {isScored ? row.score : '-'}
                            </td>
                            <td className='border border-slate-300 px-3 py-2 text-center font-bold'>
                              {!isScored ? (
                                <span className='text-slate-400 print:text-black'>
                                  Belum Dinilai
                                </span>
                              ) : isPassed ? (
                                <span className='text-emerald-700 print:text-black'>
                                  Tuntas
                                </span>
                              ) : (
                                <span className='text-rose-700 print:text-black'>
                                  Remedial (&lt; KKM)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Official Interactive Signature Section (Matching Jurnal Wali Kelas) */}
              <div className='mt-12 pt-6 grid grid-cols-2 gap-8 text-xs text-slate-900 print:text-black font-semibold break-inside-avoid'>
                {/* Left Column: Supervisor / Principal */}
                <div className='space-y-1.5'>
                  <p className='font-bold text-slate-800 print:text-black'>
                    Mengetahui,
                  </p>
                  <Input
                    value={signatureData.supervisorTitle}
                    onChange={(e) =>
                      setSignatureData({
                        ...signatureData,
                        supervisorTitle: e.target.value,
                      })
                    }
                    className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full max-w-xs print:border-none print:p-0'
                  />
                  <div className='h-20' /> {/* Signature Space */}
                  <div className='space-y-1'>
                    <Input
                      placeholder='Ketik nama kepsek...'
                      value={signatureData.supervisorName}
                      onChange={(e) =>
                        setSignatureData({
                          ...signatureData,
                          supervisorName: e.target.value,
                        })
                      }
                      className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full max-w-xs print:border-none print:p-0'
                    />
                    <div className='flex items-center gap-1 text-[11px] text-slate-700 print:text-black'>
                      <span>NIP.</span>
                      <Input
                        placeholder='Ketik NIP...'
                        value={signatureData.supervisorNip}
                        onChange={(e) =>
                          setSignatureData({
                            ...signatureData,
                            supervisorNip: e.target.value,
                          })
                        }
                        className='text-[11px] border-b border-slate-300 border-x-0 border-t-0 rounded-none h-5 px-0 focus:border-emerald-600 w-44 print:border-none print:p-0'
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Class / Subject Teacher */}
                <div className='space-y-1.5 sm:pl-8'>
                  <div className='flex items-center gap-1 mb-1'>
                    <Input
                      value={signatureData.place}
                      onChange={(e) =>
                        setSignatureData({
                          ...signatureData,
                          place: e.target.value,
                        })
                      }
                      style={{
                        width: `${Math.max((signatureData.place || '').length * 7.5 + 4, 60)}px`,
                      }}
                      className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 print:border-none print:p-0'
                    />
                    <span>,</span>
                    <Input
                      value={signatureData.date}
                      onChange={(e) =>
                        setSignatureData({
                          ...signatureData,
                          date: e.target.value,
                        })
                      }
                      style={{
                        width: `${Math.max((signatureData.date || '').length * 7.5 + 4, 80)}px`,
                      }}
                      className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 print:border-none print:p-0'
                    />
                  </div>
                  <Input
                    value={signatureData.teacherTitle}
                    onChange={(e) =>
                      setSignatureData({
                        ...signatureData,
                        teacherTitle: e.target.value,
                      })
                    }
                    className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full max-w-xs print:border-none print:p-0'
                  />
                  <div className='h-20' /> {/* Signature Space */}
                  <div className='space-y-1'>
                    <Input
                      value={signatureData.teacherName}
                      onChange={(e) =>
                        setSignatureData({
                          ...signatureData,
                          teacherName: e.target.value,
                        })
                      }
                      className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full max-w-xs print:border-none print:p-0'
                    />
                    <div className='flex items-center gap-1 text-[11px] text-slate-700 print:text-black'>
                      <span>NIP.</span>
                      <Input
                        value={signatureData.teacherNip}
                        onChange={(e) =>
                          setSignatureData({
                            ...signatureData,
                            teacherNip: e.target.value,
                          })
                        }
                        className='text-[11px] border-b border-slate-300 border-x-0 border-t-0 rounded-none h-5 px-0 focus:border-emerald-600 w-44 print:border-none print:p-0'
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
