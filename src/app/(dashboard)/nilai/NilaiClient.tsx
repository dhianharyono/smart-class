'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Loader2,
  Check,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Settings,
  Printer,
  FileText,
  Settings2,
  Upload,
  RotateCcw,
  ImageIcon,
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
  addSubject,
  renameSubject,
  deleteSubject,
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

  // Dynamic Header & Document Settings Modal State
  const [headerModalOpen, setHeaderModalOpen] = useState(false);

  // Dynamic Document Header State
  const [docHeader, setDocHeader] = useState({
    useOfficialKop: false,
    logoUrl: '/icon.svg',
    schoolName: 'SMK NEGERI 1',
    subHeader1: '',
    subHeader2: '',
    subHeader3: '',
    addressLine: '',
    cityRegency: '',
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
    supervisorTitle: 'Kepala Sekolah',
    supervisorName: '',
    supervisorNip: '-',
    teacherTitle: 'Guru Mata Pelajaran / Wali Kelas',
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
      headerInfo?.schoolName?.toLowerCase().includes('purnama asih') ||
      docHeader.schoolName?.toLowerCase().includes('purnama asih');
    const defaultLogo = isSlb ? '/logo-resmi-slb.png' : '/icon.svg';
    updateDocHeader({ logoUrl: defaultLogo });
    toast.success('Logo dikembalikan ke logo default.');
  };

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
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  // Edit & Delete Subject states
  const [editSubjectOpen, setEditSubjectOpen] = useState(false);
  const [editSubjectName, setEditSubjectName] = useState('');
  const [isRenamingSubject, setIsRenamingSubject] = useState(false);

  const [deleteSubjectOpen, setDeleteSubjectOpen] = useState(false);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load saved kop settings & signature from localStorage on client mount
  useEffect(() => {
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

  // Fetch header info for formal print document
  const { data: headerInfo } = useQuery({
    queryKey: ['attendanceHeaderInfo'],
    queryFn: () => getAttendanceHeaderInfo(),
  });

  // Sync headerInfo to docHeader & signatureData
  useEffect(() => {
    if (headerInfo) {
      const activeNip =
        headerInfo.nip && headerInfo.nip.trim() !== '' ? headerInfo.nip : '-';
      setDocHeader((prev) => ({
        ...prev,
        schoolName: prev.schoolName || headerInfo.schoolName || 'SMK NEGERI 1',
        teacherName: prev.teacherName || headerInfo.teacherName || '',
        nip: prev.nip && prev.nip !== '-' ? prev.nip : activeNip,
        className: prev.className || headerInfo.className || '',
      }));
      setSignatureData((prev) => ({
        ...prev,
        teacherName: prev.teacherName || headerInfo.teacherName || '',
        teacherNip:
          prev.teacherNip && prev.teacherNip !== '-' ? prev.teacherNip : activeNip,
        supervisorName:
          prev.supervisorName || headerInfo.principalName || '',
        supervisorNip:
          prev.supervisorNip && prev.supervisorNip !== '-'
            ? prev.supervisorNip
            : headerInfo.principalNip || '-',
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

  const handleAddSubject = async (e: React.FormEvent) => {
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

    setIsAddingSubject(true);
    try {
      const res = await addSubject(trimmed);
      if (res.success && res.subjects) {
        setSubjects(res.subjects);
        setSelectedSubject(trimmed);
        setNewSubjectName('');
        setAddSubjectOpen(false);
        queryClient.invalidateQueries({ queryKey: ['grades'] });
        queryClient.invalidateQueries({ queryKey: ['gradesRecap'] });
        queryClient.invalidateQueries({ queryKey: ['allSubjectsGradesRecap'] });
        toast.success(`Berhasil menambahkan mata pelajaran "${trimmed}"`);
      } else {
        toast.error(res.error || 'Gagal menambahkan mata pelajaran.');
      }
    } catch (err: any) {
      toast.error(
        err.message || 'Terjadi kesalahan saat menambahkan mata pelajaran.',
      );
    } finally {
      setIsAddingSubject(false);
    }
  };

  const openEditSubjectDialog = () => {
    if (!selectedSubject) return;
    setEditSubjectName(selectedSubject);
    setEditSubjectOpen(true);
  };

  const handleRenameSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editSubjectName.trim();
    if (!trimmed) {
      toast.error('Nama mata pelajaran tidak boleh kosong!');
      return;
    }

    if (trimmed.toLowerCase() === selectedSubject.toLowerCase()) {
      setEditSubjectOpen(false);
      return;
    }

    if (
      subjects.some(
        (s) =>
          s.toLowerCase() === trimmed.toLowerCase() &&
          s.toLowerCase() !== selectedSubject.toLowerCase(),
      )
    ) {
      toast.error('Mata pelajaran dengan nama tersebut sudah ada.');
      return;
    }

    setIsRenamingSubject(true);
    try {
      const res = await renameSubject(selectedSubject, trimmed);
      if (res.success && res.subjects) {
        setSubjects(res.subjects);
        setSelectedSubject(trimmed);
        setEditSubjectOpen(false);
        queryClient.invalidateQueries({ queryKey: ['grades'] });
        queryClient.invalidateQueries({ queryKey: ['gradesRecap'] });
        queryClient.invalidateQueries({ queryKey: ['allSubjectsGradesRecap'] });
        toast.success(`Mata pelajaran berhasil diubah menjadi "${trimmed}"`);
      } else {
        toast.error(res.error || 'Gagal mengubah nama mata pelajaran.');
      }
    } catch (err: any) {
      toast.error(
        err.message || 'Terjadi kesalahan saat mengubah nama mata pelajaran.',
      );
    } finally {
      setIsRenamingSubject(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;
    if (subjects.length <= 1) {
      toast.error('Minimal harus ada satu mata pelajaran di kelas.');
      return;
    }

    setIsDeletingSubject(true);
    try {
      const subjectToDelete = selectedSubject;
      const res = await deleteSubject(subjectToDelete);
      if (res.success && res.subjects) {
        setSubjects(res.subjects);
        const nextSubject = res.subjects[0] || '';
        setSelectedSubject(nextSubject);
        setDeleteSubjectOpen(false);
        queryClient.invalidateQueries({ queryKey: ['grades'] });
        queryClient.invalidateQueries({ queryKey: ['gradesRecap'] });
        queryClient.invalidateQueries({ queryKey: ['allSubjectsGradesRecap'] });
        toast.success(
          `Mata pelajaran "${subjectToDelete}" dan seluruh nilai terkait berhasil dihapus.`,
        );
      } else {
        toast.error(res.error || 'Gagal menghapus mata pelajaran.');
      }
    } catch (err: any) {
      toast.error(
        err.message || 'Terjadi kesalahan saat menghapus mata pelajaran.',
      );
    } finally {
      setIsDeletingSubject(false);
    }
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

          {localGrades.length === 0 && !isLoading ? (
            <Link href='/siswa'>
              <Button className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer justify-center'>
                <Plus className='h-4 w-4' />
                <span>Input Data Siswa Sekarang</span>
              </Button>
            </Link>
          ) : (
            activeViewTab === 'data' && (
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
            )
          )}
        </div>
      </div>

      {/* Top View Mode Navigation Tabs (Matching Jurnal Wali Kelas UI) */}
      <div className='grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-200/80 border border-slate-300/80 rounded-2xl w-full sm:w-fit print:hidden'>
        <button
          onClick={() => setActiveViewTab('data')}
          className={`flex items-center justify-center text-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer w-full sm:w-auto ${
            activeViewTab === 'data'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className='h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0' />
          <span className='truncate'>Data Nilai Akademik</span>
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

      {/* Filter Card for Subject & Category (Input Mode) */}
      {activeViewTab === 'data' && (
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs print:hidden'>
          <div className='flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 w-full'>
            {/* Subject Dropdown with Edit and Delete Action Buttons */}
            <div className='flex items-center gap-1.5 w-full sm:max-w-md sm:flex-1'>
              <div className='flex-1'>
                <Select
                  value={selectedSubject}
                  onValueChange={(val) => val && setSelectedSubject(val)}
                >
                  <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 w-full font-medium'>
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

              {/* Edit Subject Button */}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={openEditSubjectDialog}
                disabled={!selectedSubject}
                title={`Ubah nama mata pelajaran "${selectedSubject}"`}
                className='h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-600 transition-colors cursor-pointer'
              >
                <Pencil className='h-4 w-4' />
                <span className='sr-only'>Edit Mata Pelajaran</span>
              </Button>

              {/* Delete Subject Button */}
              <Button
                type='button'
                variant='ghost'
                size='icon'
                onClick={() => setDeleteSubjectOpen(true)}
                disabled={!selectedSubject || subjects.length <= 1}
                title={
                  subjects.length <= 1
                    ? 'Minimal harus ada 1 mata pelajaran'
                    : `Hapus mata pelajaran "${selectedSubject}"`
                }
                className='h-10 w-10 shrink-0 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 transition-colors cursor-pointer disabled:opacity-40'
              >
                <Trash2 className='h-4 w-4' />
                <span className='sr-only'>Hapus Mata Pelajaran</span>
              </Button>
            </div>

            {/* Edit Subject Dialog */}
            <Dialog open={editSubjectOpen} onOpenChange={setEditSubjectOpen}>
              <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm p-5 sm:p-6 shadow-2xl'>
                <form onSubmit={handleRenameSubject}>
                  <DialogHeader>
                    <DialogTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                      <Pencil className='h-4 w-4 text-emerald-600' />
                      Ubah Nama Mapel
                    </DialogTitle>
                    <DialogDescription className='text-xs text-slate-500'>
                      Ubah nama mata pelajaran &quot;{selectedSubject}&quot;.
                      Seluruh nilai siswa yang sudah tersimpan akan otomatis
                      disinkronkan.
                    </DialogDescription>
                  </DialogHeader>
                  <div className='space-y-4 py-4'>
                    <div className='space-y-1.5'>
                      <Label
                        htmlFor='edit-subj-name'
                        className='text-slate-700 text-sm font-semibold'
                      >
                        Nama Mata Pelajaran
                      </Label>
                      <Input
                        id='edit-subj-name'
                        required
                        value={editSubjectName}
                        onChange={(e) => setEditSubjectName(e.target.value)}
                        className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                      />
                    </div>
                  </div>
                  <DialogFooter className='gap-2 sm:gap-0'>
                    <Button
                      type='button'
                      variant='ghost'
                      onClick={() => setEditSubjectOpen(false)}
                      className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl'
                    >
                      Batal
                    </Button>
                    <Button
                      type='submit'
                      disabled={isRenamingSubject || !editSubjectName.trim()}
                      className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 shadow-xs'
                    >
                      {isRenamingSubject ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        'Simpan Perubahan'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Subject Confirmation Dialog */}
            <Dialog
              open={deleteSubjectOpen}
              onOpenChange={setDeleteSubjectOpen}
            >
              <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md p-5 sm:p-6 shadow-2xl'>
                <DialogHeader>
                  <div className='w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-2'>
                    <AlertTriangle className='h-5 w-5' />
                  </div>
                  <DialogTitle className='text-lg font-bold text-slate-900'>
                    Hapus Mata Pelajaran?
                  </DialogTitle>
                  <div className='text-xs text-slate-500 space-y-2 pt-1'>
                    <p>
                      Apakah Anda yakin ingin menghapus mata pelajaran{' '}
                      <strong className='text-slate-800 font-semibold'>
                        &quot;{selectedSubject}&quot;
                      </strong>
                      ?
                    </p>
                    <p className='text-rose-600 font-medium bg-rose-50 border border-rose-100 rounded-xl p-3'>
                      Peringatan: Seluruh riwayat nilai siswa (Tugas, UH, UTS,
                      UAS) pada mata pelajaran ini akan dihapus secara permanen
                      dari basis data.
                    </p>
                  </div>
                </DialogHeader>
                <DialogFooter className='gap-2 sm:gap-0 pt-3'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setDeleteSubjectOpen(false)}
                    disabled={isDeletingSubject}
                    className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl'
                  >
                    Batal
                  </Button>
                  <Button
                    type='button'
                    onClick={handleDeleteSubject}
                    disabled={isDeletingSubject}
                    className='bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl px-4 shadow-xs gap-1.5 cursor-pointer'
                  >
                    {isDeletingSubject ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Trash2 className='h-4 w-4' />
                    )}
                    Hapus Mata Pelajaran
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Add Subject Dialog */}
            <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
              <DialogTrigger className='border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl h-10 px-4 gap-2 flex items-center justify-center cursor-pointer font-medium text-xs sm:text-sm w-full sm:w-auto shrink-0'>
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
                      className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl'
                    >
                      Batal
                    </Button>
                    <Button
                      type='submit'
                      disabled={isAddingSubject || !newSubjectName.trim()}
                      className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 shadow-xs'
                    >
                      {isAddingSubject ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                      ) : (
                        'Tambah'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <span className='hidden sm:inline text-slate-300'>|</span>

            {/* Test Category Dropdown */}
            <div className='w-full sm:w-56 shrink-0'>
              <Select
                value={selectedCategory}
                onValueChange={(val) => val && setSelectedCategory(val as any)}
              >
                <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 px-3.5'>
                  <SelectValue placeholder='Pilih Kategori' />
                </SelectTrigger>
                <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl min-w-[220px] shadow-xl'>
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
                              className={`text-center font-bold rounded-xl focus:ring-1 focus:ring-emerald-500 h-9 pr-2 ${
                                row.score !== '' && row.score < kkm
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
              <div className='flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center text-slate-500 max-w-md mx-auto space-y-3'>
                <div className='h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs'>
                  <GraduationCap className='h-7 w-7' />
                </div>
                <div>
                  <p className='text-base font-extrabold text-slate-900 tracking-tight'>
                    Tidak ada siswa terdaftar di kelas.
                  </p>
                  <p className='text-xs text-slate-500 mt-1 font-medium leading-relaxed'>
                    Silakan tambahkan siswa terlebih dahulu di halaman Data
                    Siswa.
                  </p>
                </div>
                <Link href='/siswa'>
                  <Button className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-5 gap-2 shadow-xs cursor-pointer mt-1'>
                    <Plus className='h-4 w-4' />
                    <span>Input Data Siswa Sekarang</span>
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODE 2: PRATINJAU CETAK (A4 LIVE PRINT PREVIEW WITH INTERACTIVE DYNAMIC HEADER) */}
      {activeViewTab === 'preview' && (
        <div className='space-y-6'>
          {/* Live Preview Control Bar */}
          <div className='bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4 shadow-xs print:hidden'>
            <div className='flex items-center gap-3 shrink-0'>
              <div className='p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h3 className='text-sm sm:text-base font-extrabold text-slate-900'>
                    Live Preview Cetak Nilai Akademik
                  </h3>
                  <span className='text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0'>
                    FORMAT A4 PDF
                  </span>
                </div>
                <p className='text-xs text-slate-500 mt-0.5'>
                  Klik teks header & tanda tangan di lembar A4 untuk mengedit
                  secara dinamis sebelum dicetak.
                </p>
              </div>
            </div>

            {/* Mode & Subject Selectors + Actions Container */}
            <div className='flex flex-wrap items-center justify-between 2xl:justify-end gap-2.5 w-full 2xl:w-auto border-t border-slate-100 2xl:border-t-0 pt-3.5 2xl:pt-0'>
              {/* Filter Group: Modal Trigger & Selectors */}
              <div className='flex flex-wrap items-center gap-2 w-full sm:w-auto'>
                {/* Header Info Dialog Modal Trigger Button */}
                <Dialog
                  open={headerModalOpen}
                  onOpenChange={setHeaderModalOpen}
                >
                  <DialogTrigger
                    render={
                      <Button
                        variant='outline'
                        className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center'
                      />
                    }
                  >
                    <Settings2 className='h-4 w-4 text-emerald-600' />
                    <span>Pengaturan Header</span>
                  </DialogTrigger>
                  <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl w-[calc(100vw-1.5rem)] max-w-[calc(100vw-1.5rem)] sm:w-full sm:max-w-4xl lg:max-w-5xl p-0 shadow-2xl overflow-hidden'>
                    <DialogHeader className='p-5 sm:p-6 pb-4 border-b border-slate-100 bg-slate-50/50'>
                      <DialogTitle className='text-lg font-bold text-slate-900 flex items-center gap-2.5'>
                        <div>
                          <div>Kustomisasi Kop Surat & Tanda Tangan</div>
                          <DialogDescription className='text-xs text-slate-500 font-normal mt-0.5'>
                            Konfigurasi logo instansi, teks kop surat resmi dinas,
                            dan identitas pengesahan laporan.
                          </DialogDescription>
                        </div>
                      </DialogTitle>
                    </DialogHeader>

                    <div className='p-5 sm:p-7 pb-8 max-h-[70vh] overflow-y-auto space-y-6 text-xs'>
                      {/* Switch / Toggle: Gunakan Kop Resmi */}
                      <div className='flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60'>
                        <div className='space-y-0.5'>
                          <div className='font-bold text-slate-900 text-sm flex items-center gap-2'>
                            Format Kop Surat Dinas
                            <span className='px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800'>
                              {docHeader.useOfficialKop
                                ? 'Aktif (Resmi)'
                                : 'Standar'}
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
                          variant={
                            docHeader.useOfficialKop ? 'default' : 'outline'
                          }
                          onClick={() =>
                            updateDocHeader({
                              useOfficialKop: !docHeader.useOfficialKop,
                            })
                          }
                          className={`rounded-xl text-xs font-semibold h-8 px-3 transition-all ${
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
                                htmlFor='modal-logo-file-input-nilai'
                                className='cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-colors'
                              >
                                <Upload className='h-3 w-3' />
                                Upload Logo Baru
                              </label>
                              <input
                                id='modal-logo-file-input-nilai'
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
                                className='h-7 px-2 text-slate-500 hover:text-slate-700 text-xs gap-1'
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
                                Terapkan format standar sekolah atau gunakan
                                format khusus.
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
                                      headerInfo?.schoolName || 'SMK NEGERI 1',
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
                                Format JPG/PNG/WebP/SVG, disarankan logo
                                transparan atau latar putih bundar.
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
                                placeholder='Contoh: SMA NEGERI 1 / SATUAN PENDIDIKAN'
                                className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                              />
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                              <div className='space-y-1'>
                                <Label className='text-slate-700 font-semibold'>
                                  Baris 3 (Izin Operasional)
                                </Label>
                                <Input
                                  value={docHeader.subHeader2}
                                  onChange={(e) =>
                                    updateDocHeader({
                                      subHeader2: e.target.value,
                                    })
                                  }
                                  placeholder='Contoh: NPSN: 12345678 / Akreditasi A'
                                  className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                                />
                              </div>
                              <div className='space-y-1'>
                                <Label className='text-slate-700 font-semibold'>
                                  Baris 4 (Nomor Registrasi)
                                </Label>
                                <Input
                                  value={docHeader.subHeader3}
                                  onChange={(e) =>
                                    updateDocHeader({
                                      subHeader3: e.target.value,
                                    })
                                  }
                                  placeholder='Contoh: SK Izin Operasional No: ...'
                                  className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                                />
                              </div>
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                              <div className='space-y-1'>
                                <Label className='text-slate-700 font-semibold'>
                                  Baris 5 (Alamat Lengkap & Kontak)
                                </Label>
                                <Input
                                  value={docHeader.addressLine}
                                  onChange={(e) =>
                                    updateDocHeader({
                                      addressLine: e.target.value,
                                    })
                                  }
                                  placeholder='Contoh: Jl. Pendidikan No. 12 Telp. (021) 1234567'
                                  className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                                />
                              </div>
                              <div className='space-y-1'>
                                <Label className='text-slate-700 font-semibold'>
                                  Baris 6 (Kabupaten / Kota)
                                </Label>
                                <Input
                                  value={docHeader.cityRegency}
                                  onChange={(e) =>
                                    updateDocHeader({
                                      cityRegency: e.target.value,
                                    })
                                  }
                                  placeholder='Contoh: KOTA / KABUPATEN'
                                  className='bg-white border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Section Identitas Pengesahan & Tanda Tangan */}
                      <div className='space-y-3.5 rounded-xl border border-slate-200 bg-white p-4'>
                        <h5 className='font-bold text-slate-800 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-100 flex items-center gap-1.5'>
                          <FileText className='h-3.5 w-3.5 text-emerald-600' />
                          Identitas Guru & Pengesahan Dokumen
                        </h5>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                          <div className='space-y-1'>
                            <Label className='text-slate-700 font-semibold'>
                              Nama Guru / Wali Kelas
                            </Label>
                            <Input
                              value={docHeader.teacherName}
                              onChange={(e) => {
                                updateDocHeader({ teacherName: e.target.value });
                                updateSignatureData({
                                  teacherName: e.target.value,
                                });
                              }}
                              className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                            />
                          </div>
                          <div className='space-y-1'>
                            <Label className='text-slate-700 font-semibold'>
                              NIP/NUPTK Guru
                            </Label>
                            <Input
                              value={docHeader.nip}
                              onChange={(e) => {
                                updateDocHeader({ nip: e.target.value });
                                updateSignatureData({
                                  teacherNip: e.target.value,
                                });
                              }}
                              className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                            />
                          </div>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                          <div className='space-y-1'>
                            <Label className='text-slate-700 font-semibold'>
                              Kelas (Laporan)
                            </Label>
                            <Input
                              value={docHeader.className}
                              onChange={(e) =>
                                updateDocHeader({ className: e.target.value })
                              }
                              className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                            />
                          </div>
                          <div className='space-y-1'>
                            <Label className='text-slate-700 font-semibold'>
                              Jabatan Pengesah (Kiri)
                            </Label>
                            <Input
                              value={signatureData.supervisorTitle}
                              placeholder='Kepala Sekolah'
                              onChange={(e) =>
                                updateSignatureData({
                                  supervisorTitle: e.target.value,
                                })
                              }
                              className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                            />
                          </div>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                          <div className='space-y-1'>
                            <Label className='text-slate-700 font-semibold'>
                              Nama Kepala Sekolah
                            </Label>
                            <Input
                              placeholder='Drs. H. Ahmad Dahlan, M.Pd.'
                              value={signatureData.supervisorName}
                              onChange={(e) =>
                                updateSignatureData({
                                  supervisorName: e.target.value,
                                })
                              }
                              className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                            />
                          </div>
                          <div className='space-y-1'>
                            <Label className='text-slate-700 font-semibold'>
                              NIP/NUPTK Kepala Sekolah
                            </Label>
                            <Input
                              placeholder='19750812 200003 1 002'
                              value={signatureData.supervisorNip}
                              onChange={(e) =>
                                updateSignatureData({
                                  supervisorNip: e.target.value,
                                })
                              }
                              className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                            />
                          </div>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                          <div className='space-y-1'>
                            <Label className='text-slate-700 font-semibold'>
                              Jabatan Pembuat Laporan (Kanan)
                            </Label>
                            <Input
                              value={signatureData.teacherTitle}
                              placeholder='Guru Mata Pelajaran / Wali Kelas'
                              onChange={(e) =>
                                updateSignatureData({
                                  teacherTitle: e.target.value,
                                })
                              }
                              className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                            />
                          </div>
                          <div className='grid grid-cols-2 gap-2'>
                            <div className='space-y-1'>
                              <Label className='text-slate-700 font-semibold'>
                                Tempat Cetak
                              </Label>
                              <Input
                                value={signatureData.place}
                                onChange={(e) =>
                                  updateSignatureData({
                                    place: e.target.value,
                                  })
                                }
                                className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                              />
                            </div>
                            <div className='space-y-1'>
                              <Label className='text-slate-700 font-semibold'>
                                Tanggal Cetak
                              </Label>
                              <Input
                                value={signatureData.date}
                                onChange={(e) =>
                                  updateSignatureData({
                                    date: e.target.value,
                                  })
                                }
                                className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className='p-4 sm:px-7 sm:py-4 border-t border-slate-200 gap-3 shrink-0 bg-slate-50 flex flex-row items-center justify-between'>
                      <span className='text-xs text-slate-500 font-medium hidden sm:inline'>
                        Perubahan tersimpan otomatis di browser & profil laporan
                      </span>
                      <div className='flex items-center gap-2 ml-auto'>
                        <Button
                          type='button'
                          variant='ghost'
                          onClick={() => setHeaderModalOpen(false)}
                          className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 text-xs rounded-xl h-9 px-4 cursor-pointer'
                        >
                          Tutup
                        </Button>
                        <Button
                          type='button'
                          onClick={() => {
                            setHeaderModalOpen(false);
                            toast.success('Pengaturan header berhasil disimpan.');
                          }}
                          className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-5 h-9 gap-2 shadow-xs cursor-pointer'
                        >
                          Simpan Pengaturan
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Select
                  value={reportViewMode}
                  onValueChange={(val) =>
                    val &&
                    setReportViewMode(
                      val as 'all_subjects' | 'recap' | 'single',
                    )
                  }
                >
                  <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl h-10 w-full sm:w-52 text-xs font-bold shadow-xs cursor-pointer'>
                    <SelectValue>
                      {reportViewMode === 'all_subjects'
                        ? 'Semua Mapel (Leger)'
                        : reportViewMode === 'recap'
                          ? 'Per Mapel (Lengkap)'
                          : 'Per Kategori'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl shadow-xl'>
                    <SelectItem
                      value='all_subjects'
                      className='text-xs font-semibold cursor-pointer'
                    >
                      Semua Mapel (Leger)
                    </SelectItem>
                    <SelectItem
                      value='recap'
                      className='text-xs font-semibold cursor-pointer'
                    >
                      Per Mapel (Lengkap)
                    </SelectItem>
                    <SelectItem
                      value='single'
                      className='text-xs font-semibold cursor-pointer'
                    >
                      Per Kategori
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Subject Selector (Visible in recap & single modes) */}
                {(reportViewMode === 'recap' ||
                  reportViewMode === 'single') && (
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
              </div>

              {/* Action Group: Excel & PDF Buttons */}
              <div className='flex items-center gap-2 w-full sm:w-auto shrink-0'>
                <Button
                  onClick={handleExcelExport}
                  variant='outline'
                  className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center'
                >
                  <Download className='h-4 w-4 text-emerald-600' />
                  <span>Ekspor Excel</span>
                </Button>
                <Button
                  onClick={handlePrint}
                  variant='outline'
                  className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center'
                >
                  <Printer className='h-4 w-4 text-blue-600' />
                  <span>Cetak PDF</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Printable A4 Document Wrapper (With Interactive Editable Dynamic Headers & Signatures) */}
          <div className='bg-slate-200/70 p-2 sm:p-10 rounded-2xl border border-slate-300/80 flex justify-start sm:justify-center overflow-x-auto shadow-inner print:p-0 print:bg-white print:border-none'>
            <div className='w-full max-w-[950px] min-w-[340px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-14 print:p-0 print:shadow-none print:border-none print:w-full print:max-w-none print:text-black font-sans leading-relaxed overflow-x-auto print:overflow-visible'>
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
                        htmlFor='quick-logo-upload-nilai'
                        className='absolute inset-0 bg-black/40 text-white text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity print:hidden'
                        title='Klik untuk ganti logo'
                      >
                        <Upload className='h-4 w-4 mb-0.5' />
                        <span>Ganti</span>
                      </label>
                      <input
                        id='quick-logo-upload-nilai'
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
                            *Kop surat dinas masih kosong. Buka
                            &quot;Pengaturan Header&quot; untuk memilih template
                            atau melengkapi identitas surat.
                          </div>
                        )}
                    </div>

                    {/* Right spacer for mathematical centering symmetry */}
                    <div
                      className='w-28 sm:w-32 shrink-0 hidden sm:block pointer-events-none'
                      aria-hidden='true'
                    />
                  </div>

                  {/* Official Double Line Divider (Garis Ganda Kop Dinas) */}
                  <div className='mt-2.5 mb-4 space-y-[2px] print:mt-1.5 print:mb-3'>
                    <div className='border-b-[3px] border-black' />
                    <div className='border-b border-black' />
                  </div>

                  {/* Report Title & Subtitle */}
                  <div className='text-center space-y-1 mb-4'>
                    <Input
                      value={
                        reportViewMode === 'all_subjects'
                          ? `LEGER REKAPITULASI HASIL EVALUASI NILAI AKADEMIK KELAS (SEMUA MAPEL)`
                          : reportViewMode === 'recap'
                            ? `LEGER REKAPITULASI HASIL EVALUASI NILAI AKADEMIK (${selectedSubject.toUpperCase()})`
                            : `LAPORAN HASIL EVALUASI NILAI AKADEMIK (${selectedSubject.toUpperCase()} - ${selectedCategory.toUpperCase()})`
                      }
                      readOnly
                      className='text-center font-bold uppercase text-xs sm:text-sm md:text-base text-slate-900 print:text-black border-b border-transparent rounded-none h-auto py-0.5 outline-none print:border-none print:p-0 bg-transparent w-full font-sans cursor-default'
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
                      className='text-center font-medium italic text-xs text-slate-500 print:text-slate-800 border-b border-transparent rounded-none h-auto py-0 outline-none print:border-none print:p-0 bg-transparent w-full font-sans cursor-default'
                    />
                  </div>
                </div>
              ) : (
                <div className='text-center mb-6 border-b-2 border-slate-900 pb-4 print:border-black space-y-1'>
                  <Input
                    value={docHeader.schoolName}
                    onChange={(e) =>
                      updateDocHeader({ schoolName: e.target.value })
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
              )}

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
                    NIP/NUPTK
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
                                    className={`border border-slate-300 px-2 py-2 text-center font-semibold ${
                                      isLow
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
                        {/* Teks murni saat dicetak agar rapi dan tanpa celah sebelum tanda koma */}
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
                        {signatureData.teacherName || '................................'}
                      </div>
                      <Input
                        value={signatureData.teacherName}
                        onChange={(e) =>
                          updateSignatureData({
                            teacherName: e.target.value,
                          })
                        }
                        className='font-bold text-xs text-right border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full print:hidden'
                      />

                      {/* Baris 5: NIP Guru (Sejajar dengan NIP Kepala Sekolah) */}
                      {/* Teks murni saat dicetak agar rapi dan rata kanan sempurna */}
                      <div className='hidden print:flex text-[11px] text-black h-5 items-center justify-end w-full text-right'>
                        {signatureData.teacherNip ? `NIP/NUPTK. ${signatureData.teacherNip}` : 'NIP/NUPTK. -'}
                      </div>
                      {/* Input interaktif saat di layar */}
                      <div className='flex items-center justify-end gap-1 text-[11px] text-slate-700 h-5 w-full print:hidden'>
                        <span>NIP/NUPTK.</span>
                        <input
                          type='text'
                          value={signatureData.teacherNip}
                          onChange={(e) =>
                            updateSignatureData({
                              teacherNip: e.target.value,
                            })
                          }
                          placeholder='-'
                          style={{
                            width: signatureData.teacherNip
                              ? `${Math.max(signatureData.teacherNip.length, 1) * 7.5 + 4}px`
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
      )}
    </div>
  );
}
