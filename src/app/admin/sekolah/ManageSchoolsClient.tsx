'use client';

import React, { useState } from 'react';
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
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function ManageSchoolsClient({ initialSchools }: ManageSchoolsClientProps) {
  const [schools, setSchools] = useState<SchoolData[]>(initialSchools);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
        setSchools((prev) => [...prev, res.school!].sort((a, b) => a.name.localeCompare(b.name)));
        setNewSchoolName('');
      } else {
        toast.error(res.error || 'Gagal menambahkan sekolah.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
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
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
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

  // Calculate stats
  const totalTeachers = schools.reduce((acc, curr) => acc + (curr.teacherCount || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            Kelola Daftar Sekolah
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl">
            Tambahkan sekolah baru agar dapat dipilih saat registrasi wali kelas, atau kelola dan rapikan daftar sekolah terdaftar di database.
          </p>
        </div>
      </div>

      {/* 3 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
            <School className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Sekolah</p>
            <p className="text-xl font-black text-slate-900">{schools.length} Sekolah</p>
            <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">Terdaftar di Sistem</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Total Guru Terkait</p>
            <p className="text-xl font-black text-slate-900">{totalTeachers} Wali Kelas</p>
            <span className="text-[10px] text-teal-600 font-semibold block mt-0.5">Aktif Terhubung</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200/80 text-blue-700 flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Status Fitur</p>
            <p className="text-xl font-black text-slate-900">Siap Digunakan</p>
            <span className="text-[10px] text-blue-600 font-semibold block mt-0.5">Form Registrasi Aktif</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Tambah Sekolah & List Sekolah */}
      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* CARD 1: Tambah Sekolah Baru */}
        <Card className="bg-white border border-slate-200/90 rounded-3xl shadow-sm lg:col-span-1">
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900">Tambah Sekolah Baru</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Daftarkan nama sekolah baru ke database
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="schoolName" className="text-xs font-bold text-slate-700 tracking-wider uppercase block">
                  NAMA SEKOLAH <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Building className="h-4.5 w-4.5" />
                  </div>
                  <input
                    id="schoolName"
                    type="text"
                    required
                    placeholder="Contoh: SDN 02 Pagi"
                    value={newSchoolName}
                    onChange={(e) => setNewSchoolName(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none rounded-xl text-sm font-medium transition-all shadow-xs disabled:opacity-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>MENAMBAHKAN...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>TAMBAH SEKOLAH</span>
                  </>
                )}
              </Button>
            </form>

            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
              <Sparkles className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px] font-medium">
                <strong>Tips Admin:</strong> Sekolah yang berhasil ditambahkan akan langsung muncul pada pilihan dropdown formulir pendaftaran wali kelas.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: Daftar Sekolah Saat Ini */}
        <Card className="bg-white border border-slate-200/90 rounded-3xl shadow-sm lg:col-span-2">
          <CardHeader className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
                <School className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Daftar Sekolah Saat Ini</span>
                  <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {schools.length} Sekolah
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Daftar sekolah terdata. Sekolah yang masih aktif digunakan guru tidak dapat dihapus.
                </CardDescription>
              </div>
            </div>

            {/* Live Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50/60 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {filteredSchools.length > 0 ? (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
                {filteredSchools.map((school) => {
                  const hasTeachers = (school.teacherCount || 0) > 0;
                  return (
                    <div
                      key={school._id}
                      className="flex items-center justify-between p-3.5 bg-slate-50/70 border border-slate-200/90 rounded-2xl hover:bg-slate-100/80 hover:border-emerald-200 transition-all group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 border border-emerald-200/60 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                          <School className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-sm truncate">
                            {school.name}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                              <Users className="h-3 w-3 text-emerald-600" />
                              {school.teacherCount || 0} Guru Terdaftar
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={deletingId !== null}
                        onClick={() => openDeleteConfirmModal(school._id, school.name)}
                        title={hasTeachers ? 'Sekolah dengan guru aktif tidak bisa dihapus' : 'Hapus Sekolah'}
                        className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl cursor-pointer shrink-0 transition-colors ml-2"
                      >
                        {deletingId === school._id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-xs gap-2 px-6 border border-dashed border-slate-200 rounded-2xl">
                <AlertCircle className="h-8 w-8 text-emerald-600/40" />
                <span className="font-bold text-slate-700 text-sm">
                  {searchQuery ? 'Tidak ada sekolah yang cocok' : 'Belum ada sekolah terdaftar'}
                </span>
                <span className="text-center max-w-sm">
                  {searchQuery ? 'Coba gunakan kata kunci pencarian lain.' : 'Gunakan form di samping untuk menambahkan sekolah pertama ke sistem.'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Hapus Sekolah"
        description={`Apakah Anda yakin ingin menghapus sekolah "${deleteConfirm.schoolName}" dari sistem? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus Sekolah"
        cancelText="Batal"
        variant="danger"
        isLoading={deletingId !== null}
        onConfirm={executeDeleteSchool}
      />
    </div>
  );
}
