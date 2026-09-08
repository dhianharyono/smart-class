'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { addSchool, deleteSchool } from '@/actions/adminActions';
import { toast } from 'sonner';
import {
  School,
  Plus,
  Trash2,
  Loader2,
  Building,
  Users,
  Search,
  Sparkles,
  AlertCircle,
  Calendar,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import ConfirmDialog from '@/components/ConfirmDialog';

interface SchoolData {
  _id: string;
  name: string;
  teacherCount?: number;
  createdAt: string;
}

interface ManageSchoolsClientProps {
  initialSchools: SchoolData[];
}

export default function ManageSchoolsClient({
  initialSchools,
}: ManageSchoolsClientProps) {
  const [schools, setSchools] = useState<SchoolData[]>(initialSchools);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isCreateOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCreateOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCreateOpen) {
        setIsCreateOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateOpen]);

  // Confirm delete modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    schoolId: string;
    schoolName: string;
  }>({
    open: false,
    schoolId: '',
    schoolName: '',
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) {
      toast.error('Nama sekolah tidak boleh kosong.');
      return;
    }

    setLoading(true);
    try {
      const res = await addSchool(newSchoolName);
      if (res.success && res.school) {
        toast.success(`Sekolah "${newSchoolName}" berhasil ditambahkan.`);
        setSchools((prev) =>
          [...prev, res.school!].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setNewSchoolName('');
        setIsCreateOpen(false);
      } else {
        toast.error(res.error || 'Gagal menambahkan sekolah.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteConfirmModal = (id: string, name: string) => {
    setDeleteConfirm({
      open: true,
      schoolId: id,
      schoolName: name,
    });
  };

  const executeDeleteSchool = async () => {
    const { schoolId, schoolName } = deleteConfirm;
    if (!schoolId) return;

    setDeletingId(schoolId);
    try {
      const res = await deleteSchool(schoolId);
      if (res.success) {
        toast.success(`Sekolah "${schoolName}" berhasil dihapus.`);
        setSchools((prev) => prev.filter((s) => s._id !== schoolId));
        setDeleteConfirm({ open: false, schoolId: '', schoolName: '' });
      } else {
        toast.error(res.error || 'Gagal menghapus sekolah.');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered schools based on search input
  const filteredSchools = schools.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return s.name.toLowerCase().includes(query);
  });

  return (
    <div className='space-y-6 animate-fade-in pb-12'>
      {/* Header Bar */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3'>
            <span>Kelola Daftar Sekolah</span>
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl'>
            Tambahkan sekolah baru agar dapat dipilih saat registrasi wali
            kelas, atau kelola dan rapikan daftar sekolah terdaftar di database.
          </p>
        </div>
        <Button
          onClick={() => {
            setNewSchoolName('');
            setIsCreateOpen(true);
          }}
          className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center'
        >
          <Plus className='h-4 w-4' />
          <span>Tambah Sekolah</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
          <input
            type='text'
            placeholder='Cari nama sekolah...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-xs sm:text-sm font-medium transition-all'
          />
        </div>
        <div className='text-xs text-slate-500 font-medium shrink-0'>
          Menampilkan {filteredSchools.length} dari {schools.length} Sekolah
        </div>
      </div>

      {/* Table Card */}
      <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs'>
        <CardContent className='p-0'>
          {filteredSchools.length > 0 ? (
            <div className='overflow-x-auto min-w-0 max-w-full'>
              <table className='w-full min-w-[650px] text-left text-sm text-slate-700 border-collapse'>
                <thead>
                  <tr className='border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider bg-slate-50'>
                    <th className='py-3.5 px-6'>Nama Sekolah</th>
                    <th className='py-3.5 px-6'>Jumlah Guru Terkait</th>
                    <th className='py-3.5 px-6'>Tanggal Terdaftar</th>
                    <th className='py-3.5 px-6'>Status</th>
                    <th className='py-3.5 px-6 text-center'>Aksi</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100'>
                  {filteredSchools.map((school) => {
                    const hasTeachers = (school.teacherCount || 0) > 0;
                    return (
                      <tr
                        key={school._id}
                        className='hover:bg-slate-50/80 transition-colors group'
                      >
                        <td className='py-4 px-6'>
                          <div className='flex items-center gap-3'>
                            <div className='h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform'>
                              <School className='h-4.5 w-4.5' />
                            </div>
                            <span className='font-bold text-slate-900 group-hover:text-emerald-700 transition-colors'>
                              {school.name}
                            </span>
                          </div>
                        </td>
                        <td className='py-4 px-6'>
                          <div className='flex items-center gap-2'>
                            <Users className='h-4 w-4 text-slate-400' />
                            <span className='font-semibold text-slate-800 text-xs'>
                              {school.teacherCount || 0} Wali Kelas
                            </span>
                          </div>
                        </td>
                        <td className='py-4 px-6 text-slate-500 text-xs font-medium'>
                          <div className='flex items-center gap-1.5'>
                            <Calendar className='h-3.5 w-3.5' />
                            <span>
                              {school.createdAt
                                ? new Date(school.createdAt).toLocaleDateString(
                                    'id-ID',
                                    {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    },
                                  )
                                : '-'}
                            </span>
                          </div>
                        </td>
                        <td className='py-4 px-6'>
                          <span
                            className={`px-2.5 py-1 border text-[10px] font-bold rounded-lg uppercase tracking-wider inline-flex items-center gap-1.5 ${
                              hasTeachers
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                hasTeachers ? 'bg-emerald-600' : 'bg-slate-400'
                              }`}
                            />
                            {hasTeachers ? 'Aktif Digunakan' : 'Belum Ada Guru'}
                          </span>
                        </td>
                        <td className='py-4 px-6 text-center'>
                          <div className='flex justify-center items-center gap-2'>
                            <Button
                              variant='ghost'
                              size='icon'
                              disabled={deletingId !== null}
                              onClick={() =>
                                openDeleteConfirmModal(school._id, school.name)
                              }
                              title={
                                hasTeachers
                                  ? 'Sekolah dengan guru aktif tidak dapat dihapus'
                                  : 'Hapus Sekolah'
                              }
                              className='h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl cursor-pointer transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
                            >
                              {deletingId === school._id ? (
                                <Loader2 className='h-3.5 w-3.5 animate-spin text-rose-600' />
                              ) : (
                                <Trash2 className='h-3.5 w-3.5' />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-2 px-6'>
              <AlertCircle className='h-8 w-8 text-slate-300' />
              <span className='font-bold text-slate-700 text-sm'>
                {searchQuery
                  ? 'Tidak ada sekolah yang cocok dengan pencarian.'
                  : 'Belum ada sekolah terdaftar.'}
              </span>
              <span className='text-center max-w-sm text-slate-500'>
                {searchQuery
                  ? 'Coba gunakan kata kunci pencarian nama sekolah lain.'
                  : 'Klik tombol "Tambah Sekolah" di atas untuk mendaftarkan sekolah pertama.'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ================================================================= */}
      {/* MODAL TAMBAH SEKOLAH BARU (Full Screen Backdrop Blur via Portal)   */}
      {/* ================================================================= */}
      {mounted &&
        isCreateOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className='fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200'>
            <div
              className='fixed inset-0'
              onClick={() => setIsCreateOpen(false)}
            />
            <div className='relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden z-10 my-auto animate-in zoom-in-95 duration-200 text-slate-900'>
              {/* Header */}
              <div className='flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50'>
                <div className='flex items-center gap-3'>
                  <div className='h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20'>
                    <School className='h-5 w-5' />
                  </div>
                  <div>
                    <h2 className='text-base sm:text-lg font-black text-slate-900 tracking-tight'>
                      Tambah Sekolah Baru
                    </h2>
                    <p className='text-xs text-slate-500 font-medium'>
                      Daftarkan nama sekolah baru ke database sistem
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => setIsCreateOpen(false)}
                  className='p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer'
                >
                  <X className='h-5 w-5' />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddSubmit} className='p-6 space-y-4'>
                <div className='space-y-1.5'>
                  <label
                    htmlFor='schoolName'
                    className='text-xs font-bold text-slate-700 tracking-wider uppercase block'
                  >
                    NAMA SEKOLAH <span className='text-rose-500'>*</span>
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400'>
                      <Building className='h-4.5 w-4.5' />
                    </div>
                    <input
                      id='schoolName'
                      type='text'
                      required
                      placeholder='Contoh: SDN 02 Mentari Pagi'
                      value={newSchoolName}
                      onChange={(e) => setNewSchoolName(e.target.value)}
                      disabled={loading}
                      className='w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none rounded-xl text-sm font-medium transition-all disabled:opacity-50'
                    />
                  </div>
                </div>

                <div className='p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800'>
                  <Sparkles className='h-4 w-4 text-emerald-600 shrink-0 mt-0.5' />
                  <p className='leading-relaxed text-[11px] font-medium'>
                    <strong>Tips Admin:</strong> Sekolah yang berhasil didaftarkan
                    akan langsung tersedia pada opsi formulir pendaftaran wali
                    kelas baru.
                  </p>
                </div>

                <div className='pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5'>
                  <button
                    type='button'
                    onClick={() => setIsCreateOpen(false)}
                    className='px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer'
                  >
                    Batal
                  </button>
                  <button
                    type='submit'
                    disabled={loading || !newSchoolName.trim()}
                    className='flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50'
                  >
                    {loading ? (
                      <>
                        <Loader2 className='h-4 w-4 animate-spin' />
                        <span>Menambahkan...</span>
                      </>
                    ) : (
                      <>
                        <Plus className='h-4 w-4' />
                        <span>Tambah Sekolah</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title='Hapus Sekolah'
        description={`Apakah Anda yakin ingin menghapus sekolah "${deleteConfirm.schoolName}" dari sistem? Tindakan ini tidak dapat dibatalkan.`}
        confirmText='Ya, Hapus Sekolah'
        cancelText='Batal'
        variant='danger'
        isLoading={deletingId !== null}
        onConfirm={executeDeleteSchool}
      />
    </div>
  );
}
