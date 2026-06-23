'use client';

import React, { useState } from 'react';
import { addSchool, deleteSchool } from '@/actions/adminActions';
import { toast } from 'sonner';
import {
  School,
  Plus,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id);
    try {
      const res = await deleteSchool(id);
      if (res.success) {
        toast.success(`Sekolah "${name}" berhasil dihapus.`);
        setSchools((prev) => prev.filter((s) => s._id !== id));
      } else {
        toast.error(res.error || 'Gagal menghapus sekolah.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
          Kelola Daftar Sekolah
        </h2>
        <p className="text-zinc-400 text-sm">
          Tambahkan sekolah baru agar dapat dipilih saat registrasi wali kelas, atau hapus sekolah yang tidak digunakan.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Tambah Sekolah Form */}
        <Card className="bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl md:col-span-1">
          <CardHeader>
            <CardTitle className="text-md font-bold text-zinc-200">Tambah Sekolah Baru</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Sekolah yang didaftarkan akan muncul di form registrasi wali kelas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="schoolName" className="text-xs font-semibold text-zinc-400 tracking-wider uppercase block">
                  Nama Sekolah
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
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
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none rounded-xl text-sm transition-all duration-200 disabled:opacity-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Menambahkan...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Sekolah</span>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* List Sekolah */}
        <Card className="bg-zinc-900/30 border-zinc-900 rounded-2xl shadow-xl md:col-span-2">
          <CardHeader>
            <CardTitle className="text-md font-bold text-zinc-200">Daftar Sekolah Saat Ini</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Sekolah yang terdaftar di database. Sekolah yang masih aktif digunakan guru tidak bisa dihapus.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {schools.length > 0 ? (
              <div className="divide-y divide-zinc-900">
                {schools.map((school) => (
                  <div key={school._id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-900/10 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-850 text-zinc-400 group-hover:text-indigo-400 group-hover:border-indigo-900/30 transition-all">
                        <School className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-200 group-hover:text-white transition-colors text-sm">
                          {school.name}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          {school.teacherCount || 0} Guru
                        </span>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deletingId !== null}
                      onClick={() => handleDelete(school._id, school.name)}
                      className="h-8 w-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-950/30 rounded-xl cursor-pointer"
                    >
                      {deletingId === school._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-600 text-xs gap-1 px-6">
                <AlertCircle className="h-8 w-8 text-zinc-700" />
                <span>Belum ada sekolah terdaftar.</span>
                <span>Gunakan form di samping untuk menambahkan sekolah pertama.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
