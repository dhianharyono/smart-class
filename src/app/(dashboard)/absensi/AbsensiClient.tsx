'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Download,
  Loader2,
  Check,
  UserCheck,
  Printer,
  FileText,
  Settings2,
  Plus,
  SlidersHorizontal,
  Upload,
  RotateCcw,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  getAttendanceByDate,
  saveBulkAttendance,
  getWeeklyAttendanceReport,
  getAllClassesWeeklyAttendanceReport,
  getMonthlyAttendanceReport,
  getAllClassesMonthlyAttendanceReport,
  getYearlyAttendanceReport,
  getAllClassesYearlyAttendanceReport,
  getAttendanceHeaderInfo,
} from '@/actions/attendanceActions';
import {
  exportWeeklyAttendanceToExcel,
  exportAllClassesWeeklyAttendanceToExcel,
  exportMonthlyAttendanceToExcel,
  exportAllClassesMonthlyAttendanceToExcel,
  exportYearlyAttendanceToExcel,
  exportAllClassesYearlyAttendanceToExcel,
} from '@/lib/excelExport';

type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
type ExportPeriod = 'mingguan' | 'bulanan' | 'tahunan';
type ViewMode = 'input' | 'preview';
type ClassScope = 'active' | 'all';
type TableLayoutFormat = 'detail' | 'compact';

interface StudentAttendanceRow {
  studentId: string;
  name: string;
  nis: string;
  className: string;
  gender: string;
  status: AttendanceStatus;
}

