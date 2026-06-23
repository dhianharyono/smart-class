'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Loader2,
  Check,
  Plus,
  BookOpen,
  GraduationCap,
  Settings,
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
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getGradesByFilter, saveBulkGrades } from '@/actions/gradeActions';
import { updateTeacherKkm } from '@/actions/dashboardActions';
import { exportGradesToExcel } from '@/lib/excelExport';

interface GradeRow {
  studentId: string;
  name: string;
  nis: string;
  className: string;
  score: number | '';
}

interface NilaiClientProps {
  initialSubjects: string[];
  initialKkm: number;
}

export default function NilaiClient({ initialSubjects, initialKkm }: NilaiClientProps) {
  const queryClient = useQueryClient();
  const [subjects, setSubjects] = useState<string[]>(initialSubjects);
  const [kkm, setKkm] = useState<number>(initialKkm);
  const [kkmInput, setKkmInput] = useState<string>(String(initialKkm));
  const [editKkmOpen, setEditKkmOpen] = useState(false);
  const [isUpdatingKkm, setIsUpdatingKkm] = useState(false);

  const handleSaveKkm = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(kkmInput);
    if (isNaN(val) || val < 0 || val > 100) {
      toast.error('KKM harus berupa angka antara 0 dan 100.');
      return;
    }
    setIsUpdatingKkm(true);
    try {
      const res = await updateTeacherKkm(val);
      if (res.success) {
        setKkm(val);
        setEditKkmOpen(false);
        toast.success(`Batas KKM berhasil diperbarui menjadi ${val}`);
        queryClient.invalidateQueries({ queryKey: ['grades'] });
      } else {
        toast.error(res.error || 'Gagal memperbarui KKM.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat memperbarui KKM.');
    } finally {
      setIsUpdatingKkm(false);
    }
  };
  
  // Active filter states
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0] || 'Matematika');
  const [selectedCategory, setSelectedCategory] = useState<'Tugas' | 'UH' | 'UTS' | 'UAS'>('Tugas');
  
  // Local list states
  const [localGrades, setLocalGrades] = useState<GradeRow[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch grades matching filters
  const { data: serverGrades, isLoading, isError } = useQuery<GradeRow[]>({
    queryKey: ['grades', selectedSubject, selectedCategory],
    queryFn: () => getGradesByFilter(selectedSubject, selectedCategory),
    enabled: !!selectedSubject && !!selectedCategory,
  });

  useEffect(() => {
    if (serverGrades) {
      setLocalGrades(serverGrades);
    }
  }, [serverGrades]);

  const handleScoreChange = (studentId: string, value: string) => {
    // If value is empty, keep as empty string
    if (value === '') {
      setLocalGrades((prev) =>
        prev.map((g) => (g.studentId === studentId ? { ...g, score: '' } : g))
      );
      return;
    }

    const numVal = Number(value);
    // Score validation limit
    if (numVal < 0 || numVal > 100 || isNaN(numVal)) {
      return; // Do not update state if invalid format/range
    }

    setLocalGrades((prev) =>
      prev.map((g) => (g.studentId === studentId ? { ...g, score: numVal } : g))
    );
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubjectName.trim();
    if (!trimmed) {
      toast.error('Nama mata pelajaran tidak boleh kosong!');
      return;
    }

    if (subjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Mata pelajaran ini sudah ada.');
      return;
    }

    setSubjects((prev) => [...prev, trimmed].sort());
    setSelectedSubject(trimmed);
    setNewSubjectName('');
    setAddSubjectOpen(false);
    toast.success(`Berhasil menambahkan mata pelajaran "${trimmed}"`);
  };

  const handleSave = () => {
    if (localGrades.length === 0) {
      toast.error('Tidak ada data siswa untuk disimpan.');
      return;
    }

    startTransition(async () => {
      try {
        await saveBulkGrades(selectedSubject, selectedCategory, localGrades);
        
        // Refresh TanStack Query cache
        queryClient.invalidateQueries({
          queryKey: ['grades', selectedSubject, selectedCategory],
        });
        
        toast.success(`Nilai ${selectedSubject} (${selectedCategory}) berhasil disimpan!`);
      } catch (err: any) {
        toast.error(err.message || 'Gagal menyimpan nilai.');
      }
    });
  };

  const handleExcelExport = async () => {
    if (localGrades.length === 0) {
      toast.error('Tidak ada data nilai untuk diekspor!');
      return;
    }
    toast.promise(
      exportGradesToExcel(localGrades, selectedSubject, selectedCategory),
      {
        loading: 'Menyusun laporan Excel nilai...',
        success: 'Excel nilai berhasil diunduh!',
        error: 'Gagal mengunduh Excel.',
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
            Nilai Akademik
          </h2>
          <p className="text-zinc-400 text-sm">
            Input dan kelola perolehan skor nilai tugas, UH, UTS, dan UAS siswa secara terstruktur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={editKkmOpen} onOpenChange={setEditKkmOpen}>
            <DialogTrigger
              render={
                <Button
                  variant="outline"
                  className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 font-medium rounded-xl h-10 px-4 gap-2"
                />
              }
            >
              <Settings className="h-4 w-4 text-emerald-400" />
              <span>KKM: {kkm}</span>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-sm">
              <form onSubmit={handleSaveKkm}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-zinc-100">
                    Pengaturan Batas KKM
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-400">
                    Tentukan batas Kriteria Ketuntasan Minimal (KKM) untuk evaluasi akademik kelas Anda.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kkm-input" className="text-zinc-300 text-sm font-semibold">
                      Batas Nilai KKM
                    </Label>
                    <Input
                      id="kkm-input"
                      type="number"
                      required
                      min={0}
                      max={100}
                      value={kkmInput}
                      onChange={(e) => setKkmInput(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl font-bold text-center text-lg"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditKkmOpen(false)}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdatingKkm}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-4"
                  >
                    {isUpdatingKkm ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleExcelExport}
            variant="outline"
            className="border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 font-medium rounded-xl h-10 px-4 gap-2"
          >
            <Download className="h-4 w-4" />
            Ekspor Excel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl h-10 px-6 gap-2 shadow-lg shadow-emerald-500/10"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Simpan Nilai
          </Button>
        </div>
      </div>

      {/* Subject and Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/30 border border-zinc-900/80 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Subject Dropdown */}
          <div className="flex-1 max-w-xs">
            <Select value={selectedSubject} onValueChange={(val) => val && setSelectedSubject(val)}>
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-10">
                <SelectValue placeholder="Pilih Mata Pelajaran" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                {subjects.map((subj) => (
                  <SelectItem key={subj} value={subj}>
                    {subj}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Subject Dialog */}
          <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
            <DialogTrigger className="border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 rounded-xl h-10 px-4 gap-2 flex items-center cursor-pointer">
              <Plus className="h-4 w-4" />
              Mata Pelajaran Baru
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-sm">
              <form onSubmit={handleAddSubject}>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-zinc-100">
                    Tambah Mata Pelajaran
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-400">
                    Buat subjek/mapel baru yang belum ada di daftar bimbingan kelas Anda.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="subj-name" className="text-zinc-300 text-sm font-semibold">
                      Nama Mata Pelajaran
                    </Label>
                    <Input
                      id="subj-name"
                      required
                      placeholder="Contoh: Fisika, Sejarah, Agama"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      className="bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAddSubjectOpen(false)}
                    className="text-zinc-400 hover:text-zinc-200"
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-4"
                  >
                    Tambah
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <span className="hidden sm:inline text-zinc-700">|</span>

          {/* Test Category Dropdown */}
          <div className="w-48">
            <Select
              value={selectedCategory}
              onValueChange={(val) => val && setSelectedCategory(val as any)}
            >
              <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white rounded-xl h-10">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white rounded-xl">
                <SelectItem value="Tugas">Tugas</SelectItem>
                <SelectItem value="UH">UH (Ulangan Harian)</SelectItem>
                <SelectItem value="UTS">UTS (Tengah Semester)</SelectItem>
                <SelectItem value="UAS">UAS (Akhir Semester)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Card className="bg-zinc-900/30 border-zinc-900 rounded-2xl overflow-hidden shadow-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-sm">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
              <span>Memuat daftar nilai...</span>
            </div>
          ) : isError ? (
            <div className="text-center py-20 text-red-400 text-sm">
              Gagal memuat data nilai. Periksa koneksi server.
            </div>
          ) : localGrades.length > 0 ? (
            <Table>
              <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
                <TableRow className="border-b border-zinc-800 hover:bg-transparent">
                  <TableHead className="w-12 text-center text-zinc-400 font-bold">No</TableHead>
                  <TableHead className="w-32 text-zinc-400 font-bold">NIS</TableHead>
                  <TableHead className="text-zinc-400 font-bold">Nama Lengkap</TableHead>
                  <TableHead className="w-32 text-zinc-400 font-bold">Kelas</TableHead>
                  <TableHead className="w-48 text-center text-zinc-400 font-bold">
                    Nilai (0 - 100)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localGrades.map((row, index) => (
                  <TableRow
                    key={row.studentId}
                    className="border-b border-zinc-900 hover:bg-zinc-900/20 text-zinc-300"
                  >
                    <TableCell className="text-center font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono">{row.nis}</TableCell>
                    <TableCell className="font-semibold text-zinc-200">{row.name}</TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell className="flex justify-center">
                      <div className="relative w-28">
                        <Input
                          type="number"
                          placeholder="Kosong"
                          min={0}
                          max={100}
                          value={row.score}
                          onChange={(e) => handleScoreChange(row.studentId, e.target.value)}
                          className={`text-center font-bold bg-zinc-950 border text-white rounded-xl focus:ring-1 focus:ring-emerald-500 h-9 pr-2 ${
                            row.score !== '' && row.score < kkm
                              ? 'border-rose-900/60 text-rose-400 focus:border-rose-500 bg-rose-950/10'
                              : 'border-zinc-800 focus:border-emerald-500'
                          }`}
                        />
                        {row.score !== '' && row.score < kkm && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-rose-500 uppercase tracking-wider">
                            &lt; KKM
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <GraduationCap className="h-10 w-10 text-zinc-700 mb-2" />
              <p className="text-sm font-semibold">Tidak ada siswa terdaftar di kelas.</p>
              <p className="text-xs text-zinc-650">Silakan tambahkan siswa terlebih dahulu di halaman Data Siswa.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
