'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit2,
  Pencil,
  Trash2,
  Download,
  AlertTriangle,
  Loader2,
  Users,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  createStudent,
  updateStudent,
  deleteStudent,
} from '@/actions/studentActions';
import { exportStudentsToExcel } from '@/lib/excelExport';

interface StudentData {
  _id: string;
  nis: string;
  name: string;
  className: string;
  gender: 'L' | 'P';
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
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form Field States
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
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.nis.includes(search),
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    if (!formData.nis || !formData.name || !formData.className) {
      toast.error('Semua data wajib diisi!');
      return;
    }

    startTransition(async () => {
      try {
        await updateStudent(selectedStudent._id, formData);
        toast.success(`Berhasil memperbarui data siswa`);
        setEditOpen(false);
        setSelectedStudent(null);
        router.refresh();
      } catch (err: any) {
        toast.error(err.message || 'Gagal memperbarui data.');
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

  const openEditDialog = (student: StudentData) => {
    setSelectedStudent(student);
    setFormData({
      nis: student.nis,
      name: student.name,
      className: student.className,
      gender: student.gender,
    });
    setEditOpen(true);
  };

  const openDeleteDialog = (student: StudentData) => {
    setSelectedStudent(student);
    setDeleteOpen(true);
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

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900'>
            Data Siswa
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Kelola profil lengkap seluruh siswa di kelas bimbingan Anda.
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
            onClick={() => {
              setFormData({ nis: '', name: '', className: '', gender: 'L' });
              setAddOpen(true);
            }}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl h-10 px-3.5 sm:px-4 gap-2 shadow-xs'
          >
            <Plus className='h-4 w-4' />
            Tambah Siswa
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className='flex items-center gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
          <Input
            placeholder='Cari siswa berdasarkan nama atau NIS...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl h-10'
          />
        </div>
      </div>

      {/* Main Table */}
      <Card className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs'>
        <CardContent className='p-0'>
          <Table>
            <TableHeader className='bg-slate-50/80 border-b border-slate-200'>
              <TableRow className='border-b border-slate-200 hover:bg-transparent'>
                <TableHead className='w-12 text-center text-slate-700 font-bold'>
                  No
                </TableHead>
                <TableHead className='text-slate-700 font-bold'>NIS</TableHead>
                <TableHead className='text-slate-700 font-bold'>
                  Nama Lengkap
                </TableHead>
                <TableHead className='text-slate-700 font-bold'>Kelas</TableHead>
                <TableHead className='text-slate-700 font-bold'>L/P</TableHead>
                <TableHead className='w-32 text-center text-slate-700 font-bold'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <TableRow
                    key={student._id}
                    className='border-b border-slate-100 hover:bg-slate-50/80 text-slate-700 transition-colors'
                  >
                    <TableCell className='text-center font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono font-medium'>{student.nis}</TableCell>
                    <TableCell className='font-bold text-slate-900'>
                      {student.name}
                    </TableCell>
                    <TableCell className='font-medium'>{student.className}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${student.gender === 'L'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                      >
                        {student.gender}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-center gap-2'>
                        <Button
                          onClick={() => openEditDialog(student)}
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg'
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          onClick={() => openDeleteDialog(student)}
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className='text-center py-12 text-slate-400'>
                    <div className='flex flex-col items-center justify-center gap-2'>
                      <Users className='h-8 w-8 text-slate-300' />
                      <p className='text-sm font-medium'>Tidak ada data siswa ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md w-[calc(100%-2.5rem)] sm:w-full p-5 sm:p-6 shadow-2xl'>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold text-slate-900'>
                Tambah Siswa Baru
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-500'>
                Input biodata siswa secara lengkap untuk melengkapi database
                kelas.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='nis'
                  className='text-slate-700 text-sm font-semibold'
                >
                  NIS (Nomor Induk Siswa)
                </Label>
                <Input
                  id='nis'
                  required
                  placeholder='Contoh: 2122101'
                  value={formData.nis}
                  onChange={(e) =>
                    setFormData({ ...formData, nis: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='name'
                  className='text-slate-700 text-sm font-semibold'
                >
                  Nama Lengkap
                </Label>
                <Input
                  id='name'
                  required
                  placeholder='Contoh: Ahmad Maulana'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='className'
                  className='text-slate-700 text-sm font-semibold'
                >
                  Kelas
                </Label>
                <Input
                  id='className'
                  required
                  placeholder='Contoh: X MIPA 1'
                  value={formData.className}
                  onChange={(e) =>
                    setFormData({ ...formData, className: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-slate-700 text-sm font-semibold'>
                  Jenis Kelamin
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) =>
                    val &&
                    setFormData({ ...formData, gender: val as 'L' | 'P' })
                  }
                >
                  <SelectTrigger className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'>
                    <SelectValue placeholder='Pilih jenis kelamin' />
                  </SelectTrigger>
                  <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                    <SelectItem value='L'>Laki-laki (L)</SelectItem>
                    <SelectItem value='P'>Perempuan (P)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setAddOpen(false)}
                className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 gap-2 shadow-xs'
              >
                {isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-md w-[calc(100%-2.5rem)] sm:w-full p-5 sm:p-6 shadow-2xl'>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold text-slate-900'>
                Ubah Data Siswa
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-500'>
                Perbarui rincian biodata untuk siswa yang dipilih.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='edit-nis'
                  className='text-slate-700 text-sm font-semibold'
                >
                  NIS (Nomor Induk Siswa)
                </Label>
                <Input
                  id='edit-nis'
                  required
                  placeholder='Contoh: 2122101'
                  value={formData.nis}
                  onChange={(e) =>
                    setFormData({ ...formData, nis: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='edit-name'
                  className='text-slate-700 text-sm font-semibold'
                >
                  Nama Lengkap
                </Label>
                <Input
                  id='edit-name'
                  required
                  placeholder='Contoh: Ahmad Maulana'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='edit-className'
                  className='text-slate-700 text-sm font-semibold'
                >
                  Kelas
                </Label>
                <Input
                  id='edit-className'
                  required
                  placeholder='Contoh: X MIPA 1'
                  value={formData.className}
                  onChange={(e) =>
                    setFormData({ ...formData, className: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-slate-700 text-sm font-semibold'>
                  Jenis Kelamin
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) =>
                    val &&
                    setFormData({ ...formData, gender: val as 'L' | 'P' })
                  }
                >
                  <SelectTrigger className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'>
                    <SelectValue placeholder='Pilih jenis kelamin' />
                  </SelectTrigger>
                  <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                    <SelectItem value='L'>Laki-laki (L)</SelectItem>
                    <SelectItem value='P'>Perempuan (P)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setEditOpen(false)}
                className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 gap-2 shadow-xs'
              >
                {isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm w-[calc(100%-2.5rem)] sm:w-full p-5 sm:p-6 shadow-2xl'>
          <DialogHeader>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 border border-rose-200 text-rose-600 mb-4'>
              <AlertTriangle className='h-6 w-6' />
            </div>
            <DialogTitle className='text-center text-lg font-bold text-slate-900'>
              Konfirmasi Hapus Siswa
            </DialogTitle>
            <DialogDescription className='text-center text-xs text-slate-500'>
              Apakah Anda yakin ingin menghapus{' '}
              <strong>{selectedStudent?.name}</strong>? Tindakan ini akan
              menghapus permanen semua data kehadiran, nilai, dan tabungan terkait
              siswa ini!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4 gap-2 sm:gap-0 flex justify-center w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setDeleteOpen(false)}
              className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 flex-1'
            >
              Batal
            </Button>
            <Button
              type='button'
              disabled={isPending}
              onClick={handleDeleteSubmit}
              className='bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl flex-1 gap-2 shadow-xs'
            >
              {isPending ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Ya, Hapus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