interface AbsensiClientProps {
  hideHeader?: boolean;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const YEARS = [2024, 2025, 2026, 2027, 2028];

export default function AbsensiClient({
  hideHeader = false,
}: AbsensiClientProps) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>('input');
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('mingguan');
  const [classScope, setClassScope] = useState<ClassScope>('active');
  const [tableLayoutFormat, setTableLayoutFormat] =
    useState<TableLayoutFormat>('detail');

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear(),
  );

  const getWeekRange = (date: Date) => {
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    return {
      startDateStr: format(monday, 'yyyy-MM-dd'),
      endDateStr: format(saturday, 'yyyy-MM-dd'),
      mondayDate: monday,
      saturdayDate: saturday,
    };
  };

  const weekRange = getWeekRange(selectedDate);

  const [localRecords, setLocalRecords] = useState<StudentAttendanceRow[]>([]);
  const [isPending, startTransition] = useTransition();

  // Dynamic Header & Document Settings Modal State
  const [headerModalOpen, setHeaderModalOpen] = useState(false);

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
    teacherName: '',
    nip: '-',
    className: '',
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
    teacherTitle: 'Guru Kelas / Wali Kelas',
    teacherName: '',
    teacherNip: '-',
  });

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
          parsedSig.supervisorTitle === 'Mengetahui, Kepala Sekolah' ||
          parsedSig.supervisorTitle === 'Mengetahui,'
        ) {
          parsedSig.supervisorTitle = 'Kepala Sekolah';
        }
        setSignatureData((prev) => ({ ...prev, ...parsedSig }));
      }
    } catch (e) {}
  }, []);

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

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch header info for formal print document
  const { data: headerInfo } = useQuery({
    queryKey: ['attendanceHeaderInfo'],
    queryFn: () => getAttendanceHeaderInfo(),
  });

  // Sync headerInfo to docHeader & signatureData only if not set
  useEffect(() => {
    if (headerInfo) {
      const activeNip =
        headerInfo.nip && headerInfo.nip.trim() !== '' ? headerInfo.nip : '-';
      const isSlbPurnamaAsih = headerInfo.schoolName
        ?.toLowerCase()
        .includes('purnama asih');

      setDocHeader((prev) => {
        // Jika akun guru terdaftar di SLB Purnama Asih dan belum pernah kustomisasi
        if (isSlbPurnamaAsih && (!prev.schoolName || prev.schoolName === '')) {
          return {
            ...prev,
            ...SLB_PURNAMA_ASIH_KOP,
            useOfficialKop: true,
            teacherName: prev.teacherName || headerInfo.teacherName || '',
            nip: prev.nip && prev.nip !== '-' ? prev.nip : activeNip,
            className: prev.className || headerInfo.className || '',
          };
        }

        // Jika di localStorage masih ada sisa hardcoded lama SLB Purnama Asih padahal guru dari sekolah lain
        const shouldResetOldSlbDefault =
          !isSlbPurnamaAsih &&
          prev.schoolName === 'SEKOLAH LUAR BIASA PURNAMA ASIH' &&
          headerInfo.schoolName &&
          !headerInfo.schoolName.toLowerCase().includes('purnama asih');

        return {
          ...prev,
          schoolName: shouldResetOldSlbDefault
            ? headerInfo.schoolName
            : prev.schoolName || headerInfo.schoolName || 'SMK NEGERI 1',
          logoUrl: shouldResetOldSlbDefault
            ? '/icon.svg'
            : prev.logoUrl || '/icon.svg',
          subHeader1: shouldResetOldSlbDefault ? '' : prev.subHeader1,
          subHeader2: shouldResetOldSlbDefault ? '' : prev.subHeader2,
          subHeader3: shouldResetOldSlbDefault ? '' : prev.subHeader3,
          addressLine: shouldResetOldSlbDefault ? '' : prev.addressLine,
          cityRegency: shouldResetOldSlbDefault ? '' : prev.cityRegency,
          teacherName: prev.teacherName || headerInfo.teacherName || '',
          nip: prev.nip && prev.nip !== '-' ? prev.nip : activeNip,
          className: prev.className || headerInfo.className || '',
        };
      });

      setSignatureData((prev) => ({
        ...prev,
        teacherName: prev.teacherName || headerInfo.teacherName || '',
        teacherNip:
          prev.teacherNip && prev.teacherNip !== '-'
            ? prev.teacherNip
            : activeNip,
        supervisorName:
          prev.supervisorName ||
          headerInfo.principalName ||
          prev.supervisorName,
        supervisorNip:
          prev.supervisorNip && prev.supervisorNip !== '-'
            ? prev.supervisorNip
            : headerInfo.principalNip && headerInfo.principalNip.trim() !== ''
              ? headerInfo.principalNip
              : prev.supervisorNip,
      }));
    }
  }, [headerInfo]);

  // Query 1: Daily Attendance
  const {
    data: serverRecords,
    isLoading: isDailyLoading,
    isError: isDailyError,
  } = useQuery<StudentAttendanceRow[]>({
    queryKey: ['attendance', dateStr],
    queryFn: () => getAttendanceByDate(dateStr),
  });

  // Query 2: Weekly Attendance Report (Single Active Class)
  const { data: weeklyReport } = useQuery({
    queryKey: [
      'weeklyAttendance',
      weekRange.startDateStr,
      weekRange.endDateStr,
    ],
    queryFn: () =>
      getWeeklyAttendanceReport(weekRange.startDateStr, weekRange.endDateStr),
    enabled: exportPeriod === 'mingguan' && classScope === 'active',
  });

  // Query 2b: Weekly Attendance Report (All Classes Combined)
  const { data: allClassesWeeklyReport, isLoading: isAllClassesWeeklyLoading } =
    useQuery({
      queryKey: [
        'allClassesWeeklyAttendance',
        weekRange.startDateStr,
        weekRange.endDateStr,
      ],
      queryFn: () =>
        getAllClassesWeeklyAttendanceReport(
          weekRange.startDateStr,
          weekRange.endDateStr,
        ),
      enabled: exportPeriod === 'mingguan' && classScope === 'all',
    });

  // Query 3: Monthly Attendance Report (Single Active Class)
  const { data: monthlyReport } = useQuery({
    queryKey: ['monthlyAttendance', selectedYear, selectedMonth],
    queryFn: () => getMonthlyAttendanceReport(selectedYear, selectedMonth),
    enabled: exportPeriod === 'bulanan' && classScope === 'active',
  });

  // Query 3b: Monthly Attendance Report (All Classes Combined)
  const {
    data: allClassesMonthlyReport,
    isLoading: isAllClassesMonthlyLoading,
  } = useQuery({
    queryKey: ['allClassesMonthlyAttendance', selectedYear, selectedMonth],
    queryFn: () =>
      getAllClassesMonthlyAttendanceReport(selectedYear, selectedMonth),
    enabled: exportPeriod === 'bulanan' && classScope === 'all',
  });

  // Query 4: Yearly Attendance Report (Single Active Class)
  const { data: yearlyReport } = useQuery({
    queryKey: ['yearlyAttendance', selectedYear],
    queryFn: () => getYearlyAttendanceReport(selectedYear),
    enabled: exportPeriod === 'tahunan' && classScope === 'active',
  });

  // Query 4b: Yearly Attendance Report (All Classes Combined)
  const { data: allClassesYearlyReport, isLoading: isAllClassesYearlyLoading } =
    useQuery({
      queryKey: ['allClassesYearlyAttendance', selectedYear],
      queryFn: () => getAllClassesYearlyAttendanceReport(selectedYear),
      enabled: exportPeriod === 'tahunan' && classScope === 'all',
    });

  useEffect(() => {
    if (serverRecords) {
      setLocalRecords(serverRecords);
    }
  }, [serverRecords]);

  const handleStatusChange = (
    studentId: string,
    newStatus: AttendanceStatus,
  ) => {
    setLocalRecords((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, status: newStatus } : row,
      ),
    );
  };

  const handleMarkAllHadir = () => {
    setLocalRecords((prev) =>
      prev.map((row) => ({ ...row, status: 'Hadir' as AttendanceStatus })),
    );
  };

  const handleSave = () => {
    if (localRecords.length === 0) {
      toast.error('Tidak ada data siswa untuk disimpan.');
      return;
    }

    startTransition(async () => {
      try {
        await saveBulkAttendance(dateStr, localRecords);
        queryClient.invalidateQueries({ queryKey: ['attendance', dateStr] });
        queryClient.invalidateQueries({ queryKey: ['weeklyAttendance'] });
        queryClient.invalidateQueries({ queryKey: ['monthlyAttendance'] });
        queryClient.invalidateQueries({ queryKey: ['yearlyAttendance'] });
        toast.success(
          `Absensi tanggal ${format(selectedDate, 'dd MMMM yyyy', { locale: id })} berhasil disimpan!`,
        );
      } catch (err: any) {
        toast.error(err.message || 'Gagal menyimpan data absensi.');
      }
    });
  };

  const handleExportExcel = async () => {
    try {
      if (exportPeriod === 'mingguan') {
        if (classScope === 'all') {
          toast.promise(
            (async () => {
              const data =
                allClassesWeeklyReport ||
                (await getAllClassesWeeklyAttendanceReport(
                  weekRange.startDateStr,
                  weekRange.endDateStr,
                ));
              if (
                !data ||
                !data.classesReport ||
                data.classesReport.length === 0
              ) {
                throw new Error(
                  'Tidak ada data absensi mingguan semua kelas untuk diekspor.',
                );
              }
              const label = `${format(weekRange.mondayDate, 'dd MMM', { locale: id })} - ${format(weekRange.saturdayDate, 'dd MMM yyyy', { locale: id })}`;
              await exportAllClassesWeeklyAttendanceToExcel(
                data,
                label,
                docHeader,
                signatureData,
              );
            })(),
            {
              loading: 'Menyusun rekap Excel mingguan semua kelas...',
              success: 'Excel rekap mingguan semua kelas berhasil diunduh!',
              error: (err) => err.message || 'Gagal mengunduh Excel.',
            },
          );
        } else {
          toast.promise(
            (async () => {
              const data =
                weeklyReport ||
                (await getWeeklyAttendanceReport(
                  weekRange.startDateStr,
                  weekRange.endDateStr,
                ));
              if (
                !data ||
                !data.studentsReport ||
                data.studentsReport.length === 0
              ) {
                throw new Error(
                  'Tidak ada data absensi mingguan untuk diekspor.',
                );
              }
              const label = `${format(weekRange.mondayDate, 'dd MMM', { locale: id })} - ${format(weekRange.saturdayDate, 'dd MMM yyyy', { locale: id })}`;
              await exportWeeklyAttendanceToExcel(
                data,
                label,
                docHeader,
                signatureData,
              );
            })(),
            {
              loading: 'Menyusun rekap Excel mingguan...',
              success: 'Excel rekap mingguan berhasil diunduh!',
              error: (err) => err.message || 'Gagal mengunduh Excel.',
            },
          );
        }
      } else if (exportPeriod === 'bulanan') {
        if (classScope === 'all') {
          toast.promise(
            (async () => {
              const data =
                allClassesMonthlyReport ||
                (await getAllClassesMonthlyAttendanceReport(
                  selectedYear,
                  selectedMonth,
                ));
              if (
                !data ||
                !data.classesReport ||
                data.classesReport.length === 0
              ) {
                throw new Error(
                  'Tidak ada data absensi semua kelas untuk diekspor.',
                );
              }
              await exportAllClassesMonthlyAttendanceToExcel(
                data,
                `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
                docHeader,
                signatureData,
              );
            })(),
            {
              loading: 'Menyusun rekap Excel semua kelas...',
              success: 'Excel rekap semua kelas berhasil diunduh!',
              error: (err) => err.message || 'Gagal mengunduh Excel.',
            },
          );
        } else {
          toast.promise(
            (async () => {
              const data =
                monthlyReport ||
                (await getMonthlyAttendanceReport(selectedYear, selectedMonth));
              if (
                !data ||
                !data.studentsReport ||
                data.studentsReport.length === 0
              ) {
                throw new Error(
                  'Tidak ada data absensi bulanan untuk diekspor.',
                );
              }
              await exportMonthlyAttendanceToExcel(
                data,
                `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
                docHeader,
                signatureData,
              );
            })(),
            {
              loading: 'Menyusun rekap Excel bulanan...',
              success: 'Excel rekap bulanan berhasil diunduh!',
              error: (err) => err.message || 'Gagal mengunduh Excel.',
            },
          );
        }
      } else if (exportPeriod === 'tahunan') {
        if (classScope === 'all') {
          toast.promise(
            (async () => {
              const data =
                allClassesYearlyReport ||
                (await getAllClassesYearlyAttendanceReport(selectedYear));
              if (
                !data ||
                !data.classesReport ||
                data.classesReport.length === 0
              ) {
                throw new Error(
                  'Tidak ada data absensi tahunan semua kelas untuk diekspor.',
                );
              }
              await exportAllClassesYearlyAttendanceToExcel(
                data,
                docHeader,
                signatureData,
              );
            })(),
            {
              loading: 'Menyusun rekap Excel tahunan semua kelas...',
              success: 'Excel rekap tahunan semua kelas berhasil diunduh!',
              error: (err) => err.message || 'Gagal mengunduh Excel.',
            },
          );
        } else {
          toast.promise(
            (async () => {
              const data =
                yearlyReport || (await getYearlyAttendanceReport(selectedYear));
              if (
                !data ||
                !data.studentsReport ||
                data.studentsReport.length === 0
              ) {
                throw new Error(
                  'Tidak ada data absensi tahunan untuk diekspor.',
                );
              }
              await exportYearlyAttendanceToExcel(
                data,
                docHeader,
                signatureData,
              );
            })(),
            {
              loading: 'Menyusun rekap Excel tahunan...',
              success: 'Excel rekap tahunan berhasil diunduh!',
              error: (err) => err.message || 'Gagal mengunduh Excel.',
            },
          );
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengunduh Excel.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const counts = localRecords.reduce(
    (acc, row) => {
      if (row.status === 'Hadir') acc.hadir++;
      else if (row.status === 'Sakit') acc.sakit++;
      else if (row.status === 'Izin') acc.izin++;
      else if (row.status === 'Alfa') acc.alfa++;
      return acc;
    },
    { hadir: 0, sakit: 0, izin: 0, alfa: 0 },
  );

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Top Bar Header */}
      {!hideHeader && (
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden'>
          <div>
            <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2'>
              Absensi Siswa
            </h2>
            <p className='text-slate-600 text-xs sm:text-sm mt-1'>
              Catat dan pantau rekapitulasi presensi mingguan, bulanan, serta
              tahunan siswa.
            </p>
          </div>

          <div className='relative flex flex-wrap items-center gap-2 sm:gap-3'>
            {localRecords.length === 0 && !isDailyLoading ? (
              <Link href='/siswa'>
                <Button className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer justify-center'>
                  <Plus className='h-4 w-4' />
                  <span>Input Data Siswa Sekarang</span>
                </Button>
              </Link>
            ) : (
              viewMode === 'input' && (
                <Button
                  onClick={handleSave}
                  disabled={isPending || isDailyLoading}
                  className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl h-10 px-6 gap-2 shadow-xs cursor-pointer'
                >
                  {isPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <Check className='h-4 w-4' />
                  )}
                  Simpan Presensi
                </Button>
              )
            )}
          </div>
        </div>
      )}

      {/* View Mode Navigation Tabs (Matching Jurnal Client UI) */}
      <div className='grid grid-cols-2 sm:flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-200/80 border border-slate-300/80 rounded-2xl w-full sm:w-fit print:hidden'>
        <button
          onClick={() => setViewMode('input')}
          className={`flex items-center justify-center text-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer w-full sm:w-auto ${
            viewMode === 'input'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className='h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0' />
          <span className='truncate'>Data Absensi & Rekap</span>
        </button>
        <button
          onClick={() => setViewMode('preview')}
          className={`flex items-center justify-center text-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer w-full sm:w-auto ${
            viewMode === 'preview'
              ? 'bg-white text-emerald-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className='h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0' />
          <span className='truncate'>Pratinjau Cetak (A4 PDF)</span>
        </button>
      </div>

      {/* Controls Card: Date Picker & Summary Counters (INPUT MODE ONLY) */}
      {viewMode === 'input' && (
        <Card className='bg-white border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs print:hidden'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            {/* Left: Date Selector */}
            <div className='flex flex-wrap items-center gap-3'>
              <span className='text-xs font-semibold text-slate-500'>
                Pilih Tanggal:
              </span>
              <Popover>
                <PopoverTrigger className='justify-start text-left font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl h-10 gap-2 flex items-center px-3.5 cursor-pointer text-xs sm:text-sm'>
                  <CalendarIcon className='h-4 w-4 text-emerald-600' />
                  {selectedDate ? (
                    format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: id })
                  ) : (
                    <span>Pilih Tanggal</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0 bg-white border-slate-200 rounded-xl shadow-xl'>
                  <Calendar
                    mode='single'
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className='bg-white text-slate-900 rounded-xl'
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant='outline'
                size='sm'
                onClick={handleMarkAllHadir}
                className='border-slate-200 bg-white hover:bg-slate-100 text-emerald-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-1.5 cursor-pointer'
              >
                <Check className='h-3.5 w-3.5' />
                Tandai Semua Hadir
              </Button>
            </div>

            {/* Right: Real-time Attendance Counters */}
            <div className='flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold flex-wrap'>
              <span className='text-emerald-700'>Hadir: {counts.hadir}</span>
              <span className='text-slate-300'>|</span>
              <span className='text-blue-700'>Sakit: {counts.sakit}</span>
              <span className='text-slate-300'>|</span>
              <span className='text-amber-700'>Izin: {counts.izin}</span>
              <span className='text-slate-300'>|</span>
              <span className='text-rose-700'>Alfa: {counts.alfa}</span>
            </div>
          </div>
        </Card>
      )}

      {/* MODE 1: DATA ABSENSI INPUT & REKAP TABEL */}
      {viewMode === 'input' && (
        <Card className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs'>
          <CardContent className='p-0 overflow-x-auto'>
            {isDailyLoading ? (
              <div className='flex flex-col items-center justify-center py-20 text-slate-500 text-sm'>
                <Loader2 className='h-8 w-8 animate-spin text-emerald-600 mb-3' />
                <span>Memuat data absensi harian...</span>
              </div>
            ) : isDailyError ? (
              <div className='text-center py-20 text-rose-600 text-sm font-medium'>
                Gagal memuat data absensi. Periksa koneksi server.
              </div>
            ) : localRecords.length > 0 ? (
              <Table>
                <TableHeader className='bg-slate-50/80 border-b border-slate-200'>
                  <TableRow className='border-b border-slate-200 hover:bg-transparent'>
                    <TableHead className='w-12 text-center text-slate-700 font-bold'>
                      No
                    </TableHead>
                    <TableHead className='w-32 text-slate-700 font-bold'>
                      NIS
                    </TableHead>
                    <TableHead className='min-w-[180px] text-slate-700 font-bold'>
                      Nama Lengkap
                    </TableHead>
                    <TableHead className='w-24 text-slate-700 font-bold'>
                      Kelas
                    </TableHead>
                    <TableHead className='w-16 text-center text-slate-700 font-bold'>
                      L/P
                    </TableHead>
                    <TableHead className='w-72 text-center text-slate-700 font-bold'>
                      Status Kehadiran
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localRecords.map((row, index) => (
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
                      <TableCell className='text-center font-medium'>
                        {row.gender || '-'}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center justify-center gap-1.5'>
                          {(
                            [
                              'Hadir',
                              'Sakit',
                              'Izin',
                              'Alfa',
                            ] as AttendanceStatus[]
                          ).map((st) => {
                            const isSelected = row.status === st;
                            let activeClass = '';
                            if (isSelected) {
                              if (st === 'Hadir')
                                activeClass =
                                  'bg-emerald-600 text-white shadow-xs';
                              else if (st === 'Sakit')
                                activeClass =
                                  'bg-blue-600 text-white shadow-xs';
                              else if (st === 'Izin')
                                activeClass =
                                  'bg-amber-600 text-white shadow-xs';
                              else if (st === 'Alfa')
                                activeClass =
                                  'bg-rose-600 text-white shadow-xs';
                            } else {
                              activeClass =
                                'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900';
                            }
                            return (
                              <button
                                key={st}
                                onClick={() =>
                                  handleStatusChange(row.studentId, st)
                                }
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeClass}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className='flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center text-slate-500 max-w-md mx-auto space-y-3'>
                <div className='h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs'>
                  <UserCheck className='h-7 w-7' />
                </div>
                <div>
                  <p className='text-base font-extrabold text-slate-900 tracking-tight'>
                    Belum Ada Siswa Terdaftar
                  </p>
                  <p className='text-xs text-slate-500 mt-1 font-medium leading-relaxed'>
                    Silakan tambahkan data siswa terlebih dahulu agar Anda dapat
                    langsung mencatat presensi harian.
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
      {viewMode === 'preview' && (
        <div className='space-y-6'>
          {/* Top Bar: Title & Primary Print/Export Actions */}
          <div className='bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs print:hidden'>
            <div className='flex items-center gap-3.5'>
              <div className='p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <div className='flex items-center gap-2 flex-wrap'>
                  <h3 className='text-sm sm:text-base font-extrabold text-slate-900'>
                    Live Preview Cetak Laporan Absensi Siswa
                  </h3>
                  <span className='text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0'>
                    FORMAT A4 PDF
                  </span>
                </div>
                <p className='text-xs text-slate-500 mt-0.5'>
                  Klik langsung teks pada lembar A4 di bawah untuk mengedit
                  judul atau tanda tangan sebelum dicetak.
                </p>
              </div>
            </div>

            {/* Actions: Export Excel & Cetak PDF */}
            <div className='flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end'>
              <Button
                onClick={handleExportExcel}
                variant='outline'
                className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center'
              >
                <Download className='h-4 w-4 text-emerald-600' />
                <span>Ekspor Excel</span>
              </Button>

              <Button
                onClick={handlePrint}
                className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer flex-1 sm:flex-initial justify-center'
              >
                <Printer className='h-4 w-4' />
                <span>Cetak PDF</span>
              </Button>
            </div>
          </div>

          {/* Section Khusus: Pengaturan Header & Filter Laporan */}
          <div className='bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs print:hidden space-y-4'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-slate-100'>
              <div className='flex items-center gap-2.5'>
                <div className='p-1.5 bg-emerald-100/60 text-emerald-700 rounded-lg'>
                  <SlidersHorizontal className='h-4 w-4' />
                </div>
                <div>
                  <h4 className='text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider'>
                    Pengaturan Header & Filter Laporan
                  </h4>
                  <p className='text-[11px] text-slate-500'>
                    Sesuaikan rentang periode, waktu, cakupan kelas, dan
                    kustomisasi kop surat laporan
                  </p>
                </div>
              </div>

              {/* Modal Trigger for Header & Tanda Tangan */}
              <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant='outline'
                      className='border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-9 px-3.5 gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center'
                    />
                  }
                >
                  <Settings2 className='h-4 w-4 text-emerald-600' />
                  <span>Kustomisasi Header & Tanda Tangan</span>
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
                              htmlFor='modal-logo-file-input'
                              className='cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold transition-colors'
                            >
                              <Upload className='h-3 w-3' />
                              Upload Logo Baru
                            </label>
                            <input
                              id='modal-logo-file-input'
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
                            Nama Guru Kelas
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
                            Kota Cetak
                          </Label>
                          <Input
                            value={signatureData.place}
                            onChange={(e) =>
                              updateSignatureData({ place: e.target.value })
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
                              updateSignatureData({ date: e.target.value })
                            }
                            className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl h-9 text-xs'
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className='p-4 sm:px-7 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-row justify-between items-center w-full shrink-0 gap-3'>
                    <span className='text-xs text-slate-500 font-medium'>
                      Perubahan tersimpan otomatis di browser
                    </span>
                    <Button
                      onClick={() => {
                        setHeaderModalOpen(false);
                        toast.success(
                          'Pengaturan header & tanda tangan berhasil diterapkan',
                        );
                      }}
                      className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs h-9 px-6 shadow-xs cursor-pointer'
                    >
                      Selesai
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Filter Parameter Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-1'>
              {/* Filter 1: Rentang Periode */}
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-slate-700'>
                  Rentang Periode
                </label>
                <div className='grid grid-cols-3 bg-slate-100 p-1 rounded-xl border border-slate-200/80'>
                  {(['mingguan', 'bulanan', 'tahunan'] as ExportPeriod[]).map(
                    (period) => {
                      const isActive = exportPeriod === period;
                      return (
                        <button
                          key={period}
                          type='button'
                          onClick={() => setExportPeriod(period)}
                          className={`py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer text-center flex items-center justify-center ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                          }`}
                        >
                          {period}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Filter 2: Pilihan Waktu Dinamis */}
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-slate-700'>
                  {exportPeriod === 'mingguan'
                    ? 'Pekan (Minggu)'
                    : exportPeriod === 'bulanan'
                      ? 'Bulan & Tahun'
                      : 'Tahun Pelajaran'}
                </label>

                {exportPeriod === 'mingguan' && (
                  <Popover>
                    <PopoverTrigger className='w-full justify-start text-left font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl h-10 gap-2 flex items-center px-3 cursor-pointer text-xs'>
                      <CalendarIcon className='h-3.5 w-3.5 text-emerald-600 shrink-0' />
                      <span className='truncate'>
                        {format(weekRange.mondayDate, 'dd MMM', { locale: id })}{' '}
                        -{' '}
                        {format(weekRange.saturdayDate, 'dd MMM yyyy', {
                          locale: id,
                        })}
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0 bg-white border-slate-200 rounded-xl shadow-xl'>
                      <Calendar
                        mode='single'
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        className='bg-white text-slate-900 rounded-xl'
                      />
                    </PopoverContent>
                  </Popover>
                )}

                {exportPeriod === 'bulanan' && (
                  <div className='grid grid-cols-2 gap-2'>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className='w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-10 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer'
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx + 1}>
                          {m}
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className='w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 h-10 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer'
                    >
                      {YEARS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {exportPeriod === 'tahunan' && (
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className='w-full bg-slate-50 border border-slate-200 rounded-xl px-3 h-10 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer'
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        Tahun Ajaran {y}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Filter 3: Cakupan Kelas (Active vs All) - Berlaku di SEMUA PERIODE */}
              <div className='space-y-1.5'>
                <label className='text-xs font-semibold text-slate-700'>
                  Cakupan Kelas
                </label>
                <div className='grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80'>
                  <button
                    type='button'
                    onClick={() => setClassScope('active')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center truncate ${
                      classScope === 'active'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={`Kelas Aktif (${docHeader.className || 'Utama'})`}
                  >
                    Kelas Aktif ({docHeader.className || 'Utama'})
                  </button>
                  <button
                    type='button'
                    onClick={() => setClassScope('all')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                      classScope === 'all'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Semua Kelas</span>
                    {headerInfo?.classes && headerInfo.classes.length > 0 && (
                      <span className='px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 rounded font-bold shrink-0'>
                        {headerInfo.classes.length} Tabel
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Filter 4: Format Tabel (Detail vs Ringkas) jika Bulanan & Semua Kelas */}
              {exportPeriod === 'bulanan' && classScope === 'all' ? (
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-slate-700'>
                    Format Tabel Rekap
                  </label>
                  <div className='grid grid-cols-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80'>
                    <button
                      type='button'
                      onClick={() => setTableLayoutFormat('detail')}
                      title='Tampilkan matriks tanggal 1 sampai 31'
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center ${
                        tableLayoutFormat === 'detail'
                          ? 'bg-white text-slate-900 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Detail (1–31)
                    </button>
                    <button
                      type='button'
                      onClick={() => setTableLayoutFormat('compact')}
                      title='Rekap total H/S/I/A hemat kertas'
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                        tableLayoutFormat === 'compact'
                          ? 'bg-white text-emerald-700 font-bold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>Ringkas</span>
                      <span className='px-1 py-0.2 text-[9px] bg-emerald-100 text-emerald-800 rounded font-bold'>
                        Hemat
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-slate-700'>
                    Status Tampilan
                  </label>
                  <div className='h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center px-3 text-slate-600 text-xs font-medium'>
                    {classScope === 'all'
                      ? `Multi-Tabel (${headerInfo?.classes?.length || 2} Kelas Terpisah)`
                      : `Tabel Tunggal (${docHeader.className || 'Kelas Utama'})`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Printable Document Wrapper (A4 Simulation with Interactive Dynamic Headers) */}
          <div className='bg-slate-200/70 p-2 sm:p-10 rounded-2xl border border-slate-300/80 flex justify-start sm:justify-center overflow-x-auto shadow-inner print:p-0 print:m-0 print:bg-white print:border-none'>
            <div className='w-full max-w-[950px] min-w-[340px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-14 print:p-6 print:m-0 print:shadow-none print:border-none print:w-full print:max-w-none print:text-black font-sans leading-relaxed overflow-x-auto'>
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
                        htmlFor='quick-logo-upload'
                        className='absolute inset-0 bg-black/40 text-white text-[10px] font-bold rounded-full opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity print:hidden'
                        title='Klik untuk ganti logo'
                      >
                        <Upload className='h-4 w-4 mb-0.5' />
                        <span>Ganti</span>
                      </label>
                      <input
                        id='quick-logo-upload'
                        type='file'
                        accept='image/*'
                        onChange={handleLogoUpload}
                        className='hidden'
                      />
                    </div>

                    {/* Center: Official Letterhead Text Block (Times New Roman / Serif style) */}
                    <div className='flex-1 text-center font-serif text-slate-900 print:text-black space-y-[2px] px-1'>
                      {/* Baris 1: Nama Sekolah / Yayasan */}
                      {Boolean(docHeader.schoolName && docHeader.schoolName.trim()) && (
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
                      {Boolean(docHeader.subHeader1 && docHeader.subHeader1.trim()) && (
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
                      {Boolean(docHeader.subHeader2 && docHeader.subHeader2.trim()) && (
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
                      {Boolean(docHeader.subHeader3 && docHeader.subHeader3.trim()) && (
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
                      {Boolean(docHeader.addressLine && docHeader.addressLine.trim()) && (
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
                      {Boolean(docHeader.cityRegency && docHeader.cityRegency.trim()) && (
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
                            *Kop surat dinas masih kosong. Klik tombol &quot;Kustomisasi Header &amp; Tanda Tangan&quot; untuk mengisi teks kop surat.
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
                  <div className='text-center space-y-1 mb-3'>
                    <Input
                      value={
                        exportPeriod === 'mingguan'
                          ? classScope === 'all'
                            ? `LAPORAN REKAPITULASI ABSENSI MINGGUAN SISWA (SEMUA KELAS)`
                            : `LAPORAN REKAPITULASI ABSENSI MINGGUAN SISWA`
                          : exportPeriod === 'bulanan'
                            ? classScope === 'all'
                              ? `LAPORAN REKAPITULASI ABSENSI BULAN ${MONTH_NAMES[selectedMonth - 1].toUpperCase()} ${selectedYear} (SEMUA KELAS)`
                              : `LAPORAN REKAPITULASI ABSENSI BULAN ${MONTH_NAMES[selectedMonth - 1].toUpperCase()} ${selectedYear}`
                            : classScope === 'all'
                              ? `LAPORAN REKAPITULASI ABSENSI TAHUN ${selectedYear} (SEMUA KELAS)`
                              : `LAPORAN REKAPITULASI ABSENSI TAHUN ${selectedYear}`
                      }
                      readOnly
                      className='text-center font-bold uppercase text-xs sm:text-sm md:text-base text-slate-900 print:text-black border-b border-transparent rounded-none h-auto py-0.5 outline-none print:border-none print:p-0 bg-transparent w-full font-sans cursor-default'
                    />
                    <Input
                      value={
                        exportPeriod === 'mingguan'
                          ? `Periode: ${format(weekRange.mondayDate, 'dd MMMM', { locale: id })} s/d ${format(weekRange.saturdayDate, 'dd MMMM yyyy', { locale: id })}`
                          : exportPeriod === 'bulanan'
                            ? `Periode: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
                            : `Tahun Pelajaran: ${selectedYear}`
                      }
                      readOnly
                      className='text-center font-medium italic text-xs text-slate-500 print:text-slate-800 border-b border-transparent rounded-none h-auto py-0 outline-none print:border-none print:p-0 bg-transparent w-full font-sans cursor-default'
                    />
                  </div>
                </div>
              ) : (
                /* Fallback Simple Header */
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
                      exportPeriod === 'mingguan'
                        ? classScope === 'all'
                          ? `LAPORAN REKAPITULASI ABSENSI MINGGUAN SISWA (SEMUA KELAS)`
                          : `LAPORAN REKAPITULASI ABSENSI MINGGUAN SISWA`
                        : exportPeriod === 'bulanan'
                          ? classScope === 'all'
                            ? `LAPORAN REKAPITULASI ABSENSI BULAN ${MONTH_NAMES[selectedMonth - 1].toUpperCase()} ${selectedYear} (SEMUA KELAS)`
                            : `LAPORAN REKAPITULASI ABSENSI BULAN ${MONTH_NAMES[selectedMonth - 1].toUpperCase()} ${selectedYear}`
                          : classScope === 'all'
                            ? `LAPORAN REKAPITULASI ABSENSI TAHUN ${selectedYear} (SEMUA KELAS)`
                            : `LAPORAN REKAPITULASI ABSENSI TAHUN ${selectedYear}`
                    }
                    readOnly
                    className='text-center font-bold uppercase text-xs sm:text-sm text-slate-800 print:text-black border-b border-transparent rounded-none h-auto py-1 outline-none print:border-none print:p-0 bg-transparent w-full font-sans cursor-default'
                  />
                  <Input
                    value={
                      exportPeriod === 'mingguan'
                        ? `Periode: ${format(weekRange.mondayDate, 'dd MMMM', { locale: id })} s/d ${format(weekRange.saturdayDate, 'dd MMMM yyyy', { locale: id })}`
                        : exportPeriod === 'bulanan'
                          ? `Periode: ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
                          : `Tahun Pelajaran: ${selectedYear}`
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
                      updateDocHeader({ schoolName: e.target.value })
                    }
                    className='font-bold text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-6 px-1 py-0 outline-none transition-all print:border-none print:p-0 bg-transparent w-full text-xs'
                  />
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='w-28 text-slate-500 font-bold shrink-0 print:text-black'>
                    Guru Kelas
                  </span>
                  <span className='text-slate-400 font-bold'>:</span>
                  <Input
                    value={docHeader.teacherName}
                    onChange={(e) => {
                      updateDocHeader({
                        teacherName: e.target.value,
                      });
                      updateSignatureData({
                        teacherName: e.target.value,
                      });
                    }}
                    className='font-bold text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-6 px-1 py-0 outline-none transition-all print:border-none print:p-0 bg-transparent w-full text-xs'
                  />
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='w-28 text-slate-500 font-bold shrink-0 print:text-black'>
                    Kelas
                  </span>
                  <span className='text-slate-400 font-bold'>:</span>
                  <Input
                    value={
                      classScope === 'all'
                        ? `Semua Kelas (${
                            (exportPeriod === 'mingguan'
                              ? allClassesWeeklyReport?.classesList
                              : exportPeriod === 'bulanan'
                                ? allClassesMonthlyReport?.classesList
                                : allClassesYearlyReport?.classesList
                            )?.join(', ') ||
                            headerInfo?.classes?.join(', ') ||
                            'Semua Kelas'
                          })`
                        : docHeader.className
                    }
                    onChange={(e) =>
                      updateDocHeader({ className: e.target.value })
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
                    onChange={(e) => {
                      updateDocHeader({ nip: e.target.value });
                      updateSignatureData({ teacherNip: e.target.value });
                    }}
                    className='font-bold text-slate-900 print:text-black border-b border-transparent hover:border-slate-300 focus:border-emerald-600 rounded-none h-6 px-1 py-0 outline-none transition-all print:border-none print:p-0 bg-transparent w-full text-xs'
                  />
                </div>
              </div>

              {/* Printable Table Content - MINGGUAN KELAS AKTIF */}
              {exportPeriod === 'mingguan' &&
                classScope === 'active' &&
                weeklyReport && (
                  <div className='mb-8 overflow-x-auto'>
                    <table className='w-full border-collapse border border-slate-300 text-xs'>
                      <thead>
                        <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-8'>
                            No
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-24'>
                            NIS
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-left font-bold min-w-[140px]'>
                            Nama Lengkap
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8'>
                            L/P
                          </th>
                          {weeklyReport.datesList.map((dStr: string) => {
                            const [y, m, d] = dStr.split('-').map(Number);
                            const dt = new Date(y, m - 1, d);
                            const dayNames = [
                              'Min',
                              'Sen',
                              'Sel',
                              'Rab',
                              'Kam',
                              'Jum',
                              'Sab',
                            ];
                            return (
                              <th
                                key={dStr}
                                className='border border-slate-300 px-1 py-2 text-center font-bold w-12'
                              >
                                <div>{dayNames[dt.getDay()]}</div>
                                <div className='text-[10px] text-slate-500 font-normal'>
                                  {d}/{m}
                                </div>
                              </th>
                            );
                          })}
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-emerald-50 print:bg-transparent'>
                            H
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-blue-50 print:bg-transparent'>
                            S
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-amber-50 print:bg-transparent'>
                            I
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-rose-50 print:bg-transparent'>
                            A
                          </th>
                          <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12'>
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyReport.studentsReport.map(
                          (student: any, idx: number) => (
                            <tr
                              key={student.studentId}
                              className='border-b border-slate-200'
                            >
                              <td className='border border-slate-300 px-2 py-1.5 text-center'>
                                {idx + 1}
                              </td>
                              <td className='border border-slate-300 px-2 py-1.5 text-center font-mono'>
                                {student.nis}
                              </td>
                              <td className='border border-slate-300 px-2 py-1.5 font-bold'>
                                {student.name}
                              </td>
                              <td className='border border-slate-300 px-1 py-1.5 text-center'>
                                {student.gender || '-'}
                              </td>
                              {weeklyReport.datesList.map((dStr: string) => {
                                const st = student.dailyMap
                                  ? student.dailyMap[dStr]
                                  : '';
                                const code =
                                  st === 'Hadir'
                                    ? 'H'
                                    : st === 'Sakit'
                                      ? 'S'
                                      : st === 'Izin'
                                        ? 'I'
                                        : st === 'Alfa'
                                          ? 'A'
                                          : '-';
                                return (
                                  <td
                                    key={dStr}
                                    className={`border border-slate-300 text-center font-semibold ${code === 'A' ? 'text-rose-700 bg-rose-50 print:bg-transparent print:text-black' : code === 'S' || code === 'I' ? 'text-amber-700 bg-amber-50 print:bg-transparent print:text-black' : ''}`}
                                  >
                                    {code}
                                  </td>
                                );
                              })}
                              <td className='border border-slate-300 text-center font-bold text-emerald-700'>
                                {student.hadir}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-blue-700'>
                                {student.sakit}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-amber-700'>
                                {student.izin}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-rose-700'>
                                {student.alfa}
                              </td>
                              <td className='border border-slate-300 text-center font-extrabold'>
                                {student.percentage}%
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Mingguan - Mode Semua Kelas (Multi-Tabel) */}
              {exportPeriod === 'mingguan' && classScope === 'all' && (
                <div className='mb-8 space-y-8'>
                  {isAllClassesWeeklyLoading ? (
                    <div className='p-12 flex flex-col items-center justify-center gap-3 text-slate-500'>
                      <Loader2 className='h-7 w-7 animate-spin text-emerald-600' />
                      <span className='text-xs font-semibold'>
                        Memuat data rekap absensi mingguan seluruh kelas...
                      </span>
                    </div>
                  ) : !allClassesWeeklyReport ||
                    !allClassesWeeklyReport.classesReport ||
                    allClassesWeeklyReport.classesReport.length === 0 ? (
                    <div className='p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-300 rounded-xl'>
                      Tidak ada data kelas yang ditemukan untuk periode mingguan
                      ini.
                    </div>
                  ) : (
                    allClassesWeeklyReport.classesReport.map((cls: any) => (
                      <div
                        key={cls.className}
                        className='break-inside-avoid print:break-inside-avoid border border-slate-200 print:border-none p-3 print:p-0 rounded-xl bg-slate-50/40 print:bg-transparent shadow-xs print:shadow-none'
                      >
                        {/* Sub-Header Kelas */}
                        <div className='flex items-center justify-between mb-2 pb-1.5 border-b-2 border-slate-800 print:border-black'>
                          <div className='flex items-center gap-2'>
                            <span className='font-black text-sm uppercase text-slate-900 print:text-black'>
                              KELAS: {cls.className}
                            </span>
                            <span className='text-xs font-bold text-slate-500 print:text-slate-700'>
                              ({cls.totalStudents} Siswa)
                            </span>
                          </div>
                          <div className='text-xs font-semibold text-slate-700 print:text-black'>
                            Rata-rata Kehadiran:{' '}
                            <strong className='text-emerald-700 print:text-black'>
                              {cls.stats.avgPercentage}%
                            </strong>
                            <span className='text-[10px] text-slate-500 print:text-slate-600 ml-2'>
                              (H: {cls.stats.hadir} | S: {cls.stats.sakit} | I:{' '}
                              {cls.stats.izin} | A: {cls.stats.alfa})
                            </span>
                          </div>
                        </div>

                        <div className='overflow-x-auto'>
                          <table className='w-full border-collapse border border-slate-300 text-xs bg-white print:bg-transparent'>
                            <thead>
                              <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                                <th className='border border-slate-300 px-2 py-2 text-center font-bold w-8'>
                                  No
                                </th>
                                <th className='border border-slate-300 px-2 py-2 text-center font-bold w-24'>
                                  NIS
                                </th>
                                <th className='border border-slate-300 px-2 py-2 text-left font-bold min-w-[140px]'>
                                  Nama Lengkap
                                </th>
                                <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8'>
                                  L/P
                                </th>
                                {allClassesWeeklyReport.datesList.map(
                                  (dStr: string) => {
                                    const [y, m, d] = dStr
                                      .split('-')
                                      .map(Number);
                                    const dt = new Date(y, m - 1, d);
                                    const dayNames = [
                                      'Min',
                                      'Sen',
                                      'Sel',
                                      'Rab',
                                      'Kam',
                                      'Jum',
                                      'Sab',
                                    ];
                                    return (
                                      <th
                                        key={dStr}
                                        className='border border-slate-300 px-1 py-2 text-center font-bold w-12'
                                      >
                                        <div>{dayNames[dt.getDay()]}</div>
                                        <div className='text-[10px] text-slate-500 font-normal'>
                                          {d}/{m}
                                        </div>
                                      </th>
                                    );
                                  },
                                )}
                                <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-emerald-50 print:bg-transparent'>
                                  H
                                </th>
                                <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-blue-50 print:bg-transparent'>
                                  S
                                </th>
                                <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-amber-50 print:bg-transparent'>
                                  I
                                </th>
                                <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-rose-50 print:bg-transparent'>
                                  A
                                </th>
                                <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12'>
                                  %
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {cls.studentsReport.map(
                                (student: any, idx: number) => (
                                  <tr
                                    key={student.studentId}
                                    className='border-b border-slate-200'
                                  >
                                    <td className='border border-slate-300 px-2 py-1.5 text-center'>
                                      {idx + 1}
                                    </td>
                                    <td className='border border-slate-300 px-2 py-1.5 text-center font-mono'>
                                      {student.nis}
                                    </td>
                                    <td className='border border-slate-300 px-2 py-1.5 font-bold'>
                                      {student.name}
                                    </td>
                                    <td className='border border-slate-300 px-1 py-1.5 text-center'>
                                      {student.gender || '-'}
                                    </td>
                                    {allClassesWeeklyReport.datesList.map(
                                      (dStr: string) => {
                                        const st = student.dailyMap
                                          ? student.dailyMap[dStr]
                                          : '';
                                        const code =
                                          st === 'Hadir'
                                            ? 'H'
                                            : st === 'Sakit'
                                              ? 'S'
                                              : st === 'Izin'
                                                ? 'I'
                                                : st === 'Alfa'
                                                  ? 'A'
                                                  : '-';
                                        return (
                                          <td
                                            key={dStr}
                                            className={`border border-slate-300 text-center font-semibold ${code === 'A' ? 'text-rose-700 bg-rose-50 print:bg-transparent print:text-black' : code === 'S' || code === 'I' ? 'text-amber-700 bg-amber-50 print:bg-transparent print:text-black' : ''}`}
                                          >
                                            {code}
                                          </td>
                                        );
                                      },
                                    )}
                                    <td className='border border-slate-300 text-center font-bold text-emerald-700'>
                                      {student.hadir}
                                    </td>
                                    <td className='border border-slate-300 text-center font-bold text-blue-700'>
                                      {student.sakit}
                                    </td>
                                    <td className='border border-slate-300 text-center font-bold text-amber-700'>
                                      {student.izin}
                                    </td>
                                    <td className='border border-slate-300 text-center font-bold text-rose-700'>
                                      {student.alfa}
                                    </td>
                                    <td className='border border-slate-300 text-center font-extrabold'>
                                      {student.percentage}%
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Bulanan - Mode Kelas Aktif */}
              {exportPeriod === 'bulanan' &&
                classScope === 'active' &&
                monthlyReport && (
                  <div className='mb-8 overflow-x-auto'>
                    <table className='w-full border-collapse border border-slate-300 text-xs'>
                      <thead>
                        <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-8'>
                            No
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-24'>
                            NIS
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-left font-bold min-w-[140px]'>
                            Nama Lengkap
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8'>
                            L/P
                          </th>
                          {Array.from(
                            { length: monthlyReport.daysInMonth },
                            (_, i) => i + 1,
                          ).map((d) => (
                            <th
                              key={d}
                              className='border border-slate-300 px-1 py-2 text-center font-bold w-6'
                            >
                              {d}
                            </th>
                          ))}
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-emerald-50 print:bg-transparent'>
                            H
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-blue-50 print:bg-transparent'>
                            S
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-amber-50 print:bg-transparent'>
                            I
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-8 bg-rose-50 print:bg-transparent'>
                            A
                          </th>
                          <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12'>
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyReport.studentsReport.map(
                          (student: any, idx: number) => (
                            <tr
                              key={student.studentId}
                              className='border-b border-slate-200'
                            >
                              <td className='border border-slate-300 px-2 py-1.5 text-center'>
                                {idx + 1}
                              </td>
                              <td className='border border-slate-300 px-2 py-1.5 text-center font-mono'>
                                {student.nis}
                              </td>
                              <td className='border border-slate-300 px-2 py-1.5 font-bold'>
                                {student.name}
                              </td>
                              <td className='border border-slate-300 px-1 py-1.5 text-center'>
                                {student.gender || '-'}
                              </td>
                              {Array.from(
                                { length: monthlyReport.daysInMonth },
                                (_, i) => i + 1,
                              ).map((d) => {
                                const st = student.dailyMap[d];
                                const code =
                                  st === 'Hadir'
                                    ? 'H'
                                    : st === 'Sakit'
                                      ? 'S'
                                      : st === 'Izin'
                                        ? 'I'
                                        : st === 'Alfa'
                                          ? 'A'
                                          : '';
                                return (
                                  <td
                                    key={d}
                                    className={`border border-slate-300 text-center font-semibold ${code === 'A' ? 'text-rose-700 bg-rose-50 print:bg-transparent print:text-black' : code === 'S' || code === 'I' ? 'text-amber-700 bg-amber-50 print:bg-transparent print:text-black' : ''}`}
                                  >
                                    {code}
                                  </td>
                                );
                              })}
                              <td className='border border-slate-300 text-center font-bold text-emerald-700'>
                                {student.hadir}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-blue-700'>
                                {student.sakit}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-amber-700'>
                                {student.izin}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-rose-700'>
                                {student.alfa}
                              </td>
                              <td className='border border-slate-300 text-center font-extrabold'>
                                {student.percentage}%
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Bulanan - Mode Semua Kelas (Multi-Tabel) */}
              {exportPeriod === 'bulanan' && classScope === 'all' && (
                <div className='mb-8 space-y-8'>
                  {isAllClassesMonthlyLoading ? (
                    <div className='p-12 flex flex-col items-center justify-center gap-3 text-slate-500'>
                      <Loader2 className='h-7 w-7 animate-spin text-emerald-600' />
                      <span className='text-xs font-semibold'>
                        Memuat data rekap presensi seluruh kelas...
                      </span>
                    </div>
                  ) : !allClassesMonthlyReport ||
                    !allClassesMonthlyReport.classesReport ||
                    allClassesMonthlyReport.classesReport.length === 0 ? (
                    <div className='p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-300 rounded-xl'>
                      Tidak ada data kelas yang ditemukan untuk periode ini.
                    </div>
                  ) : (
                    allClassesMonthlyReport.classesReport.map((cls: any) => (
                      <div
                        key={cls.className}
                        className='break-inside-avoid print:break-inside-avoid border border-slate-200 print:border-none p-3 print:p-0 rounded-xl bg-slate-50/40 print:bg-transparent shadow-xs print:shadow-none'
                      >
                        {/* Sub-Header Kelas */}
                        <div className='flex items-center justify-between mb-2 pb-1.5 border-b-2 border-slate-800 print:border-black'>
                          <div className='flex items-center gap-2'>
                            <span className='font-black text-sm uppercase text-slate-900 print:text-black'>
                              KELAS: {cls.className}
                            </span>
                            <span className='text-xs font-bold text-slate-500 print:text-slate-700'>
                              ({cls.totalStudents} Siswa)
                            </span>
                          </div>
                          <div className='text-xs font-semibold text-slate-700 print:text-black'>
                            Rata-rata Kehadiran:{' '}
                            <strong className='text-emerald-700 print:text-black'>
                              {cls.stats.avgPercentage}%
                            </strong>
                            <span className='text-[10px] text-slate-500 print:text-slate-600 ml-2'>
                              (H: {cls.stats.hadir} | S: {cls.stats.sakit} | I:{' '}
                              {cls.stats.izin} | A: {cls.stats.alfa})
                            </span>
                          </div>
                        </div>

                        {cls.studentsReport.length === 0 ? (
                          <div className='py-4 text-center text-xs text-slate-400 italic'>
                            Belum ada data siswa di kelas {cls.className}.
                          </div>
                        ) : tableLayoutFormat === 'detail' ? (
                          /* TABEL DETAIL TANGGAL (1-31) */
                          <div className='overflow-x-auto'>
                            <table className='w-full border-collapse border border-slate-300 text-[11px] bg-white print:bg-transparent'>
                              <thead>
                                <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                                  <th className='border border-slate-300 px-1 py-1.5 text-center font-bold w-7'>
                                    No
                                  </th>
                                  <th className='border border-slate-300 px-1.5 py-1.5 text-center font-bold w-20'>
                                    NIS
                                  </th>
                                  <th className='border border-slate-300 px-2 py-1.5 text-left font-bold min-w-[130px]'>
                                    Nama Lengkap
                                  </th>
                                  <th className='border border-slate-300 px-1 py-1.5 text-center font-bold w-7'>
                                    L/P
                                  </th>
                                  {Array.from(
                                    {
                                      length:
                                        allClassesMonthlyReport.daysInMonth,
                                    },
                                    (_, i) => i + 1,
                                  ).map((d) => (
                                    <th
                                      key={d}
                                      className='border border-slate-300 px-0.5 py-1.5 text-center font-bold w-5 text-[10px]'
                                    >
                                      {d}
                                    </th>
                                  ))}
                                  <th className='border border-slate-300 px-1 py-1.5 text-center font-bold w-7 bg-emerald-50 print:bg-transparent'>
                                    H
                                  </th>
                                  <th className='border border-slate-300 px-1 py-1.5 text-center font-bold w-7 bg-blue-50 print:bg-transparent'>
                                    S
                                  </th>
                                  <th className='border border-slate-300 px-1 py-1.5 text-center font-bold w-7 bg-amber-50 print:bg-transparent'>
                                    I
                                  </th>
                                  <th className='border border-slate-300 px-1 py-1.5 text-center font-bold w-7 bg-rose-50 print:bg-transparent'>
                                    A
                                  </th>
                                  <th className='border border-slate-300 px-1 py-1.5 text-center font-bold w-10'>
                                    %
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {cls.studentsReport.map(
                                  (student: any, idx: number) => (
                                    <tr
                                      key={student.studentId}
                                      className='border-b border-slate-200'
                                    >
                                      <td className='border border-slate-300 px-1 py-1 text-center'>
                                        {idx + 1}
                                      </td>
                                      <td className='border border-slate-300 px-1 py-1 text-center font-mono'>
                                        {student.nis}
                                      </td>
                                      <td className='border border-slate-300 px-2 py-1 font-bold'>
                                        {student.name}
                                      </td>
                                      <td className='border border-slate-300 px-1 py-1 text-center'>
                                        {student.gender || '-'}
                                      </td>
                                      {Array.from(
                                        {
                                          length:
                                            allClassesMonthlyReport.daysInMonth,
                                        },
                                        (_, i) => i + 1,
                                      ).map((d) => {
                                        const st = student.dailyMap
                                          ? student.dailyMap[d]
                                          : '';
                                        const code =
                                          st === 'Hadir'
                                            ? 'H'
                                            : st === 'Sakit'
                                              ? 'S'
                                              : st === 'Izin'
                                                ? 'I'
                                                : st === 'Alfa'
                                                  ? 'A'
                                                  : '';
                                        return (
                                          <td
                                            key={d}
                                            className={`border border-slate-300 text-center font-semibold text-[10px] ${
                                              code === 'A'
                                                ? 'text-rose-700 bg-rose-50 print:bg-transparent print:text-black font-bold'
                                                : code === 'S' || code === 'I'
                                                  ? 'text-amber-700 bg-amber-50 print:bg-transparent print:text-black'
                                                  : ''
                                            }`}
                                          >
                                            {code}
                                          </td>
                                        );
                                      })}
                                      <td className='border border-slate-300 text-center font-bold text-emerald-700'>
                                        {student.hadir}
                                      </td>
                                      <td className='border border-slate-300 text-center font-bold text-blue-700'>
                                        {student.sakit}
                                      </td>
                                      <td className='border border-slate-300 text-center font-bold text-amber-700'>
                                        {student.izin}
                                      </td>
                                      <td className='border border-slate-300 text-center font-bold text-rose-700'>
                                        {student.alfa}
                                      </td>
                                      <td className='border border-slate-300 text-center font-extrabold'>
                                        {student.percentage}%
                                      </td>
                                    </tr>
                                  ),
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          /* TABEL REKAP RINGKAS (HEMAT KERTAS) */
                          <div className='overflow-x-auto'>
                            <table className='w-full border-collapse border border-slate-300 text-xs bg-white print:bg-transparent'>
                              <thead>
                                <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                                  <th className='border border-slate-300 px-2 py-1.5 text-center font-bold w-10'>
                                    No
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-center font-bold w-28'>
                                    NIS
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-left font-bold'>
                                    Nama Lengkap Siswa
                                  </th>
                                  <th className='border border-slate-300 px-2 py-1.5 text-center font-bold w-12'>
                                    L/P
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-center font-bold w-16 bg-emerald-50 print:bg-transparent text-emerald-800 print:text-black'>
                                    Hadir (H)
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-center font-bold w-16 bg-blue-50 print:bg-transparent text-blue-800 print:text-black'>
                                    Sakit (S)
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-center font-bold w-16 bg-amber-50 print:bg-transparent text-amber-800 print:text-black'>
                                    Izin (I)
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-center font-bold w-16 bg-rose-50 print:bg-transparent text-rose-800 print:text-black'>
                                    Alfa (A)
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-center font-bold w-20'>
                                    Total Hari
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-center font-bold w-24'>
                                    % Kehadiran
                                  </th>
                                  <th className='border border-slate-300 px-3 py-1.5 text-center font-bold w-28'>
                                    Predikat
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {cls.studentsReport.map(
                                  (student: any, idx: number) => {
                                    const statusText =
                                      student.percentage >= 90
                                        ? 'Sangat Baik'
                                        : student.percentage >= 75
                                          ? 'Baik'
                                          : student.percentage >= 60
                                            ? 'Cukup'
                                            : 'Perlu Perhatian';
                                    return (
                                      <tr
                                        key={student.studentId}
                                        className='border-b border-slate-200'
                                      >
                                        <td className='border border-slate-300 px-2 py-1.5 text-center'>
                                          {idx + 1}
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 text-center font-mono font-medium'>
                                          {student.nis}
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 font-bold'>
                                          {student.name}
                                        </td>
                                        <td className='border border-slate-300 px-2 py-1.5 text-center'>
                                          {student.gender || '-'}
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 text-center font-bold text-emerald-700'>
                                          {student.hadir}
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 text-center font-bold text-blue-700'>
                                          {student.sakit}
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 text-center font-bold text-amber-700'>
                                          {student.izin}
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 text-center font-bold text-rose-700'>
                                          {student.alfa}
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 text-center font-medium'>
                                          {student.totalRecorded}
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 text-center font-black'>
                                          {student.percentage}%
                                        </td>
                                        <td className='border border-slate-300 px-3 py-1.5 text-center text-[11px] font-semibold'>
                                          {statusText}
                                        </td>
                                      </tr>
                                    );
                                  },
                                )}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tahunan - Mode Kelas Aktif */}
              {exportPeriod === 'tahunan' &&
                classScope === 'active' &&
                yearlyReport && (
                  <div className='mb-8 overflow-x-auto'>
                    <table className='w-full border-collapse border border-slate-300 text-xs'>
                      <thead>
                        <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-10'>
                            No
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-24'>
                            NIS
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-left font-bold min-w-[160px]'>
                            Nama Lengkap
                          </th>
                          <th className='border border-slate-300 px-1 py-2 text-center font-bold w-10'>
                            L/P
                          </th>
                          {[
                            'Jan',
                            'Feb',
                            'Mar',
                            'Apr',
                            'Mei',
                            'Jun',
                            'Jul',
                            'Ags',
                            'Sep',
                            'Okt',
                            'Nov',
                            'Des',
                          ].map((m) => (
                            <th
                              key={m}
                              className='border border-slate-300 px-1 py-2 text-center font-bold w-10'
                            >
                              {m}
                            </th>
                          ))}
                          <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12 bg-emerald-50 print:bg-transparent'>
                            Tot. H
                          </th>
                          <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12 bg-blue-50 print:bg-transparent'>
                            Tot. S
                          </th>
                          <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12 bg-amber-50 print:bg-transparent'>
                            Tot. I
                          </th>
                          <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12 bg-rose-50 print:bg-transparent'>
                            Tot. A
                          </th>
                          <th className='border border-slate-300 px-2 py-2 text-center font-bold w-16'>
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearlyReport.studentsReport.map(
                          (student: any, idx: number) => (
                            <tr
                              key={student.studentId}
                              className='border-b border-slate-200'
                            >
                              <td className='border border-slate-300 px-2 py-1.5 text-center'>
                                {idx + 1}
                              </td>
                              <td className='border border-slate-300 px-2 py-1.5 text-center font-mono'>
                                {student.nis}
                              </td>
                              <td className='border border-slate-300 px-2 py-1.5 font-bold'>
                                {student.name}
                              </td>
                              <td className='border border-slate-300 px-1 py-1.5 text-center'>
                                {student.gender || '-'}
                              </td>
                              {student.monthlyBreakdown.map(
                                (mb: any, mIdx: number) => (
                                  <td
                                    key={mIdx}
                                    className='border border-slate-300 text-center font-medium'
                                  >
                                    {mb.hadir > 0 ? mb.hadir : '-'}
                                  </td>
                                ),
                              )}
                              <td className='border border-slate-300 text-center font-bold text-emerald-700'>
                                {student.hadir}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-blue-700'>
                                {student.sakit}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-amber-700'>
                                {student.izin}
                              </td>
                              <td className='border border-slate-300 text-center font-bold text-rose-700'>
                                {student.alfa}
                              </td>
                              <td className='border border-slate-300 text-center font-extrabold'>
                                {student.percentage}%
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Tahunan - Mode Semua Kelas (Multi-Tabel) */}
              {exportPeriod === 'tahunan' && classScope === 'all' && (
                <div className='mb-8 space-y-8'>
                  {isAllClassesYearlyLoading ? (
                    <div className='p-12 flex flex-col items-center justify-center gap-3 text-slate-500'>
                      <Loader2 className='h-7 w-7 animate-spin text-emerald-600' />
                      <span className='text-xs font-semibold'>
                        Memuat data rekap absensi tahunan seluruh kelas...
                      </span>
                    </div>
                  ) : !allClassesYearlyReport ||
                    !allClassesYearlyReport.classesReport ||
                    allClassesYearlyReport.classesReport.length === 0 ? (
                    <div className='p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-300 rounded-xl'>
                      Tidak ada data kelas yang ditemukan untuk periode tahunan
                      ini.
                    </div>
                  ) : (
                    allClassesYearlyReport.classesReport.map((cls: any) => (
                      <div
                        key={cls.className}
                        className='break-inside-avoid print:break-inside-avoid border border-slate-200 print:border-none p-3 print:p-0 rounded-xl bg-slate-50/40 print:bg-transparent shadow-xs print:shadow-none'
                      >
                        {/* Sub-Header Kelas */}
                        <div className='flex items-center justify-between mb-2 pb-1.5 border-b-2 border-slate-800 print:border-black'>
                          <div className='flex items-center gap-2'>
                            <span className='font-black text-sm uppercase text-slate-900 print:text-black'>
                              KELAS: {cls.className}
                            </span>
                            <span className='text-xs font-bold text-slate-500 print:text-slate-700'>
                              ({cls.totalStudents} Siswa)
                            </span>
                          </div>
                          <div className='text-xs font-semibold text-slate-700 print:text-black'>
                            Rata-rata Kehadiran:{' '}
                            <strong className='text-emerald-700 print:text-black'>
                              {cls.stats.avgPercentage}%
                            </strong>
                            <span className='text-[10px] text-slate-500 print:text-slate-600 ml-2'>
                              (H: {cls.stats.hadir} | S: {cls.stats.sakit} | I:{' '}
                              {cls.stats.izin} | A: {cls.stats.alfa})
                            </span>
                          </div>
                        </div>

                        <div className='overflow-x-auto'>
                          <table className='w-full border-collapse border border-slate-300 text-xs bg-white print:bg-transparent'>
                            <thead>
                              <tr className='bg-slate-100 print:bg-slate-200 text-slate-900'>
                                <th className='border border-slate-300 px-2 py-2 text-center font-bold w-10'>
                                  No
                                </th>
                                <th className='border border-slate-300 px-2 py-2 text-center font-bold w-24'>
                                  NIS
                                </th>
                                <th className='border border-slate-300 px-2 py-2 text-left font-bold min-w-[160px]'>
                                  Nama Lengkap
                                </th>
                                <th className='border border-slate-300 px-1 py-2 text-center font-bold w-10'>
                                  L/P
                                </th>
                                {[
                                  'Jan',
                                  'Feb',
                                  'Mar',
                                  'Apr',
                                  'Mei',
                                  'Jun',
                                  'Jul',
                                  'Ags',
                                  'Sep',
                                  'Okt',
                                  'Nov',
                                  'Des',
                                ].map((m) => (
                                  <th
                                    key={m}
                                    className='border border-slate-300 px-1 py-2 text-center font-bold w-10'
                                  >
                                    {m}
                                  </th>
                                ))}
                                <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12 bg-emerald-50 print:bg-transparent'>
                                  Tot. H
                                </th>
                                <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12 bg-blue-50 print:bg-transparent'>
                                  Tot. S
                                </th>
                                <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12 bg-amber-50 print:bg-transparent'>
                                  Tot. I
                                </th>
                                <th className='border border-slate-300 px-1.5 py-2 text-center font-bold w-12 bg-rose-50 print:bg-transparent'>
                                  Tot. A
                                </th>
                                <th className='border border-slate-300 px-2 py-2 text-center font-bold w-16'>
                                  %
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {cls.studentsReport.map(
                                (student: any, idx: number) => (
                                  <tr
                                    key={student.studentId}
                                    className='border-b border-slate-200'
                                  >
                                    <td className='border border-slate-300 px-2 py-1.5 text-center'>
                                      {idx + 1}
                                    </td>
                                    <td className='border border-slate-300 px-2 py-1.5 text-center font-mono'>
                                      {student.nis}
                                    </td>
                                    <td className='border border-slate-300 px-2 py-1.5 font-bold'>
                                      {student.name}
                                    </td>
                                    <td className='border border-slate-300 px-1 py-1.5 text-center'>
                                      {student.gender || '-'}
                                    </td>
                                    {student.monthlyBreakdown.map(
                                      (mb: any, mIdx: number) => (
                                        <td
                                          key={mIdx}
                                          className='border border-slate-300 text-center font-medium'
                                        >
                                          {mb.hadir > 0 ? mb.hadir : '-'}
                                        </td>
                                      ),
                                    )}
                                    <td className='border border-slate-300 text-center font-bold text-emerald-700'>
                                      {student.hadir}
                                    </td>
                                    <td className='border border-slate-300 text-center font-bold text-blue-700'>
                                      {student.sakit}
                                    </td>
                                    <td className='border border-slate-300 text-center font-bold text-amber-700'>
                                      {student.izin}
                                    </td>
                                    <td className='border border-slate-300 text-center font-bold text-rose-700'>
                                      {student.alfa}
                                    </td>
                                    <td className='border border-slate-300 text-center font-extrabold'>
                                      {student.percentage}%
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Official Interactive Signature Section (Matching Jurnal Wali Kelas) */}
              <div className='mt-12 pt-6 text-xs text-slate-900 print:text-black font-semibold break-inside-avoid'>
                {/* Baris Tempat & Tanggal Cetak (Satu Baris di Atas 'Mengetahui,') */}
                <div className='grid grid-cols-2 gap-8 mb-2'>
                  <div />{' '}
                  {/* Kolom kiri kosong agar tanggal tepat di atas tanda tangan kanan */}
                  <div className='sm:pl-8'>
                    <div className='flex items-center gap-1 mb-1'>
                      <Input
                        value={signatureData.place}
                        onChange={(e) =>
                          updateSignatureData({
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
                          updateSignatureData({
                            date: e.target.value,
                          })
                        }
                        style={{
                          width: `${Math.max((signatureData.date || '').length * 7.5 + 4, 80)}px`,
                        }}
                        className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 print:border-none print:p-0'
                      />
                    </div>
                  </div>
                </div>

                {/* Grid 2 Kolom Pengesahan: Kiri (Kepala Sekolah) & Kanan (Guru Kelas) */}
                <div className='grid grid-cols-2 gap-8'>
                  {/* Left Column: Supervisor / Principal */}
                  <div className='space-y-1.5'>
                    <p className='font-bold text-slate-800 print:text-black'>
                      Mengetahui,
                    </p>
                    <Input
                      value={signatureData.supervisorTitle}
                      placeholder='Kepala Sekolah'
                      onChange={(e) =>
                        updateSignatureData({
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
                          updateSignatureData({
                            supervisorName: e.target.value,
                          })
                        }
                        className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full max-w-xs print:border-none print:p-0'
                      />
                      <div className='flex items-center gap-1 text-[11px] text-slate-700 print:text-black'>
                        <span>NIP/NUPTK.</span>
                        <Input
                          placeholder='Ketik NIP...'
                          value={signatureData.supervisorNip}
                          onChange={(e) =>
                            updateSignatureData({
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
                    <div className='h-5 select-none' aria-hidden='true' />{' '}
                    {/* Penyeimbang vertikal setara teks 'Mengetahui,' */}
                    <Input
                      value={signatureData.teacherTitle}
                      onChange={(e) =>
                        updateSignatureData({
                          teacherTitle: e.target.value,
                        })
                      }
                      className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full max-w-xs print:border-none print:p-0'
                    />
                    <div className='h-20' /> {/* Signature Space */}
                    <div className='space-y-1'>
                      <Input
                        value={signatureData.teacherName}
                        onChange={(e) => {
                          updateSignatureData({
                            teacherName: e.target.value,
                          });
                          updateDocHeader({
                            teacherName: e.target.value,
                          });
                        }}
                        className='font-bold text-xs border-b border-slate-300 border-x-0 border-t-0 rounded-none h-6 px-0 focus:border-emerald-600 w-full max-w-xs print:border-none print:p-0'
                      />
                      <div className='flex items-center gap-1 text-[11px] text-slate-700 print:text-black'>
                        <span>NIP/NUPTK.</span>
                        <Input
                          value={signatureData.teacherNip}
                          onChange={(e) => {
                            updateSignatureData({
                              teacherNip: e.target.value,
                            });
                            updateDocHeader({
                              nip: e.target.value,
                            });
                          }}
                          className='text-[11px] border-b border-slate-300 border-x-0 border-t-0 rounded-none h-5 px-0 focus:border-emerald-600 w-44 print:border-none print:p-0'
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
