'use client';

import React, { useState, useEffect, useTransition } from 'react';
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
  getMonthlyAttendanceReport,
  getYearlyAttendanceReport,
  getAttendanceHeaderInfo,
} from '@/actions/attendanceActions';
import {
  exportWeeklyAttendanceToExcel,
  exportMonthlyAttendanceToExcel,
  exportYearlyAttendanceToExcel,
} from '@/lib/excelExport';

type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';
type ExportPeriod = 'mingguan' | 'bulanan' | 'tahunan';
type ViewMode = 'input' | 'preview';

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

  // Dynamic Document Header State
  const [docHeader, setDocHeader] = useState({
    schoolName: 'SMK NEGERI 1',
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
    supervisorTitle: 'Mengetahui, Kepala Sekolah',
    supervisorName: '',
    supervisorNip: '-',
    teacherTitle: 'Guru Kelas / Wali Kelas',
    teacherName: '',
    teacherNip: '-',
  });

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

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
        supervisorNip:
          headerInfo.principalNip && headerInfo.principalNip.trim() !== ''
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

  // Query 2: Weekly Attendance Report
  const { data: weeklyReport } = useQuery({
    queryKey: [
      'weeklyAttendance',
      weekRange.startDateStr,
      weekRange.endDateStr,
    ],
    queryFn: () =>
      getWeeklyAttendanceReport(weekRange.startDateStr, weekRange.endDateStr),
    enabled: exportPeriod === 'mingguan',
  });

  // Query 3: Monthly Attendance Report
  const { data: monthlyReport } = useQuery({
    queryKey: ['monthlyAttendance', selectedYear, selectedMonth],
    queryFn: () => getMonthlyAttendanceReport(selectedYear, selectedMonth),
    enabled: exportPeriod === 'bulanan',
  });

  // Query 4: Yearly Attendance Report
  const { data: yearlyReport } = useQuery({
    queryKey: ['yearlyAttendance', selectedYear],
    queryFn: () => getYearlyAttendanceReport(selectedYear),
    enabled: exportPeriod === 'tahunan',
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
      } else if (exportPeriod === 'bulanan') {
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
              throw new Error('Tidak ada data absensi bulanan untuk diekspor.');
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
      } else if (exportPeriod === 'tahunan') {
        toast.promise(
          (async () => {
            const data =
              yearlyReport || (await getYearlyAttendanceReport(selectedYear));
            if (
              !data ||
              !data.studentsReport ||
              data.studentsReport.length === 0
            ) {
              throw new Error('Tidak ada data absensi tahunan untuk diekspor.');
            }
            await exportYearlyAttendanceToExcel(data, docHeader, signatureData);
          })(),
          {
            loading: 'Menyusun rekap Excel tahunan...',
            success: 'Excel rekap tahunan berhasil diunduh!',
            error: (err) => err.message || 'Gagal mengunduh Excel.',
          },
        );
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

  const formattedSelectedDate = format(selectedDate, 'EEEE, dd MMMM yyyy', {
    locale: id,
  });

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

          <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
            {viewMode === 'input' && (
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
              <div className='flex flex-col items-center justify-center py-12 sm:py-20 px-4 text-center text-slate-500 max-w-md mx-auto'>
                <UserCheck className='h-10 w-10 text-slate-300 mb-2 shrink-0' />
                <p className='text-sm sm:text-base font-extrabold text-slate-800 tracking-tight'>
                  Tidak ada siswa terdaftar di kelas.
                </p>
                <p className='text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed'>
                  Silakan tambahkan siswa terlebih dahulu di halaman Data Siswa.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MODE 2: PRATINJAU CETAK (A4 LIVE PRINT PREVIEW WITH INTERACTIVE DYNAMIC HEADER) */}
      {viewMode === 'preview' && (
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
                    Live Preview Cetak Laporan Absensi Siswa
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

            {/* Rentang Laporan Pills + Dynamic Selectors + Actions */}
            <div className='grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2.5 w-full lg:w-auto'>
              {/* Header Info Dialog Modal Trigger Button */}
              <Dialog open={headerModalOpen} onOpenChange={setHeaderModalOpen}>
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
                          Nama Guru Kelas
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
                          NIP/NUPTK Guru
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

              {/* Rentang Laporan Pills */}
              <div className='grid grid-cols-3 sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 w-full sm:w-auto'>
                {(['mingguan', 'bulanan', 'tahunan'] as ExportPeriod[]).map(
                  (period) => {
                    const isActive = exportPeriod === period;
                    return (
                      <button
                        key={period}
                        onClick={() => setExportPeriod(period)}
                        className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer text-center justify-center flex items-center ${
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

              {/* Dynamic Period Selectors */}
              {exportPeriod === 'mingguan' && (
                <Popover>
                  <PopoverTrigger className='justify-start text-left font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl h-10 gap-2 flex items-center px-3 cursor-pointer text-xs'>
                    <CalendarIcon className='h-3.5 w-3.5 text-emerald-600' />
                    <span>
                      {format(weekRange.mondayDate, 'dd MMM', { locale: id })} -{' '}
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
                <div className='flex items-center gap-1.5'>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className='bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer'
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
                    className='bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer'
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
                  className='bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer'
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              )}

              <div className='grid grid-cols-2 gap-2 w-full sm:w-auto'>
                <Button
                  onClick={handleExportExcel}
                  variant='outline'
                  className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center'
                >
                  <Download className='h-4 w-4 text-emerald-600' />
                  Ekspor Excel
                </Button>

                <Button
                  onClick={handlePrint}
                  variant='outline'
                  className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs cursor-pointer w-full sm:w-auto justify-center'
                >
                  <Printer className='h-4 w-4 text-blue-600' />
                  Cetak PDF
                </Button>
              </div>
            </div>
          </div>

          {/* Printable Document Wrapper (A4 Simulation with Interactive Dynamic Headers) */}
          <div className='bg-slate-200/70 p-2 sm:p-10 rounded-2xl border border-slate-300/80 flex justify-start sm:justify-center overflow-x-auto shadow-inner print:p-0 print:m-0 print:bg-white print:border-none'>
            <div className='w-full max-w-[950px] min-w-[340px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-4 sm:p-14 print:p-6 print:m-0 print:shadow-none print:border-none print:w-full print:max-w-none print:text-black font-sans leading-relaxed overflow-x-auto'>
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
                    exportPeriod === 'mingguan'
                      ? `LAPORAN REKAPITULASI ABSENSI MINGGUAN SISWA`
                      : exportPeriod === 'bulanan'
                        ? `LAPORAN REKAPITULASI ABSENSI BULAN ${MONTH_NAMES[selectedMonth - 1].toUpperCase()} ${selectedYear}`
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
                    Guru Kelas
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
              </div>

              {/* Printable Table Content */}
              {exportPeriod === 'mingguan' && weeklyReport && (
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

              {exportPeriod === 'bulanan' && monthlyReport && (
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

              {exportPeriod === 'tahunan' && yearlyReport && (
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
                      <span>NIP/NUPTK.</span>
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
