'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Download,
  Loader2,
  Check,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  getAttendanceByDate,
  saveBulkAttendance,
} from '@/actions/attendanceActions';
import { exportAttendanceToExcel } from '@/lib/excelExport';

type AttendanceStatus = 'Hadir' | 'Sakit' | 'Izin' | 'Alfa';

interface StudentAttendanceRow {
  studentId: string;
  name: string;
  nis: string;
  className: string;
  gender: string;
  status: AttendanceStatus;
}

export default function AbsensiClient() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [localRecords, setLocalRecords] = useState<StudentAttendanceRow[]>([]);
  const [isPending, startTransition] = useTransition();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Fetch attendance data for the selected date
  const {
    data: serverRecords,
    isLoading,
    isError,
  } = useQuery<StudentAttendanceRow[]>({
    queryKey: ['attendance', dateStr],
    queryFn: () => getAttendanceByDate(dateStr),
  });

  // Keep local records in sync with fetched server data
  useEffect(() => {
    if (serverRecords) {
      setLocalRecords(serverRecords);
    }
  }, [serverRecords]);

  // Toggle status for a student
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

  // Bulk toggle status for all students
  const handleMarkAll = (status: AttendanceStatus) => {
    setLocalRecords((prev) => prev.map((row) => ({ ...row, status })));
    toast.success(`Semua siswa ditandai sebagai '${status}'`);
  };

  const handleSave = () => {
    if (localRecords.length === 0) {
      toast.error('Tidak ada data siswa untuk disimpan.');
      return;
    }

    startTransition(async () => {
      try {
        const payload = localRecords.map((r) => ({
          studentId: r.studentId,
          status: r.status,
        }));
        await saveBulkAttendance(dateStr, payload);

        // Invalidate query to refresh cache
        queryClient.invalidateQueries({ queryKey: ['attendance', dateStr] });

        toast.success('Absensi berhasil disimpan!');
      } catch (err: any) {
        toast.error(err.message || 'Gagal menyimpan absensi.');
      }
    });
  };

  const handleExcelExport = async () => {
    if (localRecords.length === 0) {
      toast.error('Tidak ada data absensi untuk diekspor!');
      return;
    }
    const formattedDate = format(selectedDate, 'dd-MM-yyyy');
    toast.promise(exportAttendanceToExcel(localRecords, formattedDate), {
      loading: 'Menyusun laporan Excel absensi...',
      success: 'Excel absensi berhasil diunduh!',
      error: 'Gagal mengunduh Excel.',
    });
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900'>
            Absensi Siswa
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Catat dan perbarui absensi harian kelas secara massal dan cepat.
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
          <Button
            onClick={handleExcelExport}
            variant='outline'
            className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl h-10 px-3.5 sm:px-4 gap-2 shadow-xs'
          >
            <Download className='h-4 w-4' />
            Ekspor Excel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || isLoading}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl h-10 px-4 sm:px-6 gap-2 shadow-xs'
          >
            {isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <Check className='h-4 w-4' />
            )}
            Simpan Absensi
          </Button>
        </div>
      </div>

      {/* Date Select & Mass Toggles */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs'>
        {/* Date Selector Popover */}
        <div className='flex items-center gap-3 w-full sm:w-auto'>
          <Popover>
            <PopoverTrigger className='w-full sm:w-[240px] justify-start text-left font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl h-10 gap-2 flex items-center px-4 cursor-pointer text-xs sm:text-sm'>
              <CalendarIcon className='h-4 w-4 text-emerald-600' />
              {selectedDate ? (
                format(selectedDate, 'PPP')
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
        </div>

        {/* Mass Status Markers */}
        <div className='flex flex-wrap items-center gap-1.5 sm:gap-2'>
          <span className='text-xs text-slate-500 font-bold mr-1 w-full sm:w-auto'>
            Tandai Semua:
          </span>
          {(['Hadir', 'Sakit', 'Izin', 'Alfa'] as AttendanceStatus[]).map(
            (status) => (
              <Button
                key={status}
                onClick={() => handleMarkAll(status)}
                variant='outline'
                size='sm'
                disabled={isLoading || localRecords.length === 0}
                className={`rounded-xl px-2.5 sm:px-3 py-1 text-xs border font-semibold ${
                  status === 'Hadir'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : status === 'Sakit'
                      ? 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : status === 'Izin'
                        ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                {status}
              </Button>
            ),
          )}
        </div>
      </div>

      {/* Main Absensi Table */}
      <Card className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs'>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-20 text-slate-500 text-sm'>
              <Loader2 className='h-8 w-8 animate-spin text-emerald-600 mb-3' />
              <span>Memuat daftar absensi...</span>
            </div>
          ) : isError ? (
            <div className='text-center py-20 text-rose-600 text-sm font-medium'>
              Gagal memuat daftar siswa. Pastikan koneksi server aman.
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
                  <TableHead className='text-slate-700 font-bold'>
                    Nama Lengkap
                  </TableHead>
                  <TableHead className='w-32 text-slate-700 font-bold'>
                    Kelas
                  </TableHead>
                  <TableHead className='w-[380px] text-center text-slate-700 font-bold'>
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
                    <TableCell className='font-mono font-medium'>{row.nis}</TableCell>
                    <TableCell className='font-bold text-slate-900'>
                      {row.name}
                    </TableCell>
                    <TableCell className='font-medium'>{row.className}</TableCell>
                    <TableCell>
                      <div className='flex items-center justify-center gap-1.5'>
                        {(
                          [
                            'Hadir',
                            'Sakit',
                            'Izin',
                            'Alfa',
                          ] as AttendanceStatus[]
                        ).map((status) => {
                          const isActive = row.status === status;
                          return (
                            <Button
                              key={status}
                              onClick={() =>
                                handleStatusChange(row.studentId, status)
                              }
                              type='button'
                              className={`flex-1 rounded-xl py-1 px-3 text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                                status === 'Hadir'
                                  ? isActive
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                  : status === 'Sakit'
                                    ? isActive
                                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    : status === 'Izin'
                                      ? isActive
                                        ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                      : isActive
                                        ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                            >
                              {status}
                            </Button>
                          );
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='flex flex-col items-center justify-center py-20 text-slate-500'>
              <UserCheck className='h-10 w-10 text-slate-300 mb-2' />
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
    </div>
  );
}
