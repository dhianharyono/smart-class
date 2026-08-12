'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStudent } from '@/actions/studentActions';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Upload,
  User,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface TambahSiswaClientProps {
  defaultClassName?: string;
}

export default function TambahSiswaClient({
  defaultClassName = '',
}: TambahSiswaClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Photo State
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    nisn: '',
    nis: '',
    className: defaultClassName || '',
    gender: 'L' as 'L' | 'P',
    birthPlace: '',
    birthDate: '',
    religion: 'Islam',
    address: '',
    fatherName: '',
    fatherJob: '',
    motherName: '',
    motherJob: '',
    guardianName: '',
    guardianJob: '',
    entryDate: new Date().toISOString().split('T')[0],
    entryClass: defaultClassName || '',
    entryAcademicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    previousSchool: '',
    status: 'Aktif' as 'Aktif' | 'Mutasi' | 'Lulus' | 'Non-Aktif',
  });

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 1.5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Mutation to Save Student
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!formData.name.trim())
        throw new Error('Nama lengkap siswa wajib diisi');
      if (!formData.nis.trim()) throw new Error('NIS wajib diisi');
      if (!formData.className.trim()) throw new Error('Kelas wajib diisi');

      const payload = {
        ...formData,
        photo: photoPreview || undefined,
        birthDate: formData.birthDate
          ? new Date(formData.birthDate)
          : undefined,
        entryDate: formData.entryDate
          ? new Date(formData.entryDate)
          : undefined,
      };

      return await createStudent(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Biodata siswa berhasil disimpan!');
      router.push('/siswa');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Gagal menyimpan data siswa');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  return (
    <div className='space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto'>
      {/* Breadcrumb Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4'>
        <div>
          <div className='flex items-center gap-2 text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider'>
            <Link
              href='/siswa'
              className='hover:text-emerald-600 transition-colors'
            >
              Data Siswa
            </Link>
            <span>&rsaquo;</span>
            <span className='text-emerald-700 font-bold'>Biodata Baru</span>
          </div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3'>
            <span>Formulir Input Biodata Siswa</span>
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Lengkapi data administrasi peserta didik sesuai dengan dokumen
            kependudukan resmi sekolah.
          </p>
        </div>

        <div className='flex items-center gap-2.5 shrink-0'>
          <Link href='/siswa'>
            <Button
              variant='outline'
              className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl h-10 px-4 gap-2 shadow-xs'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Kembali ke Daftar</span>
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={saveMutation.isPending}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-5 gap-2 shadow-xs cursor-pointer'
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className='h-4 w-4' />
                <span>Simpan Biodata</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className='grid grid-cols-1 lg:grid-cols-12 gap-6'
      >
        {/* LEFT COLUMN: Photo Upload & Guidance (4 cols) */}
        <div className='lg:col-span-4 space-y-6'>
          {/* Photo Upload Card */}
          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-6 text-center'>
            <CardContent className='p-0 space-y-4'>
              <h3 className='text-xs font-extrabold text-slate-500 uppercase tracking-wider text-center'>
                FOTO PROFIL SISWA
              </h3>

              <div className='flex justify-center'>
                <div className='relative group w-36 h-36 rounded-full overflow-hidden bg-slate-100 border-4 border-slate-200/80 flex items-center justify-center shadow-inner'>
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt='Preview Foto'
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <User className='h-20 w-20 text-slate-300' />
                  )}
                </div>
              </div>

              <div className='space-y-2'>
                <label className='inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-all shadow-xs w-full'>
                  <Upload className='h-4 w-4 text-emerald-600' />
                  <span>Pilih File Gambar</span>
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handlePhotoUpload}
                    className='hidden'
                  />
                </label>
                <p className='text-[11px] text-slate-400 leading-tight'>
                  Format PNG, JPG max. 1.5MB. Crop melingkar otomatis.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Panduan Pengisian Card (Theme-aligned Light Emerald Card) */}
          <Card className='bg-emerald-50/70 border border-emerald-200/80 shadow-xs rounded-2xl p-6 text-slate-800'>
            <CardContent className='p-0 space-y-4'>
              <div className='flex items-center gap-2.5 border-b border-emerald-200/60 pb-3'>
                <div className='p-2 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 shrink-0'>
                  <CheckCircle2 className='h-5 w-5' />
                </div>
                <div>
                  <h4 className='font-extrabold text-sm text-emerald-950'>
                    Panduan Pengisian Form
                  </h4>
                  <p className='text-[11px] text-emerald-700/80 font-medium'>
                    Ketentuan registrasi data resmi
                  </p>
                </div>
              </div>

              <ul className='space-y-3 text-xs text-emerald-900 leading-relaxed font-medium'>
                <li className='flex items-start gap-2.5'>
                  <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0 mt-0.5' />
                  <span>Isian nama wajib huruf kapital awal kata.</span>
                </li>
                <li className='flex items-start gap-2.5'>
                  <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0 mt-0.5' />
                  <span>NISN terdiri tepat dari 10 digit angka nasional.</span>
                </li>
                <li className='flex items-start gap-2.5'>
                  <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0 mt-0.5' />
                  <span>
                    Sertakan alamat lengkap dengan RT/RW dan kode POS.
                  </span>
                </li>
                <li className='flex items-start gap-2.5'>
                  <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0 mt-0.5' />
                  <span>
                    Tentukan tahun ajaran masuk sesuai format YYYY/YYYY (contoh:
                    2026/2027).
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: 4 Numbered Sections (8 cols) */}
        <div className='lg:col-span-8 space-y-6'>
          {/* IDENTITAS UTAMA */}
          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-6 relative overflow-hidden'>
            <CardContent className='p-0 space-y-5'>
              <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs shrink-0'>
                  01
                </div>
                <div>
                  <h3 className='font-black text-sm uppercase text-slate-900 tracking-wide'>
                    IDENTITAS UTAMA
                  </h3>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    Nama lengkap dan nomor induk registrasi resmi peserta didik.
                  </p>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='space-y-1.5'>
                  <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    NAMA LENGKAP SISWA <span className='text-rose-500'>*</span>
                  </Label>
                  <Input
                    required
                    placeholder='Ahmad Ainur Rozikin'
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      NISN (NOMOR INDUK SISWA NASIONAL)
                    </Label>
                    <Input
                      placeholder='0123456789'
                      maxLength={10}
                      value={formData.nisn}
                      onChange={(e) =>
                        setFormData({ ...formData, nisn: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      NIS (NOMOR INDUK SISWA LOKAL){' '}
                      <span className='text-rose-500'>*</span>
                    </Label>
                    <Input
                      required
                      placeholder='23241001'
                      value={formData.nis}
                      onChange={(e) =>
                        setFormData({ ...formData, nis: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      JENIS KELAMIN <span className='text-rose-500'>*</span>
                    </Label>
                    <select
                      value={formData.gender}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gender: e.target.value as 'L' | 'P',
                        })
                      }
                      className='w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 px-3 text-slate-900 outline-none'
                    >
                      <option value='L'>Laki-laki (L)</option>
                      <option value='P'>Perempuan (P)</option>
                    </select>
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      TINGKAT KELAS <span className='text-rose-500'>*</span>
                    </Label>
                    <Input
                      required
                      placeholder={
                        defaultClassName
                          ? `Contoh: ${defaultClassName}`
                          : 'Contoh: 5A'
                      }
                      value={formData.className}
                      onChange={(e) =>
                        setFormData({ ...formData, className: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BIODATA PRIBADI */}
          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-6 relative overflow-hidden'>
            <CardContent className='p-0 space-y-5'>
              <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs shrink-0'>
                  02
                </div>
                <div>
                  <h3 className='font-black text-sm uppercase text-slate-900 tracking-wide'>
                    BIODATA PRIBADI
                  </h3>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    Keterangan domisili, kelahiran, serta kepercayaan peserta
                    didik.
                  </p>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      TEMPAT LAHIR
                    </Label>
                    <Input
                      placeholder='Banyuwangi'
                      value={formData.birthPlace}
                      onChange={(e) =>
                        setFormData({ ...formData, birthPlace: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      TANGGAL LAHIR
                    </Label>
                    <Input
                      type='date'
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    AGAMA
                  </Label>
                  <select
                    value={formData.religion}
                    onChange={(e) =>
                      setFormData({ ...formData, religion: e.target.value })
                    }
                    className='w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 px-3 text-slate-900 outline-none'
                  >
                    <option value='Islam'>Islam</option>
                    <option value='Kristen'>Kristen</option>
                    <option value='Katolik'>Katolik</option>
                    <option value='Hindu'>Hindu</option>
                    <option value='Buddha'>Buddha</option>
                    <option value='Konghucu'>Konghucu</option>
                    <option value='Lainnya'>Lainnya</option>
                  </select>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    ALAMAT LENGKAP SISWA
                  </Label>
                  <textarea
                    rows={3}
                    placeholder='Ketik jalan, RT/RW, nomor rumah, kelurahan, kecamatan, kota/kabupaten serta kode POS...'
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className='w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-900 outline-none transition-all'
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DATA ORANG TUA / WALI */}
          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-6 relative overflow-hidden'>
            <CardContent className='p-0 space-y-5'>
              <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs shrink-0'>
                  03
                </div>
                <div>
                  <h3 className='font-black text-sm uppercase text-slate-900 tracking-wide'>
                    DATA ORANG TUA / WALI
                  </h3>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    Nama lengkap serta pekerjaan wali/orang tua siswa.
                  </p>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      NAMA AYAH KANDUNG
                    </Label>
                    <Input
                      placeholder='Budi Santoso'
                      value={formData.fatherName}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherName: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      PEKERJAAN AYAH
                    </Label>
                    <Input
                      placeholder='Karyawan Swasta'
                      value={formData.fatherJob}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherJob: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      NAMA IBU KANDUNG
                    </Label>
                    <Input
                      placeholder='Siti Aminah'
                      value={formData.motherName}
                      onChange={(e) =>
                        setFormData({ ...formData, motherName: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      PEKERJAAN IBU
                    </Label>
                    <Input
                      placeholder='Ibu Rumah Tangga'
                      value={formData.motherJob}
                      onChange={(e) =>
                        setFormData({ ...formData, motherJob: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      NAMA WALI SISWA (OPSIONAL)
                    </Label>
                    <Input
                      placeholder='Tidak Ada / Nama Wali'
                      value={formData.guardianName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianName: e.target.value,
                        })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      PEKERJAAN WALI (OPSIONAL)
                    </Label>
                    <Input
                      placeholder='Pekerjaan Wali'
                      value={formData.guardianJob}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guardianJob: e.target.value,
                        })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIWAYAT MASUK / MUTASI */}
          <Card className='bg-white border-slate-200/80 shadow-xs rounded-2xl p-6 relative overflow-hidden'>
            <CardContent className='p-0 space-y-5'>
              <div className='flex items-center gap-3 border-b border-slate-100 pb-4'>
                <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs shrink-0'>
                  04
                </div>
                <div>
                  <h3 className='font-black text-sm uppercase text-slate-900 tracking-wide'>
                    RIWAYAT MASUK / MUTASI
                  </h3>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    Histori asal sekolah dan status akademik siswa saat ini.
                  </p>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      TANGGAL MASUK SEKOLAH
                    </Label>
                    <Input
                      type='date'
                      value={formData.entryDate}
                      onChange={(e) =>
                        setFormData({ ...formData, entryDate: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      DITERIMA DI TINGKAT KELAS
                    </Label>
                    <Input
                      placeholder='Kelas 4'
                      value={formData.entryClass}
                      onChange={(e) =>
                        setFormData({ ...formData, entryClass: e.target.value })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      TAHUN AJARAN PENDAFTARAN
                    </Label>
                    <Input
                      placeholder='2026/2027'
                      value={formData.entryAcademicYear}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          entryAcademicYear: e.target.value,
                        })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                      NAMA SEKOLAH ASAL
                    </Label>
                    <Input
                      placeholder='TK Kartini Jakarta'
                      value={formData.previousSchool}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          previousSchool: e.target.value,
                        })
                      }
                      className='bg-slate-50 border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 text-slate-900'
                    />
                  </div>
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs font-bold text-slate-700 uppercase tracking-wider'>
                    STATUS KEAKTIFAN SISWA
                  </Label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as
                          | 'Aktif'
                          | 'Mutasi'
                          | 'Lulus'
                          | 'Non-Aktif',
                      })
                    }
                    className='w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl text-xs h-10 px-3 text-slate-900 outline-none'
                  >
                    <option value='Aktif'>Aktif</option>
                    <option value='Mutasi'>Mutasi</option>
                    <option value='Lulus'>Lulus</option>
                    <option value='Non-Aktif'>Non-Aktif</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bottom Action Footer Bar */}
          <div className='bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center justify-end gap-3 shadow-xs'>
            <Link href='/siswa'>
              <Button
                type='button'
                variant='ghost'
                className='text-slate-600 hover:bg-slate-100 text-xs font-bold rounded-xl h-10 px-5'
              >
                Batal
              </Button>
            </Link>
            <Button
              type='submit'
              disabled={saveMutation.isPending}
              className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-6 gap-2 shadow-xs cursor-pointer'
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className='h-4 w-4' />
                  <span>Simpan Detail Biodata</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
