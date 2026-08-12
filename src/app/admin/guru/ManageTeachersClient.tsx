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
  AlertCircle,
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
  classes?: string[];
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
    const teacherClasses = Array.isArray(t.classes) && t.classes.length > 0 ? t.classes : (t.className ? [t.className] : []);
    const matchesClass = teacherClasses.some((c) => c.toLowerCase().includes(query));
    const matchesSearch =
      t.name.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      (t.schoolName || '').toLowerCase().includes(query) ||
      matchesClass;

    const matchesSchool =
      !selectedSchoolFilter || t.schoolName === selectedSchoolFilter;

    return matchesSearch && matchesSchool;
  });

  const openEditModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditName(teacher.name);
    setEditEmail(teacher.email);
    setEditSchool(teacher.schoolName || '');
    setEditClass(teacher.classes && teacher.classes.length > 0 ? teacher.classes.join(', ') : (teacher.className || ''));
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
        const parsedEditClasses = editClass
          ? Array.from(new Set(editClass.split(/[,/]/).map((s) => s.trim()).filter(Boolean)))
          : [];
        setTeachers((prev) =>
          prev.map((t) =>
            t._id === selectedTeacher._id
              ? {
                ...t,
                name: editName,
                email: editEmail,
                schoolName: editSchool,
                className: parsedEditClasses[0] || editClass,
                classes: parsedEditClasses.length > 0 ? parsedEditClasses : (editClass ? [editClass] : []),
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
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900'>
            Kelola Wali Kelas
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Daftar, tambah, edit profil kelas/sekolah, dan hapus akun guru
            beserta data mereka di database.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className='bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer text-xs font-semibold py-2.5 px-4 flex items-center justify-center gap-2 w-full sm:w-auto shadow-xs transition-all duration-200'
        >
          <Plus className='h-4 w-4' />
          <span>Tambah Wali Kelas</span>
        </Button>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className='flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 border border-slate-200/80 rounded-2xl shadow-xs w-full'>
        <div className='flex flex-col sm:flex-row gap-3 w-full md:w-auto'>
          {/* Search Input */}
          <div className='relative w-full sm:w-64'>
            <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
              <Search className='h-4.5 w-4.5' />
            </div>
            <input
              type='text'
              placeholder='Cari guru, email, kelas...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200'
            />
          </div>

          {/* School Dropdown Filter */}
          <div className='relative w-full sm:w-64'>
            <select
              value={selectedSchoolFilter}
              onChange={(e) => setSelectedSchoolFilter(e.target.value)}
              className='w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm transition-all duration-200 cursor-pointer font-medium'
            >
              <option value='' className='bg-white text-slate-700'>
                Semua Sekolah
              </option>
              {schools.map((s) => (
                <option
                  key={s._id}
                  value={s.name}
                  className='bg-white text-slate-700'
                >
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className='text-xs text-slate-500 font-medium'>
          Menampilkan {filteredTeachers.length} dari {teachers.length} Guru
        </div>
      </div>

      {/* Grid / Table */}
      <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs'>
        <CardContent className='p-0'>
          {filteredTeachers.length > 0 ? (
            <div className='overflow-x-auto min-w-0 max-w-full'>
              <table className='w-full min-w-[650px] text-left text-sm text-slate-700 border-collapse'>
                <thead>
                  <tr className='border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider bg-slate-50'>
                    <th className='py-3.5 px-6'>Nama Guru / Email</th>
                    <th className='py-3.5 px-6'>Sekolah</th>
                    <th className='py-3.5 px-6'>Kelas</th>
                    <th className='py-3.5 px-6'>Tanggal Terdaftar</th>
                    <th className='py-3.5 px-6 text-center'>Aksi</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {filteredTeachers.map((teacher) => (
                    <tr
                      key={teacher._id}
                      className='hover:bg-slate-50/80 transition-colors group'
                    >
                      <td className='py-4 px-6'>
                        <div className='flex flex-col'>
                          <span className='font-bold text-slate-900 group-hover:text-emerald-700 transition-colors'>
                            {teacher.name}
                          </span>
                          <div className='flex items-center gap-2 mt-0.5'>
                            <span className='text-xs text-slate-500 font-medium'>
                              {teacher.email}
                            </span>
                            <span
                              className={`px-2 py-0.5 border text-[9px] font-bold rounded-md uppercase tracking-wider ${teacher.role === 'Kepala Sekolah'
                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                            >
                              {teacher.role || 'Wali Kelas'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className='py-4 px-6 text-slate-800 font-medium'>
                        <div className='flex items-center gap-2'>
                          <School className='h-4 w-4 text-slate-400' />
                          <span>{teacher.schoolName || '-'}</span>
                        </div>
                      </td>
                      <td className='py-4 px-6'>
                        <div className='flex flex-wrap gap-1 items-center'>
                          {teacher.classes && teacher.classes.length > 0 ? (
                            teacher.classes.map((cls, idx) => (
                              <span key={idx} className='bg-emerald-50 border border-emerald-200/90 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-mono font-bold'>
                                Kelas {cls}
                              </span>
                            ))
                          ) : (
                            <span className='bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono'>
                              Kelas {teacher.className || '-'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className='py-4 px-6 text-slate-500 text-xs font-medium'>
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
                            className='h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl cursor-pointer'
                          >
                            <Edit2 className='h-3.5 w-3.5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => openDeleteModal(teacher)}
                            className='h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl cursor-pointer'
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
            <div className='flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-1 px-6'>
              <AlertCircle className='h-8 w-8 text-slate-300' />
              <span className='font-bold text-slate-700'>Tidak ada wali kelas ditemukan.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal Custom Overlay */}
      {isEditOpen && selectedTeacher && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4'>
          <div className='bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-slate-900'>
            <button
              onClick={() => setIsEditOpen(false)}
              className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer'
            >
              <X className='h-5 w-5' />
            </button>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>
              Edit Profil Wali Kelas
            </h3>
            <form onSubmit={handleEditSubmit} className='space-y-4'>
              <div className='space-y-1'>
                <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                  Nama Lengkap
                </label>
                <input
                  type='text'
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  disabled={loading}
                  className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 disabled:opacity-50'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                  Email
                </label>
                <input
                  type='email'
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                  disabled={loading}
                  className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 disabled:opacity-50'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                  Peran (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  required
                  disabled={loading}
                  className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 disabled:opacity-50 cursor-pointer font-medium'
                >
                  <option
                    value='Wali Kelas'
                    className='bg-white text-slate-900'
                  >
                    Wali Kelas
                  </option>
                  <option
                    value='Kepala Sekolah'
                    className='bg-white text-slate-900'
                  >
                    Kepala Sekolah
                  </option>
                </select>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-1'>
                  <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                    Sekolah
                  </label>
                  <select
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    required
                    disabled={loading}
                    className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 disabled:opacity-50 cursor-pointer font-medium'
                  >
                    <option value='' disabled>
                      Pilih Sekolah
                    </option>
                    {schools.map((s) => (
                      <option
                        key={s._id}
                        value={s.name}
                        className='bg-white text-slate-900'
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className='space-y-1'>
                  <div>
                    <label className='block text-xs font-semibold text-slate-700 mb-1'>
                      Nama Kelas <span className='text-slate-400'>(misal: 5A, 5B)</span> <span className='text-rose-500'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      value={editClass}
                      onChange={(e) => setEditClass(e.target.value)}
                      placeholder='Contoh: 5A, 5B'
                      className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 disabled:opacity-50'
                    />
                  </div>
                </div>
              </div>

              <div className='pt-2 flex justify-end gap-3'>
                <Button
                  type='button'
                  variant='ghost'
                  onClick={() => setIsEditOpen(false)}
                  disabled={loading}
                  className='rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-xs font-semibold'
                >
                  Batal
                </Button>
                <Button
                  type='submit'
                  disabled={loading}
                  className='bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-1.5 shadow-xs'
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4'>
          <div className='bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-slate-900'>
            <button
              onClick={() => setIsDeleteOpen(false)}
              className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer'
            >
              <X className='h-5 w-5' />
            </button>

            <div className='flex items-center gap-3 text-rose-600 mb-4'>
              <div className='p-2 rounded-xl bg-rose-50 border border-rose-200'>
                <AlertTriangle className='h-5 w-5' />
              </div>
              <h3 className='text-lg font-bold text-slate-900'>Hapus Akun Guru?</h3>
            </div>

            <div className='space-y-3 mb-6'>
              <p className='text-sm text-slate-700'>
                Apakah Anda yakin ingin menghapus akun guru{' '}
                <strong className='text-slate-900'>{selectedTeacher.name}</strong>?
              </p>
              <div className='p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1'>
                <p className='font-bold text-rose-800'>
                  ⚠️ PENTING: Tindakan ini bersifat permanen!
                </p>
                <p>
                  Menghapus akun ini juga akan menghapus secara bersih data
                  berikut dari database:
                </p>
                <ul className='list-disc list-inside mt-1 space-y-0.5 text-slate-600 font-medium'>
                  <li>Semua data Siswa di kelas tersebut</li>
                  <li>Semua histori Absensi Kelas</li>
                  <li>Semua rekam Nilai Akademik</li>
                  <li>Semua riwayat Tabungan Siswa</li>
                </ul>
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsDeleteOpen(false)}
                disabled={loading}
                className='rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-xs font-semibold'
              >
                Batal
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={loading}
                className='bg-rose-600 hover:bg-rose-700 text-white rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-1.5 shadow-xs'
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4'>
          <div className='bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-slate-900'>
            <button
              onClick={() => setIsCreateOpen(false)}
              className='absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer'
            >
              <X className='h-5 w-5' />
            </button>
            <h3 className='text-lg font-bold text-slate-900 mb-4'>
              Tambah Wali Kelas Baru
            </h3>

            {schools.length === 0 ? (
              <div className='text-center py-6 text-slate-600 text-sm space-y-3'>
                <p>⚠️ Tidak ada sekolah terdaftar di sistem.</p>
                <p className='text-xs text-slate-500'>
                  Harap tambahkan sekolah terlebih dahulu di halaman Kelola
                  Sekolah sebelum membuat wali kelas.
                </p>
                <Button
                  onClick={() => setIsCreateOpen(false)}
                  className='bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs py-2 px-4 cursor-pointer font-semibold'
                >
                  Tutup
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateSubmit} className='space-y-4'>
                <div className='space-y-1'>
                  <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type='text'
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    placeholder='Nama Lengkap & Gelar'
                    disabled={loading}
                    className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 placeholder-slate-400 disabled:opacity-50'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                    Email / Username
                  </label>
                  <input
                    type='text'
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder='Email atau Username wali kelas'
                    disabled={loading}
                    className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 placeholder-slate-400 disabled:opacity-50'
                  />
                </div>

                <div className='space-y-1'>
                  <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                    Peran (Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    required
                    disabled={loading}
                    className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 disabled:opacity-50 cursor-pointer font-medium'
                  >
                    <option
                      value='Wali Kelas'
                      className='bg-white text-slate-900'
                    >
                      Wali Kelas
                    </option>
                    <option
                      value='Kepala Sekolah'
                      className='bg-white text-slate-900'
                    >
                      Kepala Sekolah
                    </option>
                  </select>
                </div>

                <div className='space-y-1'>
                  <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                    Kata Sandi
                  </label>
                  <div className='relative'>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder='Kosongkan untuk default: Gurusmart123!'
                      disabled={loading}
                      className='w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 placeholder-slate-400 disabled:opacity-50'
                    />
                    <button
                      type='button'
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className='absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer'
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
                    <label className='text-[10px] font-bold text-slate-500 tracking-wider uppercase'>
                      Sekolah
                    </label>
                    <select
                      value={newSchool}
                      onChange={(e) => setNewSchool(e.target.value)}
                      required
                      disabled={loading}
                      className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 disabled:opacity-50 cursor-pointer font-medium'
                    >
                      {schools.map((s) => (
                        <option
                          key={s._id}
                          value={s.name}
                          className='bg-white text-slate-900'
                        >
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className='space-y-1'>
                    <label className='block text-xs font-semibold text-slate-700 mb-1'>
                      Nama Kelas <span className='text-slate-400 font-normal'>(misal: 5A, 5B)</span> <span className='text-rose-500'>*</span>
                    </label>
                    <input
                      type='text'
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                      required
                      placeholder='Contoh: 5A, 5B'
                      disabled={loading}
                      className='w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 text-slate-900 placeholder-slate-400 disabled:opacity-50'
                    />
                  </div>
                </div>

                <div className='pt-2 flex justify-end gap-3'>
                  <Button
                    type='button'
                    variant='ghost'
                    onClick={() => setIsCreateOpen(false)}
                    disabled={loading}
                    className='rounded-xl border border-slate-200 hover:bg-slate-100 cursor-pointer text-xs font-semibold'
                  >
                    Batal
                  </Button>
                  <Button
                    type='submit'
                    disabled={loading}
                    className='bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-1.5 shadow-xs'
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
