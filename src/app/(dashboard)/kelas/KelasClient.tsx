'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  addClass,
  deleteClass,
  switchActiveClass,
  updateClass,
  getClassesStatistics,
  ClassStatItem,
} from '@/actions/profileActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  School,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Check,
  Pencil,
  Users,
  CalendarCheck2,
  GraduationCap,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
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
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => getProfile(),
  });

  // Query Class Statistics
  const { data: classStats = {}, isLoading: isStatsLoading } = useQuery<
    Record<string, ClassStatItem>
  >({
    queryKey: ['classesStatistics'],
    queryFn: () => getClassesStatistics(),
  });

  const [newClassInput, setNewClassInput] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);

  // Modal States
  const [addModalOpen, setAddModalOpen] = useState(false);

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

  const activeClass =
    profile?.activeClass || profile?.className || classesList[0] || '5A';

  // Overall Statistics Calculation
  const totalAllStudents = React.useMemo(() => {
    return Object.values(classStats).reduce(
      (acc, curr) => acc + (curr.totalStudents || 0),
      0,
    );
  }, [classStats]);

  const totalMaleStudents = React.useMemo(() => {
    return Object.values(classStats).reduce(
      (acc, curr) => acc + (curr.maleStudents || 0),
      0,
    );
  }, [classStats]);

  const totalFemaleStudents = React.useMemo(() => {
    return Object.values(classStats).reduce(
      (acc, curr) => acc + (curr.femaleStudents || 0),
      0,
    );
  }, [classStats]);

  const avgStudentsPerClass = React.useMemo(() => {
    if (classesList.length === 0) return 0;
    return Math.round(totalAllStudents / classesList.length);
  }, [totalAllStudents, classesList]);

  // Handler: Tambah Kelas Baru (Modal)
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
        setAddModalOpen(false);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['classesStatistics'] });
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

  // Handler: Quick Navigate dengan switch class
  const handleNavigateWithClass = async (
    targetClass: string,
    targetPath: string,
  ) => {
    if (targetClass !== activeClass) {
      setIsActionPending(true);
      try {
        await switchActiveClass(targetClass);
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      } catch (err) {
        console.error(err);
      } finally {
        setIsActionPending(false);
      }
    }
    router.push(targetPath);
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
        (c) => c !== oldName && c.toLowerCase() === newName.toLowerCase(),
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
        queryClient.invalidateQueries({ queryKey: ['classesStatistics'] });
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
        queryClient.invalidateQueries({ queryKey: ['classesStatistics'] });
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

  const isLoading = isProfileLoading;

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header Bar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs'>
        <div>
          <div className='flex items-center gap-2.5'>
            <div>
              <h2 className='text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900'>
                Daftar Kelas Diampu
              </h2>
              <p className='text-slate-500 text-xs sm:text-sm mt-0.5'>
                Kelola seluruh rombongan belajar (multi-kelas), pantau demografi
                siswa, dan beralih konteks data kelas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Overview Metric Cards */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-slate-500'>
              Total Kelas
            </span>
            <div className='p-2 rounded-xl bg-blue-50 text-blue-600'>
              <School className='h-4 w-4' />
            </div>
          </div>
          <div className='mt-2'>
            <div className='text-2xl font-extrabold text-slate-900'>
              {classesList.length}
            </div>
            <p className='text-[11px] text-slate-500 mt-0.5'>
              Rombongan belajar aktif
            </p>
          </div>
        </Card>

        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-slate-500'>
              Kelas Aktif Saat Ini
            </span>
            <div className='p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100'>
              <CheckCircle2 className='h-4 w-4' />
            </div>
          </div>
          <div className='mt-2'>
            <div className='text-2xl font-extrabold text-slate-900'>
              Kelas {activeClass}
            </div>
            <p className='text-[11px] text-slate-500 mt-0.5'>
              Kelas aktif saat ini
            </p>
          </div>
        </Card>

        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-slate-500'>
              Total Siswa
            </span>
            <div className='p-2 rounded-xl bg-violet-50 text-violet-600'>
              <Users className='h-4 w-4' />
            </div>
          </div>
          <div className='mt-2'>
            <div className='text-2xl font-extrabold text-slate-900'>
              {isStatsLoading ? '...' : totalAllStudents}
            </div>
            <p className='text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5'>
              <span className='text-blue-600 font-semibold'>
                L: {totalMaleStudents}
              </span>
              <span>•</span>
              <span className='text-rose-600 font-semibold'>
                P: {totalFemaleStudents}
              </span>
            </p>
          </div>
        </Card>

        <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-4'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-slate-500'>
              Rata-rata / Kelas
            </span>
            <div className='p-2 rounded-xl bg-amber-50 text-amber-600'>
              <GraduationCap className='h-4 w-4' />
            </div>
          </div>
          <div className='mt-2'>
            <div className='text-2xl font-extrabold text-slate-900'>
              {isStatsLoading ? '...' : `${avgStudentsPerClass} Siswa`}
            </div>
            <p className='text-[11px] text-slate-500 mt-0.5'>
              Distribusi beban siswa
            </p>
          </div>
        </Card>
      </div>

      {/* Main Section: Full Width Rich Class Cards Grid */}
      <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs p-6'>
        <CardHeader className='p-0 pb-5 border-b border-slate-200 flex flex-row items-center justify-between gap-4'>
          <div>
            <CardTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <School className='h-5 w-5 text-emerald-600' />
              <span>Daftar Kelas Tersedia</span>
            </CardTitle>
            <CardDescription className='text-xs text-slate-500 mt-1'>
              Pilih kelas untuk mengaktifkan konteks data, pantau jumlah siswa,
              atau akses pintas ke absensi dan nilai.
            </CardDescription>
          </div>

          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setNewClassInput('');
              setAddModalOpen(true);
            }}
            className='hidden sm:flex items-center gap-1.5 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold h-9 px-3.5 cursor-pointer'
          >
            <Plus className='h-3.5 w-3.5' />
            <span>Tambah Kelas</span>
          </Button>
        </CardHeader>

        {isLoading ? (
          <div className='flex flex-col items-center justify-center py-16 text-slate-400 gap-3'>
            <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
            <p className='text-xs font-medium'>
              Memuat data kelas & informasi siswa...
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mt-6'>
            {classesList.map((cls) => {
              const isActive = cls === activeClass;
              const stat: ClassStatItem = classStats[cls] || {
                className: cls,
                totalStudents: 0,
                maleStudents: 0,
                femaleStudents: 0,
                activeStudents: 0,
              };

              const malePct =
                stat.totalStudents > 0
                  ? Math.round((stat.maleStudents / stat.totalStudents) * 100)
                  : 0;
              const femalePct = stat.totalStudents > 0 ? 100 - malePct : 0;

              return (
                <div
                  key={cls}
                  className={`relative flex flex-col justify-between rounded-2xl border transition-all duration-200 p-5 overflow-hidden ${
                    isActive
                      ? 'bg-white border-slate-300 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Card Header: Icon, Class Name & Status Chip */}
                  <div>
                    <div className='flex items-start justify-between gap-3 mb-4'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={`p-3 rounded-xl transition-all ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <School className='h-6 w-6' />
                        </div>
                        <div>
                          <div className='flex items-center gap-2'>
                            <h3 className='text-lg font-bold text-slate-900'>
                              Kelas {cls}
                            </h3>
                          </div>
                          <p className='text-xs text-slate-500 mt-0.5'>
                            {profile?.schoolName || 'Sekolah'}
                          </p>
                        </div>
                      </div>

                      {isActive ? (
                        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow-xs shrink-0'>
                          <span className='h-1.5 w-1.5 rounded-full bg-white animate-pulse' />
                          AKTIF
                        </span>
                      ) : (
                        <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200 shrink-0'>
                          TERSEDIA
                        </span>
                      )}
                    </div>

                    {/* Enriched Student Demographics & Statistics */}
                    <div className='bg-slate-50/80 border border-slate-100 rounded-xl p-3.5 space-y-3 mb-4'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-bold text-slate-700 flex items-center gap-1.5'>
                          <Users className='h-3.5 w-3.5 text-slate-500' />
                          Populasi Siswa
                        </span>
                        <span className='text-xs font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200/60 shadow-xs'>
                          {stat.totalStudents} Siswa
                        </span>
                      </div>

                      {/* Male / Female breakdown */}
                      <div className='grid grid-cols-2 gap-2 text-xs'>
                        <div className='bg-white rounded-lg p-2 border border-slate-100 flex items-center justify-between'>
                          <span className='text-[11px] text-slate-500 flex items-center gap-1'>
                            <span className='h-2 w-2 rounded-full bg-blue-500' />
                            Laki-laki
                          </span>
                          <span className='font-bold text-slate-800 text-xs'>
                            {stat.maleStudents}
                          </span>
                        </div>
                        <div className='bg-white rounded-lg p-2 border border-slate-100 flex items-center justify-between'>
                          <span className='text-[11px] text-slate-500 flex items-center gap-1'>
                            <span className='h-2 w-2 rounded-full bg-rose-500' />
                            Perempuan
                          </span>
                          <span className='font-bold text-slate-800 text-xs'>
                            {stat.femaleStudents}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Switch Active Class & Management Buttons */}
                  <div className='pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto'>
                    {isActive ? (
                      <div className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold'>
                        <CheckCircle2 className='h-3.5 w-3.5 text-emerald-600 shrink-0' />
                        <span>Kelas Aktif</span>
                      </div>
                    ) : (
                      <Button
                        type='button'
                        onClick={() => handleSwitchClass(cls)}
                        disabled={isActionPending}
                        variant='outline'
                        className='border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold h-9 px-3.5 transition-all cursor-pointer'
                      >
                        {isActionPending ? (
                          <Loader2 className='h-3.5 w-3.5 animate-spin' />
                        ) : (
                          <span className='flex items-center gap-1.5'>
                            <span>Beralih ke Kelas Ini</span>
                            <ArrowRight className='h-3 w-3' />
                          </span>
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
      </Card>

      {/* MODAL: Tambah Kelas Baru (Sesuai Permintaan User) */}
      <Dialog
        open={addModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setAddModalOpen(false);
            setNewClassInput('');
          }
        }}
      >
        <DialogContent className='bg-white sm:max-w-md rounded-2xl p-6'>
          <DialogHeader className='space-y-1.5'>
            <DialogTitle className='text-base font-bold text-slate-900 flex items-center gap-2'>
              <div className='p-2 bg-emerald-50 text-emerald-600 rounded-xl'>
                <Plus className='h-5 w-5' />
              </div>
              <span>Tambah Kelas Baru</span>
            </DialogTitle>
            <DialogDescription className='text-xs text-slate-500'>
              Tambahkan rombongan belajar / kelas baru yang Anda ampu di sistem
              Smart Class.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddClass} className='space-y-4 pt-2'>
            <div className='space-y-2'>
              <Label className='text-slate-700 text-xs font-bold block'>
                NAMA KELAS
              </Label>
              <Input
                placeholder='Contoh: 5B, 7A, 8C, X IPA 1'
                value={newClassInput}
                onChange={(e) => setNewClassInput(e.target.value)}
                disabled={isActionPending}
                autoFocus
                className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl text-xs h-10 px-3.5'
              />
              <p className='text-[11px] text-slate-400'>
                Gunakan format penamaan standar sekolah Anda (misal tingkat
                angka atau romawi).
              </p>
            </div>

            <DialogFooter className='pt-2 flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                disabled={isActionPending}
                onClick={() => {
                  setAddModalOpen(false);
                  setNewClassInput('');
                }}
                className='rounded-xl text-xs font-semibold h-10 px-4 cursor-pointer'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isActionPending || !newClassInput.trim()}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs h-10 px-4 gap-1.5 cursor-pointer shadow-xs'
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Edit Nama Kelas */}
      <Dialog
        open={editModal.open}
        onOpenChange={(open) => {
          if (!open) setEditModal({ open: false, oldName: '', newName: '' });
        }}
      >
        <DialogContent className='bg-white sm:max-w-md rounded-2xl p-6'>
          <DialogHeader className='space-y-1.5'>
            <DialogTitle className='text-base font-bold text-slate-900 flex items-center gap-2'>
              <div className='p-2 bg-emerald-50 text-emerald-600 rounded-xl'>
                <Pencil className='h-5 w-5' />
              </div>
              <span>Edit Nama Kelas {editModal.oldName}</span>
            </DialogTitle>
            <DialogDescription className='text-xs text-slate-500'>
              Ubah nama kelas ini (misal: 11A menjadi XI IPA 1). Data seluruh
              siswa di kelas ini akan diperbarui secara otomatis.
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
        description={`Apakah Anda yakin ingin menghapus Kelas ${deleteConfirm.className} dari daftar kelas yang Anda ampu? Seluruh data siswa dalam kelas ini tetap tersimpan di database dan kelas dapat ditambahkan kembali kapan saja.`}
        confirmText='Ya, Hapus Kelas'
        cancelText='Batal'
        variant='danger'
        onConfirm={handleConfirmDeleteClass}
        isLoading={isActionPending}
      />
    </div>
  );
}
