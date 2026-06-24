'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Edit2,
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
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent'>
            Data Master Siswa
          </h2>
          <p className='text-zinc-400 text-sm'>
            Kelola profil lengkap seluruh siswa di kelas bimbingan Anda.
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
            onClick={() => {
              setFormData({ nis: '', name: '', className: '', gender: 'L' });
              setAddOpen(true);
            }}
            className='bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl h-10 px-4 gap-2'
          >
            <Plus className='h-4 w-4' />
            Tambah Siswa
          </Button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className='flex items-center gap-3 bg-zinc-900/30 border border-zinc-900/80 rounded-2xl p-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500' />
          <Input
            placeholder='Cari siswa berdasarkan nama atau NIS...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-10 bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl h-10'
          />
        </div>
      </div>

      {/* Main Table */}
      <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl overflow-hidden shadow-xl'>
        <CardContent className='p-0'>
          <Table>
            <TableHeader className='bg-zinc-900/50 border-b border-zinc-800'>
              <TableRow className='border-b border-zinc-800 hover:bg-transparent'>
                <TableHead className='w-12 text-center text-zinc-400 font-bold'>
                  No
                </TableHead>
                <TableHead className='text-zinc-400 font-bold'>NIS</TableHead>
                <TableHead className='text-zinc-400 font-bold'>
                  Nama Lengkap
                </TableHead>
                <TableHead className='text-zinc-400 font-bold'>Kelas</TableHead>
                <TableHead className='text-zinc-400 font-bold'>L/P</TableHead>
                <TableHead className='w-32 text-center text-zinc-400 font-bold'>
                  Aksi
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <TableRow
                    key={student._id}
                    className='border-b border-zinc-900 hover:bg-zinc-900/20 text-zinc-300'
                  >
                    <TableCell className='text-center font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono'>{student.nis}</TableCell>
                    <TableCell className='font-semibold text-zinc-200'>
                      {student.name}
                    </TableCell>
                    <TableCell>{student.className}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          student.gender === 'L'
                            ? 'bg-blue-950/40 text-blue-400 border border-blue-900/40'
                            : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
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
                          className='h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-950/30 rounded-lg'
                        >
                          <Edit2 className='h-4 w-4' />
                        </Button>
                        <Button
                          onClick={() => openDeleteDialog(student)}
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg'
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
                    colSpan={6}
                    className='h-32 text-center text-zinc-500'
                  >
                    <div className='flex flex-col items-center justify-center'>
                      <Users className='h-8 w-8 text-zinc-700 mb-2' />
                      <p className='text-sm font-medium'>
                        Tidak ada data siswa ditemukan.
                      </p>
                      <p className='text-xs text-zinc-600'>
                        Klik "Tambah Siswa" untuk memulai.
                      </p>
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
        <DialogContent className='bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-md'>
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold text-zinc-100'>
                Tambah Siswa Baru
              </DialogTitle>
              <DialogDescription className='text-xs text-zinc-400'>
                Input biodata siswa secara lengkap untuk melengkapi database
                kelas.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='nis'
                  className='text-zinc-300 text-sm font-semibold'
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
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='name'
                  className='text-zinc-300 text-sm font-semibold'
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
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='className'
                  className='text-zinc-300 text-sm font-semibold'
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
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-zinc-300 text-sm font-semibold'>
                  Jenis Kelamin
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) =>
                    val &&
                    setFormData({ ...formData, gender: val as 'L' | 'P' })
                  }
                >
                  <SelectTrigger className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'>
                    <SelectValue placeholder='Pilih jenis kelamin' />
                  </SelectTrigger>
                  <SelectContent className='bg-zinc-900 border-zinc-800 text-white rounded-xl'>
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
                className='text-zinc-400 hover:text-zinc-200'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-4 gap-2'
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
        <DialogContent className='bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-md'>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold text-zinc-100'>
                Ubah Data Siswa
              </DialogTitle>
              <DialogDescription className='text-xs text-zinc-400'>
                Perbarui rincian biodata untuk siswa yang dipilih.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='edit-nis'
                  className='text-zinc-300 text-sm font-semibold'
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
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='edit-name'
                  className='text-zinc-300 text-sm font-semibold'
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
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='edit-className'
                  className='text-zinc-300 text-sm font-semibold'
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
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'
                />
              </div>
              <div className='space-y-1.5'>
                <Label className='text-zinc-300 text-sm font-semibold'>
                  Jenis Kelamin
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(val) =>
                    val &&
                    setFormData({ ...formData, gender: val as 'L' | 'P' })
                  }
                >
                  <SelectTrigger className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'>
                    <SelectValue placeholder='Pilih jenis kelamin' />
                  </SelectTrigger>
                  <SelectContent className='bg-zinc-900 border-zinc-800 text-white rounded-xl'>
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
                className='text-zinc-400 hover:text-zinc-200'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-4 gap-2'
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
        <DialogContent className='bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-sm'>
          <DialogHeader>
            <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-950 border border-red-900 text-red-500 mb-4'>
              <AlertTriangle className='h-6 w-6' />
            </div>
            <DialogTitle className='text-center text-lg font-bold text-zinc-100'>
              Konfirmasi Hapus Siswa
            </DialogTitle>
            <DialogDescription className='text-center text-xs text-zinc-400'>
              Apakah Anda yakin ingin menghapus{' '}
              <strong>{selectedStudent?.name}</strong>? Tindakan ini akan
              menghapus permanen semua data kehadiran, nilai, dan jurnal terkait
              siswa ini!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4 gap-2 sm:gap-0 flex justify-center w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setDeleteOpen(false)}
              className='text-zinc-400 hover:text-zinc-200 flex-1'
            >
              Batal
            </Button>
            <Button
              type='button'
              disabled={isPending}
              onClick={handleDeleteSubmit}
              className='bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl flex-1 gap-2'
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
