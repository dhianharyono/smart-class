'use client';

import React, { useState } from 'react';
import {
  updateTeacher,
  deleteTeacher,
  createTeacher,
} from '@/actions/adminActions';
import { toast } from 'sonner';
import {
  Search,
  Edit2,
  Trash2,
  GraduationCap,
  School,
  X,
  AlertTriangle,
  Loader2,
  Calendar,
  Plus,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Teacher {
  _id: string;
  name: string;
  email: string;
  schoolName?: string;
  className?: string;
  role?: 'Wali Kelas' | 'Kepala Sekolah';
  createdAt: string;
}

interface ManageTeachersClientProps {
  initialTeachers: Teacher[];
  schools: Array<{ _id: string; name: string }>;
}

export default function ManageTeachersClient({
  initialTeachers,
  schools,
}: ManageTeachersClientProps) {
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('');

  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Edit Form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editRole, setEditRole] = useState<'Wali Kelas' | 'Kepala Sekolah'>(
    'Wali Kelas',
  );

  // Create Form states
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSchool, setNewSchool] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newRole, setNewRole] = useState<'Wali Kelas' | 'Kepala Sekolah'>(
    'Wali Kelas',
  );
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // Search & School Filter
  const filteredTeachers = teachers.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      (t.schoolName || '').toLowerCase().includes(query) ||
      (t.className || '').toLowerCase().includes(query);

    const matchesSchool =
      !selectedSchoolFilter || t.schoolName === selectedSchoolFilter;

    return matchesSearch && matchesSchool;
  });

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditName(teacher.name);
    setEditEmail(teacher.email);
    setEditSchool(teacher.schoolName || '');
    setEditClass(teacher.className || '');
    setEditRole(teacher.role || 'Wali Kelas');
    setIsEditOpen(true);
  };

  const openDeleteModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  const openCreateModal = () => {
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewSchool(schools.length > 0 ? schools[0].name : '');
    setNewClass('');
    setNewRole('Wali Kelas');
    setShowNewPassword(false);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newSchool || !newClass) {
      toast.error('Nama, Email, Sekolah, dan Kelas wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await createTeacher({
        name: newName,
        email: newEmail,
        password: newPassword || undefined,
        schoolName: newSchool,
        className: newClass,
        role: newRole,
      });

      if (res.success && res.teacher) {
        toast.success(`Guru/Wali kelas "${newName}" berhasil ditambahkan.`);
        setTeachers((prev) => [res.teacher as Teacher, ...prev]);
        setIsCreateOpen(false);
      } else {
        toast.error(res.error || 'Gagal menambahkan wali kelas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    if (!editName || !editEmail || !editSchool) {
      toast.error('Nama, Email, dan Sekolah wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateTeacher(selectedTeacher._id, {
        name: editName,
        email: editEmail,
        schoolName: editSchool,
        className: editClass,
        role: editRole,
      });

      if (res.success) {
        toast.success('Data guru berhasil diubah.');
        setTeachers((prev) =>
          prev.map((t) =>
            t._id === selectedTeacher._id
              ? {
                  ...t,
                  name: editName,
                  email: editEmail,
                  schoolName: editSchool,
                  className: editClass,
                  role: editRole,
                }
              : t,
          ),
        );
        setIsEditOpen(false);
      } else {
        toast.error(res.error || 'Gagal mengubah data guru.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    try {
      const res = await deleteTeacher(selectedTeacher._id);
      if (res.success) {
        toast.success(
          `Akun ${selectedTeacher.name} dan seluruh data kelas berhasil dihapus.`,
        );
        setTeachers((prev) =>
          prev.filter((t) => t._id !== selectedTeacher._id),
        );
        setIsDeleteOpen(false);
      } else {
        toast.error(res.error || 'Gagal menghapus data.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h2 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent'>
            Kelola Wali Kelas
          </h2>
          <p className='text-zinc-400 text-sm mt-1'>
            Daftar, tambah, edit profil kelas/sekolah, dan hapus akun guru
            beserta data mereka di database.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className='bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer text-xs font-semibold py-2.5 px-4 flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-200'
        >
          <Plus className='h-4 w-4' />
          <span>Tambah Wali Kelas</span>
        </Button>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className='flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/20 p-4 border border-zinc-900 rounded-2xl backdrop-blur-sm shadow-md w-full'>
        <div className='flex flex-col sm:flex-row gap-3 w-full md:w-auto'>
          {/* Search Input */}
          <div className='relative w-full sm:w-64'>
            <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500'>
              <Search className='h-4.5 w-4.5' />
            </div>
            <input
              type='text'
              placeholder='Cari guru, email, kelas...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl text-sm transition-all duration-200'
            />
          </div>

          {/* School Dropdown Filter */}
          <div className='relative w-full sm:w-64'>
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className='w-full px-3 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl text-sm transition-all duration-200 cursor-pointer'
            >
              <option value='' className='bg-zinc-900 text-zinc-300'>
                Semua Sekolah
              </option>
              {schools.map((s) => (
                <option
                  key={s._id}
                  value={s.name}
                  className='bg-zinc-900 text-zinc-300'
                >
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='text-xs text-zinc-500 font-medium'>
          Menampilkan {filteredTeachers.length} dari {teachers.length} Guru
        </div>
      </div>

      {/* Grid / Table */}
      <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl'>
        <CardContent className='p-0'>
          {filteredTeachers.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm text-zinc-300 border-collapse'>
                <thead>
                  <tr className='border-b border-zinc-800 text-zinc-400 text-xs font-semibold uppercase tracking-wider'>
                    <th className='py-3.5 px-6'>Nama Guru / Email</th>
                    <th className='py-3.5 px-6'>Sekolah</th>
                    <th className='py-3.5 px-6'>Kelas</th>
                    <th className='py-3.5 px-6'>Tanggal Terdaftar</th>
                    <th className='py-3.5 px-6 text-center'>Aksi</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-zinc-900'>
                  {filteredTeachers.map((teacher) => (
                    <tr
                      key={teacher._id}
                      className='hover:bg-zinc-900/10 transition-colors group'
                    >
                      <td className='py-4 px-6'>
                        <div className='flex flex-col'>
                          <span className='font-semibold text-zinc-200 group-hover:text-white transition-colors'>
                            {teacher.name}
                          </span>
                          <div className='flex items-center gap-2 mt-0.5'>
                            <span className='text-xs text-zinc-500'>
                              {teacher.email}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 border text-[9px] font-semibold rounded-md uppercase tracking-wider ${
                                teacher.role === 'Kepala Sekolah'
                                  ? 'bg-violet-950/40 text-violet-400 border-violet-900/30'
                                  : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30'
                              }`}
                            >
                              {teacher.role || 'Wali Kelas'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className='py-4 px-6 text-zinc-300'>
                        <div className='flex items-center gap-2'>
                          <School className='h-4 w-4 text-zinc-500' />
                          <span>{teacher.schoolName || '-'}</span>
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <span className='bg-zinc-850 border border-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-lg text-xs font-semibold'>
                          {teacher.className || '-'}
                        </span>
                      </td>
                      <td className='py-4 px-6 text-zinc-500 text-xs'>
                        <div className='flex items-center gap-1.5'>
                          <Calendar className='h-3.5 w-3.5' />
                          <span>
                            {new Date(teacher.createdAt).toLocaleDateString(
                              'id-ID',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              },
                            )}
                          </span>
                        </div>
                      </td>
                      <td className='py-4 px-6 text-center'>
                        <div className='flex justify-center items-center gap-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => openEditModal(teacher)}
                            className='h-8 w-8 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-950/20 border border-transparent hover:border-indigo-950/30 rounded-xl cursor-pointer'
                          >
                            <Edit2 className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => openDeleteModal(teacher)}
                            className='h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-950/30 rounded-xl cursor-pointer'
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-16 text-zinc-600 text-xs gap-1'>
              <GraduationCap className='h-8 w-8 text-zinc-700' />
              <span>Tidak ada data guru yang cocok.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal Custom Overlay */}
      {isEditOpen && selectedTeacher && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200'>
            <button
              onClick={() => setIsEditOpen(false)}
              className='absolute top-4 right-4 text-zinc-500 hover:text-zinc-300'
            >
              <X className='h-5 w-5' />
            </button>
            <h3 className='text-lg font-bold text-white mb-4'>
              Edit Profil Wali Kelas
            </h3>
            <form onSubmit={handleEditSubmit} className='space-y-4'>
              <div className='space-y-1'>
                <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                  Nama Lengkap
                </label>
                <input
                  type='text'
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  disabled={loading}
                  className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 disabled:opacity-50'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                  Email
                </label>
                <input
                  type='email'
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  disabled={loading}
                  className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 disabled:opacity-50'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                  Peran (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  required
                  disabled={loading}
                  className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 disabled:opacity-50 cursor-pointer'
                >
                  <option
                    value='Wali Kelas'
                    className='bg-zinc-900 text-zinc-300'
                  >
                    Wali Kelas
                  </option>
                  <option
                    value='Kepala Sekolah'
                    className='bg-zinc-900 text-zinc-300'
                  >
                    Kepala Sekolah
                  </option>
                </select>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                    Sekolah
                  </label>
                  <select
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    required
                    disabled={loading}
                    className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 disabled:opacity-50 cursor-pointer'
                  >
                    <option value='' disabled>
                      Pilih Sekolah
                    </option>
                    {schools.map((s) => (
                      <option
                        key={s._id}
                        value={s.name}
                        className='bg-zinc-900'
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='space-y-1'>
                  <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                    Kelas Diajar
                  </label>
                  <input
                    type='text'
                    value={editClass}
                    onChange={(e) => setEditClass(e.target.value)}
                    disabled={loading}
                    className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 disabled:opacity-50'
                  />
                </div>
              </div>

              <div className='pt-2 flex justify-end gap-3'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => setIsEditOpen(false)}
                  disabled={loading}
                  className='rounded-xl border border-transparent hover:bg-zinc-800 cursor-pointer text-xs'
                >
                  Batal
                </Button>
                <Button
                  type='submit'
                  disabled={loading}
                  className='bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer text-xs flex items-center gap-1.5'
                >
                  {loading ? (
                    <>
                      <Loader2 className='h-3 w-3 animate-spin' />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>Simpan Perubahan</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal Custom Overlay */}
      {isDeleteOpen && selectedTeacher && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200'>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className='absolute top-4 right-4 text-zinc-500 hover:text-zinc-300'
            >
              <X className='h-5 w-5' />
            </button>

            <div className='flex items-center gap-3 text-rose-500 mb-4'>
              <div className='p-2 rounded-xl bg-rose-500/10 border border-rose-500/20'>
                <AlertTriangle className='h-5 w-5' />
              </div>
              <h3 className='text-lg font-bold text-white'>Hapus Akun Guru?</h3>
            </div>

            <div className='space-y-3 mb-6'>
              <p className='text-sm text-zinc-300'>
                Apakah Anda yakin ingin menghapus akun guru{' '}
                <strong className='text-white'>{selectedTeacher.name}</strong>?
              </p>
              <div className='p-3 bg-rose-950/20 border border-rose-950/40 rounded-xl text-xs text-rose-300 space-y-1'>
                <p className='font-semibold text-rose-200'>
                  ⚠️ PENTING: Tindakan ini bersifat permanen!
                </p>
                <p>
                  Menghapus akun ini juga akan menghapus secara bersih data
                  berikut dari database:
                </p>
                <ul className='list-disc list-inside mt-1 space-y-0.5 text-zinc-400'>
                  <li>Semua data Siswa di kelas tersebut</li>
                  <li>Semua histori Absensi Kelas</li>
                  <li>Semua rekam Nilai Akademik</li>
                  <li>Semua riwayat Jurnal Siswa</li>
                </ul>
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsDeleteOpen(false)}
                disabled={loading}
                className='rounded-xl border border-transparent hover:bg-zinc-800 cursor-pointer text-xs'
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className='bg-rose-600 hover:bg-rose-500 text-white rounded-xl cursor-pointer text-xs flex items-center gap-1.5'
              >
                {loading ? (
                  <>
                    <Loader2 className='h-3 w-3 animate-spin' />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus Permanen</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Create Modal Custom Overlay */}
      {isCreateOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4'>
          <div className='bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200'>
            <button
              onClick={() => setIsCreateOpen(false)}
              className='absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 cursor-pointer'
            >
              <X className='h-5 w-5' />
            </button>
            <h3 className='text-lg font-bold text-white mb-4 bg-gradient-to-r from-indigo-200 to-violet-200 bg-clip-text text-transparent'>
              Tambah Wali Kelas Baru
            </h3>

            {schools.length === 0 ? (
              <div className='text-center py-6 text-zinc-400 text-sm space-y-3'>
                <p>⚠️ Tidak ada sekolah terdaftar di sistem.</p>
                <p className='text-xs'>
                  Harap tambahkan sekolah terlebih dahulu di halaman Kelola
                  Sekolah sebelum membuat wali kelas.
                </p>
                <Button
                  onClick={() => setIsCreateOpen(false)}
                  className='bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs py-2 px-4 cursor-pointer'
                >
                  Tutup
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className='space-y-4'>
                <div className='space-y-1'>
                  <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                    Nama Lengkap
                  </label>
                  <input
                    type='text'
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder='Nama Lengkap & Gelar'
                    disabled={loading}
                    className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-750 disabled:opacity-50'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                    Email / Username
                  </label>
                  <input
                    type='text'
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder='Email atau Username wali kelas'
                    disabled={loading}
                    className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-750 disabled:opacity-50'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                    Peran (Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    required
                    disabled={loading}
                    className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 disabled:opacity-50 cursor-pointer'
                  >
                    <option
                      value='Wali Kelas'
                      className='bg-zinc-900 text-zinc-300'
                    >
                      Wali Kelas
                    </option>
                    <option
                      value='Kepala Sekolah'
                      className='bg-zinc-900 text-zinc-300'
                    >
                      Kepala Sekolah
                    </option>
                  </select>
                </div>

                <div className='space-y-1'>
                  <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                    Kata Sandi
                  </label>
                  <div className='relative'>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder='Kosongkan untuk default: Gurusmart123!'
                      disabled={loading}
                      className='w-full pl-3 pr-10 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-750 disabled:opacity-50'
                    />
                    <button
                      type='button'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 focus:outline-none cursor-pointer'
                    >
                      {showNewPassword ? (
                        <EyeOff className='h-4 w-4' />
                      ) : (
                        <Eye className='h-4 w-4' />
                      )}
                    </button>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                      Sekolah
                    </label>
                    <select
                      value={newSchool}
                      onChange={(e) => setNewSchool(e.target.value)}
                      required
                      disabled={loading}
                      className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 disabled:opacity-50 cursor-pointer'
                    >
                      {schools.map((s) => (
                        <option
                          key={s._id}
                          value={s.name}
                          className='bg-zinc-900'
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-1'>
                    <label className='text-[10px] font-semibold text-zinc-500 tracking-wider uppercase'>
                      Kelas Diajar
                    </label>
                    <input
                      type='text'
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      required
                      placeholder='Contoh: Kelas 5B'
                      disabled={loading}
                      className='w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-750 disabled:opacity-50'
                    />
                  </div>
                </div>

                <div className='pt-2 flex justify-end gap-3'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setIsCreateOpen(false)}
                    disabled={loading}
                    className='rounded-xl border border-transparent hover:bg-zinc-800 cursor-pointer text-xs'
                  >
                    Batal
                  </Button>
                  <Button
                    type='submit'
                    disabled={loading}
                    className='bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl cursor-pointer text-xs flex items-center gap-1.5'
                  >
                    {loading ? (
                      <>
                        <Loader2 className='h-3 w-3 animate-spin' />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Tambahkan Guru</span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
