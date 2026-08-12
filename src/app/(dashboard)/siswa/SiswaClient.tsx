'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  AlertTriangle,
  Loader2,
  Users,
  UserPlus,
  Eye,
  User,
  Calendar,
  Building,
  GraduationCap,
  MapPin,
  HeartHandshake,
  CheckCircle2,
  X,
  CalendarCheck2,
} from 'lucide-react';
import AbsensiClient from '../absensi/AbsensiClient';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from '@/actions/studentActions';
import { exportStudentsToExcel } from '@/lib/excelExport';

export interface StudentData {
  _id: string;
  nis: string;
  name: string;
  className: string;
  gender: 'L' | 'P';
  nisn?: string;
  photo?: string;
  birthPlace?: string;
  birthDate?: string;
  religion?: string;
  address?: string;
  fatherName?: string;
  fatherJob?: string;
  motherName?: string;
  motherJob?: string;
  guardianName?: string;
  guardianJob?: string;
  entryDate?: string;
  entryClass?: string;
  entryAcademicYear?: string;
  previousSchool?: string;
  status?: 'Aktif' | 'Mutasi' | 'Lulus' | 'Non-Aktif';
}

interface SiswaClientProps {
  initialStudents: StudentData[];
}

export default function SiswaClient({ initialStudents }: SiswaClientProps) {
  const router = useRouter();
  const [students, setStudents] = useState<StudentData[]>(initialStudents);
  const [search, setSearch] = useState('');

  // Dialog Open States
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentData | null>(null);

  // Quick Form State
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(
    null,
  );
  const [formData, setFormData] = useState({
    nis: '',
    name: '',
    className: '',
    gender: 'L' as 'L' | 'P',
  });

  const [isPending, startTransition] = useTransition();

  // Keep local state in sync when initial data refreshes
  React.useEffect(() => {
    setStudents(initialStudents);
  }, [initialStudents]);

  // Filtering
  const filteredStudents = students.filter((student) => {
    const q = search.toLowerCase();
    return (
      student.name.toLowerCase().includes(q) ||
      student.nis.includes(q) ||
      (student.nisn && student.nisn.includes(q)) ||
      student.className.toLowerCase().includes(q)
    );
  });

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nis || !formData.name || !formData.className) {
      toast.error('Semua data wajib diisi!');
      return;
    }

    startTransition(async () => {
      try {
        await createStudent(formData);
        toast.success(`Berhasil menambahkan siswa ${formData.name}`);
        setAddOpen(false);
        setFormData({ nis: '', name: '', className: '', gender: 'L' });
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || 'Gagal menambahkan siswa.');
      }
    });
  };

  const handleDeleteSubmit = async () => {
    if (!selectedStudent) return;

    startTransition(async () => {
      try {
        await deleteStudent(selectedStudent._id);
        toast.success(`Siswa ${selectedStudent.name} berhasil dihapus.`);
        setDeleteOpen(false);
        setSelectedStudent(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || 'Gagal menghapus siswa.');
      }
    });
  };

  const handleExcelExport = async () => {
    if (filteredStudents.length === 0) {
      toast.error('Tidak ada data siswa untuk diekspor!');
      return;
    }
    toast.promise(exportStudentsToExcel(filteredStudents), {
      loading: 'Menyusun laporan Excel...',
      success: 'Excel berhasil diunduh!',
      error: 'Gagal mengunduh Excel.',
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Mutasi':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Lulus':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Non-Aktif':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      case 'Aktif':
      default:
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3'>
            <span>Data Siswa</span>
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Kelola profil lengkap seluruh siswa di kelas bimbingan Anda secara
            terstruktur.
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-2.5 w-full sm:w-auto'>
          <Button
            onClick={handleExcelExport}
            variant='outline'
            className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-3.5 gap-2 shadow-xs w-full sm:w-auto justify-center'
          >
            <Download className='h-4 w-4 text-amber-600' />
            <span>Ekspor Excel</span>
          </Button>
          <Link href='/siswa/tambah' className='w-full sm:w-auto'>
            <Button className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-4 gap-2 shadow-xs cursor-pointer w-full justify-center'>
              <UserPlus className='h-4 w-4' />
              <span>Input Biodata Lengkap</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className='flex items-center gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs'>
        <div className='relative flex-1'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
          <Input
            placeholder='Cari siswa berdasarkan nama, NIS, NISN, atau kelas...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 rounded-xl h-10 text-xs'
          />
        </div>
      </div>

      {/* Main Table */}
      <Card className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs'>
        <CardContent className='p-0'>
          <Table>
            <TableHeader className='bg-slate-50/80 border-b border-slate-200'>
              <TableRow className='border-b border-slate-200 hover:bg-transparent text-xs font-bold text-slate-700'>
                <TableHead className='w-12 text-center text-slate-700 font-bold'>
                  No
                </TableHead>
                <TableHead className='text-slate-700 font-bold'>
                  Foto & Nama Siswa
                </TableHead>
                <TableHead className='text-slate-700 font-bold'>
                  NIS / NISN
                </TableHead>
                <TableHead className='text-slate-700 font-bold'>
                  Kelas
                </TableHead>
                <TableHead className='text-slate-700 font-bold'>L/P</TableHead>
                <TableHead className='text-slate-700 font-bold'>
                  Status
                </TableHead>
                <TableHead className='w-36 text-center text-slate-700 font-bold'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <TableRow
                    key={student._id}
                    className='border-b border-slate-100 hover:bg-slate-50/80 text-slate-700 transition-colors text-xs'
                  >
                    <TableCell className='text-center font-medium text-slate-500'>
                      {index + 1}
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='h-9 w-9 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs'>
                          {student.photo ? (
                            <img
                              src={student.photo}
                              alt={student.name}
                              className='w-full h-full object-cover'
                            />
                          ) : (
                            <User className='h-5 w-5 text-slate-400' />
                          )}
                        </div>
                        <div>
                          <p className='font-bold text-slate-900 leading-tight'>
                            {student.name}
                          </p>
                          <p className='text-[11px] text-slate-500 mt-0.5'>
                            {student.birthPlace && student.birthDate
                              ? `${student.birthPlace}, ${new Date(student.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                              : student.religion || '-'}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className='font-mono text-xs'>
                      <div className='font-semibold text-slate-900'>
                        {student.nis}
                      </div>
                      {student.nisn && (
                        <div className='text-[10px] text-slate-500'>
                          NISN: {student.nisn}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className='font-semibold text-slate-800'>
                      {student.className}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          student.gender === 'L'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(
                          student.status,
                        )}`}
                      >
                        {student.status || 'Aktif'}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center justify-center gap-1.5'>
                        <Button
                          onClick={() => setDetailStudent(student)}
                          variant='ghost'
                          size='icon'
                          title='Lihat Detail Biodata'
                          className='h-8 w-8 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg'
                        >
                          <Eye className='h-4 w-4' />
                        </Button>
                        <Link href={`/siswa/${student._id}/edit`}>
                          <Button
                            variant='ghost'
                            size='icon'
                            title='Edit Biodata Lengkap'
                            className='h-8 w-8 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg'
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </Link>
                        <Button
                          onClick={() => {
                            setSelectedStudent(student);
                            setDeleteOpen(true);
                          }}
                          variant='ghost'
                          size='icon'
                          title='Hapus Siswa'
                          className='h-8 w-8 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className='text-center py-12 sm:py-16 px-4 text-slate-400'
                  >
                    <div className='max-w-md mx-auto flex flex-col items-center justify-center'>
                      <Users className='h-10 w-10 sm:h-12 sm:w-12 text-slate-300 mx-auto mb-2 shrink-0' />
                      <p className='text-sm sm:text-base font-extrabold text-slate-800 tracking-tight'>
                        Belum ada data siswa.
                      </p>
                      <p className='text-xs sm:text-sm text-slate-500 mt-1 font-medium leading-relaxed'>
                        Klik tombol "Input Biodata Lengkap" untuk menambah registrasi siswa baru.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* DETAIL BIODATA MODAL */}
      <Dialog
        open={!!detailStudent}
        onOpenChange={() => setDetailStudent(null)}
      >
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl w-[calc(100vw-1.5rem)] max-w-3xl max-h-[88vh] p-0 shadow-2xl overflow-hidden flex flex-col'>
          <DialogHeader className='p-5 border-b border-slate-200 shrink-0 bg-slate-50/50 flex flex-row items-center justify-between'>
            <div>
              <DialogTitle className='text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2'>
                <User className='h-5 w-5 text-emerald-600' />
                <span>Detail Biodata Siswa</span>
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-500 mt-0.5'>
                Dokumen rekapitulasi data kependudukan dan registrasi siswa.
              </DialogDescription>
            </div>
            {detailStudent && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                  detailStudent.status,
                )}`}
              >
                {detailStudent.status || 'Aktif'}
              </span>
            )}
          </DialogHeader>

          {detailStudent && (
            <div className='flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800'>
              {/* Header Card Profile Summary */}
              <div className='bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4'>
                <div className='w-24 h-24 rounded-full overflow-hidden bg-white border-2 border-emerald-300 flex items-center justify-center shrink-0 shadow-sm'>
                  {detailStudent.photo ? (
                    <img
                      src={detailStudent.photo}
                      alt={detailStudent.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <User className='h-12 w-12 text-slate-300' />
                  )}
                </div>

                <div className='flex-1 space-y-1 text-center sm:text-left'>
                  <h3 className='text-lg font-extrabold text-slate-900'>
                    {detailStudent.name}
                  </h3>
                  <div className='flex flex-wrap items-center justify-center sm:justify-start gap-2 text-slate-600 text-xs font-medium'>
                    <span>
                      NIS: <strong>{detailStudent.nis}</strong>
                    </span>
                    {detailStudent.nisn && (
                      <span>
                        &bull; NISN: <strong>{detailStudent.nisn}</strong>
                      </span>
                    )}
                    <span>
                      &bull; Kelas: <strong>{detailStudent.className}</strong>
                    </span>
                  </div>
                  <div className='pt-1'>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        detailStudent.gender === 'L'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {detailStudent.gender === 'L'
                        ? 'Laki-laki (L)'
                        : 'Perempuan (P)'}
                    </span>
                  </div>
                </div>

                <Link href={`/siswa/${detailStudent._id}/edit`}>
                  <Button
                    size='sm'
                    className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs px-4 py-2 gap-1.5'
                  >
                    <Pencil className='h-3.5 w-3.5' />
                    <span>Edit Biodata</span>
                  </Button>
                </Link>
              </div>

              {/* SECTION 1: IDENTITAS & PRIBADI */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1.5 flex items-center gap-2'>
                  <User className='h-4 w-4 text-emerald-600' />
                  <span>1. Identitas & Biodata Pribadi</span>
                </h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80'>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Tempat, Tanggal Lahir
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.birthPlace || '-'}
                      {detailStudent.birthDate
                        ? `, ${new Date(
                            detailStudent.birthDate,
                          ).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}`
                        : ''}
                    </span>
                  </div>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Agama
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.religion || '-'}
                    </span>
                  </div>
                  <div className='sm:col-span-2 pt-1'>
                    <span className='text-slate-500 font-medium block'>
                      Alamat Lengkap
                    </span>
                    <span className='font-semibold text-slate-900 whitespace-pre-line leading-relaxed'>
                      {detailStudent.address || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: DATA ORANG TUA / WALI */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1.5 flex items-center gap-2'>
                  <HeartHandshake className='h-4 w-4 text-emerald-600' />
                  <span>2. Data Orang Tua / Wali</span>
                </h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80'>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Nama Ayah Kandung
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.fatherName || '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Pekerjaan Ayah
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.fatherJob || '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Nama Ibu Kandung
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.motherName || '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Pekerjaan Ibu
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.motherJob || '-'}
                    </span>
                  </div>
                  {detailStudent.guardianName && (
                    <>
                      <div>
                        <span className='text-slate-500 font-medium block'>
                          Nama Wali
                        </span>
                        <span className='font-bold text-slate-900'>
                          {detailStudent.guardianName}
                        </span>
                      </div>
                      <div>
                        <span className='text-slate-500 font-medium block'>
                          Pekerjaan Wali
                        </span>
                        <span className='font-bold text-slate-900'>
                          {detailStudent.guardianJob || '-'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* SECTION 3: RIWAYAT MASUK */}
              <div className='space-y-3'>
                <h4 className='font-bold text-xs uppercase tracking-wider text-emerald-800 border-b border-slate-200 pb-1.5 flex items-center gap-2'>
                  <GraduationCap className='h-4 w-4 text-emerald-600' />
                  <span>3. Riwayat Pendaftaran & Sekolah Asal</span>
                </h4>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/80'>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Tanggal Masuk Sekolah
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.entryDate
                        ? new Date(detailStudent.entryDate).toLocaleDateString(
                            'id-ID',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            },
                          )
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Diterima di Tingkat Kelas
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.entryClass || '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Tahun Ajaran Pendaftaran
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.entryAcademicYear || '-'}
                    </span>
                  </div>
                  <div>
                    <span className='text-slate-500 font-medium block'>
                      Nama Sekolah Asal
                    </span>
                    <span className='font-bold text-slate-900'>
                      {detailStudent.previousSchool || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className='p-4 border-t border-slate-200 bg-slate-50 shrink-0'>
            <Button
              onClick={() => setDetailStudent(null)}
              variant='outline'
              className='border-slate-200 bg-white text-slate-700 text-xs font-semibold rounded-xl'
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md p-6 shadow-2xl'>
          <DialogHeader className='space-y-2 text-left'>
            <div className='h-12 w-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-1'>
              <AlertTriangle className='h-6 w-6' />
            </div>
            <DialogTitle className='text-lg font-bold text-slate-900'>
              Hapus Data Siswa?
            </DialogTitle>
            <DialogDescription className='text-xs text-slate-500 leading-relaxed'>
              Apakah Anda yakin ingin menghapus data siswa{' '}
              <strong>{selectedStudent?.name}</strong>? Seluruh data presensi,
              nilai, dan tabungan terkait siswa ini akan ikut terhapus.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className='pt-4 gap-2 flex flex-row justify-end'>
            <Button
              onClick={() => setDeleteOpen(false)}
              variant='outline'
              className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl'
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteSubmit}
              disabled={isPending}
              className='bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl px-4 gap-2 cursor-pointer shadow-xs'
            >
              {isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>Menghapus...</span>
                </>
              ) : (
                <span>Ya, Hapus Data</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
