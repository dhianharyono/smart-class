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
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent'>
            Absensi Siswa
          </h2>
          <p className='text-zinc-400 text-sm'>
            Catat dan perbarui absensi harian kelas secara massal dan cepat.
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            onClick={handleExcelExport}
            variant='outline'
            className='border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 font-medium rounded-xl h-10 px-4 gap-2'
          >
            <Download className='h-4 w-4' />
            Ekspor Excel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || isLoading}
            className='bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl h-10 px-6 gap-2 shadow-lg shadow-emerald-500/10'
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
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 border border-zinc-900/80 rounded-2xl p-4'>
        {/* Date Selector Popover */}
        <div className='flex items-center gap-3'>
          <Popover>
            <PopoverTrigger className='w-[240px] justify-start text-left font-medium border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-zinc-200 rounded-xl h-10 gap-2 flex items-center px-4 cursor-pointer'>
              <CalendarIcon className='h-4 w-4 text-emerald-500' />
              {selectedDate ? (
                format(selectedDate, 'PPP')
              ) : (
                <span>Pilih Tanggal</span>
              )}
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0 bg-zinc-900 border-zinc-800 rounded-xl'>
              <Calendar
                mode='single'
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className='bg-zinc-900 text-white rounded-xl'
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Mass Status Markers */}
        <div className='flex items-center gap-2'>
          <span className='text-xs text-zinc-500 font-semibold mr-1'>
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
                className={`rounded-xl px-3 py-1 text-xs border ${
                  status === 'Hadir'
                    ? 'border-emerald-950/60 bg-emerald-950/10 text-emerald-400 hover:bg-emerald-950/30'
                    : status === 'Sakit'
                      ? 'border-blue-950/60 bg-blue-950/10 text-blue-400 hover:bg-blue-950/30'
                      : status === 'Izin'
                        ? 'border-amber-950/60 bg-amber-950/10 text-amber-400 hover:bg-amber-950/30'
                        : 'border-red-950/60 bg-red-950/10 text-red-400 hover:bg-red-950/30'
                }`}
              >
                {status}
              </Button>
            ),
          )}
        </div>
      </div>

      {/* Main Absensi Table */}
      <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl overflow-hidden shadow-xl'>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-20 text-zinc-500 text-sm'>
              <Loader2 className='h-8 w-8 animate-spin text-emerald-500 mb-3' />
              <span>Memuat daftar absensi...</span>
            </div>
          ) : isError ? (
            <div className='text-center py-20 text-red-400 text-sm'>
              Gagal memuat daftar siswa. Pastikan koneksi server aman.
            </div>
          ) : localRecords.length > 0 ? (
            <Table>
              <TableHeader className='bg-zinc-900/50 border-b border-zinc-800'>
                <TableRow className='border-b border-zinc-800 hover:bg-transparent'>
                  <TableHead className='w-12 text-center text-zinc-400 font-bold'>
                    No
                  </TableHead>
                  <TableHead className='w-32 text-zinc-400 font-bold'>
                    NIS
                  </TableHead>
                  <TableHead className='text-zinc-400 font-bold'>
                    Nama Lengkap
                  </TableHead>
                  <TableHead className='w-32 text-zinc-400 font-bold'>
                    Kelas
                  </TableHead>
                  <TableHead className='w-[380px] text-center text-zinc-400 font-bold'>
                    Status Kehadiran
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localRecords.map((row, index) => (
                  <TableRow
                    key={row.studentId}
                    className='border-b border-zinc-900 hover:bg-zinc-900/20 text-zinc-300'
                  >
                    <TableCell className='text-center font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono'>{row.nis}</TableCell>
                    <TableCell className='font-semibold text-zinc-200'>
                      {row.name}
                    </TableCell>
                    <TableCell>{row.className}</TableCell>
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
                              className={`flex-1 rounded-xl py-1 px-3 text-xs font-semibold border transition-all duration-150 ${
                                status === 'Hadir'
                                  ? isActive
                                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                                    : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                  : status === 'Sakit'
                                    ? isActive
                                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-950/40'
                                      : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                    : status === 'Izin'
                                      ? isActive
                                        ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/40'
                                        : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                      : isActive
                                        ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/40'
                                        : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
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
            <div className='flex flex-col items-center justify-center py-20 text-zinc-500'>
              <UserCheck className='h-10 w-10 text-zinc-700 mb-2' />
              <p className='text-sm font-semibold'>
                Tidak ada siswa terdaftar di kelas.
              </p>
              <p className='text-xs text-zinc-650'>
                Silakan tambahkan siswa terlebih dahulu di halaman Data Siswa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
