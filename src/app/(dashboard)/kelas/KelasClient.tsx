'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  addClass,
  deleteClass,
  switchActiveClass,
  updateClass,
} from '@/actions/profileActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  School,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Check,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function KelasClient() {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Query Profile Data
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });

  const [newClassInput, setNewClassInput] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);

  // Modal States
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    className: string;
  }>({ open: false, className: '' });

  const [editModal, setEditModal] = useState<{
    open: boolean;
    oldName: string;
    newName: string;
  }>({ open: false, oldName: '', newName: '' });

  const classesList: string[] = React.useMemo(() => {
    if (profile?.classes && profile.classes.length > 0) {
      return Array.from(new Set(profile.classes.filter(Boolean)));
    }
    if (profile?.className) {
      return [profile.className];
    }
    return ['5A'];
  }, [profile]);

  const activeClass = profile?.activeClass || profile?.className || classesList[0] || '5A';

  // Handler: Tambah Kelas Baru
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newClassInput.trim();
    if (!clean) {
      toast.error('Nama kelas tidak boleh kosong.');
      return;
    }

    if (classesList.some((c) => c.toLowerCase() === clean.toLowerCase())) {
      toast.error(`Kelas "${clean}" sudah ada dalam daftar kelas Anda.`);
      return;
    }

    setIsActionPending(true);
    try {
      const res = await addClass(clean);
      if (res.success) {
        toast.success(`Kelas ${clean} berhasil ditambahkan!`);
        setNewClassInput('');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menambahkan kelas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan kelas.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Handler: Beralih Kelas Aktif
  const handleSwitchClass = async (targetClass: string) => {
    if (targetClass === activeClass || isActionPending) return;
    setIsActionPending(true);
    try {
      const res = await switchActiveClass(targetClass);
      if (res.success) {
        toast.success(`Berhasil mengganti kelas aktif ke Kelas ${targetClass}`);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengganti kelas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengganti kelas.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Handler: Open Edit Modal
  const openEditDialog = (cls: string) => {
    if (isActionPending) return;
    setEditModal({ open: true, oldName: cls, newName: cls });
  };

  // Handler: Submit Edit Kelas
  const handleConfirmEditClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const oldName = editModal.oldName;
    const newName = editModal.newName.trim();

    if (!newName) {
      toast.error('Nama kelas tidak boleh kosong.');
      return;
    }

    if (oldName === newName) {
      setEditModal({ open: false, oldName: '', newName: '' });
      return;
    }

    if (
      classesList.some(
        (c) => c !== oldName && c.toLowerCase() === newName.toLowerCase()
      )
    ) {
      toast.error(`Kelas "${newName}" sudah ada dalam daftar kelas Anda.`);
      return;
    }

    setIsActionPending(true);
    try {
      const res = await updateClass(oldName, newName);
      if (res.success) {
        toast.success(`Nama kelas berhasil diubah menjadi Kelas ${newName}!`);
        setEditModal({ open: false, oldName: '', newName: '' });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengubah nama kelas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal mengubah nama kelas.');
    } finally {
      setIsActionPending(false);
    }
  };

  // Handler: Hapus Kelas
  const promptDeleteClass = (clsToDelete: string) => {
    if (isActionPending) return;
    setDeleteConfirm({ open: true, className: clsToDelete });
  };

  const handleConfirmDeleteClass = async () => {
    const clsToDelete = deleteConfirm.className;
    if (!clsToDelete || isActionPending) return;
    setIsActionPending(true);
    try {
      const res = await deleteClass(clsToDelete);
      if (res.success) {
        toast.success(`Kelas ${clsToDelete} berhasil dihapus.`);
        setDeleteConfirm({ open: false, className: '' });
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        window.location.reload();
      } else {
        toast.error(res.error || 'Gagal menghapus kelas.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kelas.');
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header Bar */}
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3'>
            <span>Daftar Kelas</span>
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Kelola seluruh kelas yang Anda ampu di sekolah, ubah nama kelas, dan beralih antar kelas dengan 1-klik.
          </p>
        </div>
      </div>

      {/* Quick Summary Cards - Gambar 1: Rapikan Tampilan Dalam Card */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 flex items-center gap-4'>
          <div className='p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0'>
            <Layers className='h-6 w-6' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs font-bold text-slate-500 uppercase tracking-wider'>Total Kelas Diampu</p>
            <p className='text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 justify-self-center'>
              {isLoading ? '...' : classesList.length} <span className='text-xs font-medium text-slate-400'>Kelas</span>
            </p>
          </div>
        </Card>

        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 flex items-center gap-4'>
          <div className='p-3 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 shrink-0'>
            <CheckCircle2 className='h-6 w-6' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs font-bold text-slate-500 uppercase tracking-wider justify-self-center'>Kelas Aktif</p>
            <p className='text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 truncate'>
              {isLoading ? '...' : `Kelas ${activeClass}`}
            </p>
          </div>
        </Card>

        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-5 flex items-center gap-4'>
          <div className='p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0'>
            <Sparkles className='h-6 w-6' />
          </div>
          <div className='min-w-0'>
            <p className='text-xs font-bold text-slate-500 uppercase tracking-wider'>Mode Pembelajaran</p>
            <p className='text-sm sm:text-base font-extrabold text-slate-800 mt-0.5 truncate'>
              {classesList.length > 1 ? 'Multi-Kelas (Paralel)' : 'Tunggal (Wali Kelas)'}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Layout Grid - Gambar 2: Sejajarkan Tinggi Card */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch'>
        {/* Left Section: Class Cards Grid (2 cols) */}
        <div className='lg:col-span-2 flex flex-col'>
          <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-6 h-full flex flex-col justify-between'>
            <div>
              <CardHeader className='p-0 pb-5 border-b border-slate-200 flex flex-row items-center justify-between gap-4'>
                <div>
                  <CardTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
                    <School className='h-5 w-5 text-emerald-600' />
                    Daftar Kelas Tersedia
                  </CardTitle>
                  <CardDescription className='text-xs text-slate-500 mt-1'>
                    Pilih kelas untuk mengaktifkan konteks data atau edit nama kelas Anda.
                  </CardDescription>
                </div>
              </CardHeader>

              {isLoading ? (
                <div className='flex flex-col items-center justify-center py-12 text-slate-400 gap-3'>
                  <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
                  <p className='text-xs font-medium'>Memuat data kelas...</p>
                </div>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 items-stretch'>
                  {classesList.map((cls) => {
                    const isActive = cls === activeClass;
                    return (
                      <div
                        key={cls}
                        className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 h-full ${isActive
                          ? 'bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border-emerald-300 shadow-xs ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                          }`}
                      >
                        <div className='flex items-start justify-between gap-3 mb-4'>
                          <div className='flex items-center gap-3'>
                            <div
                              className={`p-3 rounded-xl ${isActive
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                              <School className='h-6 w-6' />
                            </div>
                            <div>
                              <h3 className='text-base font-bold text-slate-900'>
                                Kelas {cls}
                              </h3>
                              <p className='text-xs text-slate-500 mt-0.5'>
                                {isActive ? 'Sedang Digunakan' : 'Siap Diaktifkan'}
                              </p>
                            </div>
                          </div>

                          {isActive ? (
                            <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold shadow-xs shrink-0'>
                              <Check className='h-3 w-3' /> AKTIF
                            </span>
                          ) : (
                            <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0'>
                              TERSEDIA
                            </span>
                          )}
                        </div>

                        <div className='pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto'>
                          {isActive ? (
                            <span className='text-xs font-semibold text-emerald-700 flex items-center gap-1.5'>
                              <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                              Konteks Data Aktif
                            </span>
                          ) : (
                            <Button
                              type='button'
                              onClick={() => handleSwitchClass(cls)}
                              disabled={isActionPending}
                              variant='outline'
                              className='border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold h-9 px-3 transition-all cursor-pointer'
                            >
                              {isActionPending ? (
                                <Loader2 className='h-3.5 w-3.5 animate-spin' />
                              ) : (
                                <span>Beralih ke Kelas Ini</span>
                              )}
                            </Button>
                          )}

                          <div className='flex items-center gap-1 ml-auto shrink-0'>
                            {/* Edit Button */}
                            <Button
                              type='button'
                              onClick={() => openEditDialog(cls)}
                              disabled={isActionPending}
                              variant='ghost'
                              title={`Edit Nama Kelas ${cls}`}
                              className='text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl h-9 w-9 p-0 cursor-pointer'
                            >
                              <Pencil className='h-4 w-4' />
                            </Button>

                            {/* Delete Button (if > 1 class) */}
                            {classesList.length > 1 && (
                              <Button
                                type='button'
                                onClick={() => promptDeleteClass(cls)}
                                disabled={isActionPending}
                                variant='ghost'
                                title={`Hapus Kelas ${cls}`}
                                className='text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl h-9 w-9 p-0 cursor-pointer'
                              >
                                <Trash2 className='h-4 w-4' />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Section: Add Class Form Card (1 col) */}
        <div className='lg:col-span-1 flex flex-col'>
          <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-6 h-full flex flex-col justify-between'>
            <div>
              <CardHeader className='p-0 pb-4 border-b border-slate-200'>
                <CardTitle className='text-base font-bold text-slate-900 flex items-center gap-2'>
                  <Plus className='h-5 w-5 text-emerald-600' />
                  Tambah Kelas Baru
                </CardTitle>
                <CardDescription className='text-xs text-slate-500 mt-1'>
                  Masukkan nama kelas baru yang ingin Anda ampu di sistem ini.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleAddClass} className='space-y-4 pt-4'>
                <div className='space-y-2'>
                  <Label className='text-slate-700 text-xs font-semibold block'>
                    NAMA KELAS
                  </Label>
                  <Input
                    placeholder='Contoh: 5B, 6A, VII C'
                    value={newClassInput}
                    onChange={(e) => setNewClassInput(e.target.value)}
                    disabled={isActionPending}
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-10'
                  />
                  <p className='text-[11px] text-slate-400'>
                    Gunakan format penamaan kelas sesuai standar sekolah Anda.
                  </p>
                </div>

                <Button
                  type='submit'
                  disabled={isActionPending || !newClassInput.trim()}
                  className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 gap-2 cursor-pointer shadow-sm shadow-emerald-600/20 mt-2'
                >
                  {isActionPending ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <>
                      <Plus className='h-4 w-4' />
                      <span>Tambahkan Kelas</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Class Modal / Dialog */}
      <Dialog
        open={editModal.open}
        onOpenChange={(open) => {
          if (!open) setEditModal({ open: false, oldName: '', newName: '' });
        }}
      >
        <DialogContent className='bg-white sm:max-w-md rounded-2xl p-6'>
          <DialogHeader className='space-y-1.5'>
            <DialogTitle className='text-base font-bold text-slate-900 flex items-center gap-2'>
              <Pencil className='h-5 w-5 text-emerald-600' />
              Edit Nama Kelas {editModal.oldName}
            </DialogTitle>
            <DialogDescription className='text-xs text-slate-500'>
              Ubah nama kelas ini (misal: 11A menjadi XI IPA 1). Data seluruh siswa di kelas ini akan diperbarui secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmEditClass} className='space-y-4 pt-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-slate-700'>
                NAMA KELAS BARU
              </Label>
              <Input
                placeholder='Masukkan nama kelas baru'
                value={editModal.newName}
                onChange={(e) =>
                  setEditModal((prev) => ({ ...prev, newName: e.target.value }))
                }
                disabled={isActionPending}
                className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-10 px-3.5'
                autoFocus
              />
            </div>

            <DialogFooter className='pt-2 flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={isActionPending}
                onClick={() =>
                  setEditModal({ open: false, oldName: '', newName: '' })
                }
                className='rounded-xl text-xs font-semibold h-10 px-4 cursor-pointer'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isActionPending || !editModal.newName.trim()}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 px-4 gap-1.5 cursor-pointer shadow-xs'
              >
                {isActionPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  <>
                    <Check className='h-4 w-4' />
                    <span>Simpan Nama Kelas</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting Class */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, className: '' })}
        title={`Hapus Kelas ${deleteConfirm.className}?`}
        description={`Apakah Anda yakin ingin menghapus Kelas ${deleteConfirm.className} dari daftar kelas yang Anda ampu? Tindakan ini dapat dibatalkan dengan menambahkan kembali kelas tersebut nanti.`}
        confirmText='Ya, Hapus Kelas'
        cancelText='Batal'
        variant='danger'
        onConfirm={handleConfirmDeleteClass}
        isLoading={isActionPending}
      />
    </div>
  );
}
