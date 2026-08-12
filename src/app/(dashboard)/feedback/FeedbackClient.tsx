'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTeacherFeedbacks,
  createFeedback,
  deleteTeacherFeedback,
} from '@/actions/feedbackActions';
import { toast } from 'sonner';
import {
  MessageSquareText,
  Plus,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle,
  Star,
  MessageSquareQuote,
  Filter,
  Send,
  Eye,
  Inbox,
  HelpCircle,
  Bug,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ConfirmDialog from '@/components/ConfirmDialog';

interface FeedbackItem {
  _id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  schoolName?: string;
  className?: string;
  category: 'Kritik' | 'Saran' | 'Laporan Bug' | 'Pertanyaan' | 'Lainnya';
  subject: string;
  content: string;
  rating?: number;
  status: 'Pending' | 'Diproses' | 'Selesai';
  adminResponse?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function FeedbackClient() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal create states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState<'Kritik' | 'Saran' | 'Laporan Bug' | 'Pertanyaan' | 'Lainnya'>('Saran');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState<number>(5);

  // Detail Modal state
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  // Delete Confirm State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    feedbackId: string;
    subject: string;
  }>({
    open: false,
    feedbackId: '',
    subject: '',
  });

  // Fetch feedbacks using React Query
  const { data: feedbacks = [], isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ['teacher-feedbacks'],
    queryFn: async () => {
      return await getTeacherFeedbacks();
    },
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: {
      category: string;
      subject: string;
      content: string;
      rating?: number;
    }) => {
      const res = await createFeedback(payload);
      if (!res.success) throw new Error(res.error || 'Gagal mengirim masukan.');
      return res.feedback;
    },
    onSuccess: () => {
      toast.success('Kritik & Saran Anda berhasil dikirim ke Admin!');
      queryClient.invalidateQueries({ queryKey: ['teacher-feedbacks'] });
      setIsAddOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Terjadi kesalahan saat mengirim.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const res = await deleteTeacherFeedback(feedbackId);
      if (!res.success) throw new Error(res.error || 'Gagal menghapus masukan.');
      return res;
    },
    onSuccess: () => {
      toast.success('Masukan berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['teacher-feedbacks'] });
      setDeleteConfirm({ open: false, feedbackId: '', subject: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus masukan.');
    },
  });

  const resetForm = () => {
    setCategory('Saran');
    setSubject('');
    setContent('');
    setRating(5);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error('Judul masukan wajib diisi.');
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      toast.error('Isi masukan minimal 10 karakter.');
      return;
    }

    createMutation.mutate({
      category,
      subject: subject.trim(),
      content: content.trim(),
      rating,
    });
  };

  // Filtered List
  const filteredFeedbacks = feedbacks.filter((item) => {
    const matchesSearch =
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats calculation
  const totalCount = feedbacks.length;
  const pendingCount = feedbacks.filter((f) => f.status === 'Pending').length;
  const diprosesCount = feedbacks.filter((f) => f.status === 'Diproses').length;
  const selesaiCount = feedbacks.filter((f) => f.status === 'Selesai').length;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Kritik':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200'>
            <AlertCircle className='h-3 w-3' />
            Kritik
          </span>
        );
      case 'Saran':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200'>
            <Lightbulb className='h-3 w-3' />
            Saran
          </span>
        );
      case 'Laporan Bug':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200'>
            <Bug className='h-3 w-3' />
            Laporan Bug
          </span>
        );
      case 'Pertanyaan':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200'>
            <HelpCircle className='h-3 w-3' />
            Pertanyaan
          </span>
        );
      default:
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200'>
            <MessageSquareText className='h-3 w-3' />
            {cat}
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200'>
            <Clock className='h-3 w-3 animate-pulse' />
            Pending
          </span>
        );
      case 'Diproses':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200'>
            <Loader2 className='h-3 w-3 animate-spin' />
            Diproses
          </span>
        );
      case 'Selesai':
        return (
          <span className='inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200'>
            <CheckCircle2 className='h-3 w-3 text-emerald-600' />
            Selesai
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className='space-y-6 pb-12'>
      {/* Page Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-extrabold text-slate-900 tracking-tight'>
            Kritik & Saran
          </h1>
          <p className='text-sm text-slate-500'>
            Kirim masukan, kendala, atau saran pengembangan fitur aplikasi Smart Class langsung ke Administrator.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-md shadow-emerald-500/20 rounded-xl flex items-center gap-2 cursor-pointer transition-all duration-200 shrink-0'
        >
          <Plus className='h-4 w-4' />
          Kirim Masukan Baru
        </Button>
      </div>

      {/* Stats Summary Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0'>
              <Inbox className='h-5 w-5' />
            </div>
            <div>
              <p className='text-xs font-medium text-slate-500'>Total Masukan</p>
              <p className='text-xl font-extrabold text-slate-900'>{totalCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100'>
              <Clock className='h-5 w-5' />
            </div>
            <div>
              <p className='text-xs font-medium text-slate-500'>Menunggu Tanggapan</p>
              <p className='text-xl font-extrabold text-amber-600'>{pendingCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100'>
              <Loader2 className='h-5 w-5' />
            </div>
            <div>
              <p className='text-xs font-medium text-slate-500'>Sedang Diproses</p>
              <p className='text-xl font-extrabold text-indigo-600'>{diprosesCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='h-11 w-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100'>
              <CheckCircle2 className='h-5 w-5' />
            </div>
            <div>
              <p className='text-xs font-medium text-slate-500'>Selesai</p>
              <p className='text-xl font-extrabold text-emerald-600'>{selesaiCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white overflow-hidden'>
        <CardContent className='p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4'>
          {/* Search */}
          <div className='relative flex-1'>
            <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
            <Input
              type='text'
              placeholder='Cari judul atau isi masukan...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10 h-10 rounded-xl border-slate-200 text-sm focus-visible:ring-emerald-500'
            />
          </div>

          {/* Filters */}
          <div className='flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0'>
            {/* Category select */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className='h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer'
            >
              <option value='all'>Semua Kategori</option>
              <option value='Kritik'>Kritik</option>
              <option value='Saran'>Saran</option>
              <option value='Laporan Bug'>Laporan Bug</option>
              <option value='Pertanyaan'>Pertanyaan</option>
              <option value='Lainnya'>Lainnya</option>
            </select>

            {/* Status select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer'
            >
              <option value='all'>Semua Status</option>
              <option value='Pending'>Pending</option>
              <option value='Diproses'>Diproses</option>
              <option value='Selesai'>Selesai</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Main Feedback List */}
      {isLoading ? (
        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white p-12 text-center'>
          <div className='flex flex-col items-center justify-center gap-3'>
            <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
            <p className='text-sm text-slate-500 font-medium'>Memuat daftar kritik & saran...</p>
          </div>
        </Card>
      ) : filteredFeedbacks.length === 0 ? (
        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white p-12 text-center'>
          <div className='flex flex-col items-center justify-center gap-3 max-w-md mx-auto'>
            <div className='h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100'>
              <MessageSquareText className='h-8 w-8' />
            </div>
            <h3 className='text-base font-extrabold text-slate-900'>Belum Ada Masukan</h3>
            <p className='text-xs text-slate-500 leading-relaxed'>
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Tidak ada kritik dan saran yang cocok dengan kata kunci atau filter yang Anda pilih.'
                : 'Anda belum mengirim kritik atau saran. Suara dan pandangan Anda sangat berharga untuk membuat aplikasi Smart Class lebih sempurna!'}
            </p>
            {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
              <Button
                onClick={() => setIsAddOpen(true)}
                className='mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-2'
              >
                <Plus className='h-4 w-4' />
                Kirim Masukan Pertama
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className='space-y-4'>
          {filteredFeedbacks.map((item) => (
            <Card
              key={item._id}
              className='rounded-2xl border-slate-200/80 shadow-xs bg-white hover:border-emerald-200/80 transition-all duration-200 overflow-hidden'
            >
              <CardContent className='p-5 space-y-4'>
                {/* Header row */}
                <div className='flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    {getCategoryBadge(item.category)}
                    {getStatusBadge(item.status)}
                    {item.rating && (
                      <div className='flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-amber-700 text-xs font-bold'>
                        <Star className='h-3 w-3 fill-amber-400 text-amber-400' />
                        <span>{item.rating}/5</span>
                      </div>
                    )}
                  </div>
                  <span className='text-[11px] font-medium text-slate-400'>
                    {new Date(item.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Content body */}
                <div className='space-y-2'>
                  <h3 className='text-base font-extrabold text-slate-900 leading-snug'>
                    {item.subject}
                  </h3>
                  <p className='text-sm text-slate-600 leading-relaxed whitespace-pre-line line-clamp-4'>
                    {item.content}
                  </p>
                </div>

                {/* Admin Response Section if available */}
                {item.adminResponse && (
                  <div className='mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 space-y-2'>
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2 text-emerald-800 font-bold text-xs'>
                        <MessageSquareQuote className='h-4 w-4 text-emerald-600' />
                        <span>Tanggapan Administrator ({item.respondedBy || 'Admin'})</span>
                      </div>
                      {item.respondedAt && (
                        <span className='text-[10px] text-slate-400 font-medium'>
                          {new Date(item.respondedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line pl-6'>
                      {item.adminResponse}
                    </p>
                  </div>
                )}

                {/* Action footer */}
                <div className='flex items-center justify-between pt-2 text-xs border-t border-slate-100'>
                  <div className='text-slate-400 font-medium text-[11px]'>
                    {item.schoolName && <span>{item.schoolName}</span>}
                    {item.className && <span> • Kelas {item.className}</span>}
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setSelectedFeedback(item)}
                      className='h-8 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer'
                    >
                      <Eye className='h-3.5 w-3.5 mr-1.5' />
                      Lihat Detail
                    </Button>

                    {item.status === 'Pending' && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          setDeleteConfirm({
                            open: true,
                            feedbackId: item._id,
                            subject: item.subject,
                          })
                        }
                        className='h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer'
                      >
                        <Trash2 className='h-3.5 w-3.5 mr-1.5' />
                        Hapus
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog: Kirim Kritik & Saran Baru */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className='max-w-lg rounded-2xl p-6'>
          <DialogHeader>
            <DialogTitle className='text-lg font-extrabold text-slate-900 flex items-center gap-2'>
              Kirim Kritik & Saran
            </DialogTitle>
            <DialogDescription className='text-xs text-slate-500'>
              Berikan pendapat, ide, kritik membangun, atau laporkan kendala yang Anda alami saat menggunakan Smart Class.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className='space-y-4 py-2'>
            {/* Category Select */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-bold text-slate-700'>
                Kategori Masukan <span className='text-rose-500'>*</span>
              </Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className='w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer'
              >
                <option value='Saran'>💡 Saran - Usulan fitur atau perbaikan</option>
                <option value='Kritik'>⚠️ Kritik - Masukan terhadap alur/tampilan</option>
                <option value='Laporan Bug'>🐛 Laporan Bug - Kendala teknis/error</option>
                <option value='Pertanyaan'>❓ Pertanyaan - Kendala penggunaan</option>
                <option value='Lainnya'>📝 Lainnya</option>
              </select>
            </div>

            {/* Rating Stars */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-bold text-slate-700'>
                Tingkat Kepuasan Penggunaan Smart Class
              </Label>
              <div className='flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200/80'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type='button'
                    onClick={() => setRating(star)}
                    className='p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer'
                  >
                    <Star
                      className={`h-6 w-6 ${star <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 fill-slate-100'
                        }`}
                    />
                  </button>
                ))}
                <span className='ml-auto text-xs font-bold text-slate-600'>
                  {rating === 5 && 'Sangat Puas'}
                  {rating === 4 && 'Puas'}
                  {rating === 3 && 'Cukup'}
                  {rating === 2 && 'Kurang'}
                  {rating === 1 && 'Kecewa'}
                </span>
              </div>
            </div>

            {/* Subject */}
            <div className='space-y-1.5'>
              <Label htmlFor='subject' className='text-xs font-bold text-slate-700'>
                Judul Masukan <span className='text-rose-500'>*</span>
              </Label>
              <Input
                id='subject'
                type='text'
                placeholder='Contoh: Usulan penambahan fitur ekspor rekap absensi per bulan'
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={150}
                className='h-10 rounded-xl border-slate-200 text-xs focus-visible:ring-emerald-500'
              />
            </div>

            {/* Content */}
            <div className='space-y-1.5'>
              <Label htmlFor='content' className='text-xs font-bold text-slate-700'>
                Detail Kritik & Saran <span className='text-rose-500'>*</span>
              </Label>
              <textarea
                id='content'
                rows={5}
                placeholder='Jelaskan secara rinci kritik, saran, atau langkah-langkah kendala yang Anda alami...'
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={2000}
                className='w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none'
              />
              <div className='flex justify-end'>
                <span className='text-[10px] text-slate-400'>
                  {content.length}/2000 karakter
                </span>
              </div>
            </div>

            <DialogFooter className='pt-2 gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAddOpen(false)}
                className='rounded-xl text-xs font-semibold cursor-pointer'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={createMutation.isPending}
                className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer gap-2'
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Mengirim...
                  </>
                ) : (
                  <>
                    Kirim Sekarang
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Detail Feedback */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
        {selectedFeedback && (
          <DialogContent className='max-w-xl rounded-2xl p-6 space-y-4'>
            <DialogHeader>
              <div className='flex items-center gap-2 mb-1'>
                {getCategoryBadge(selectedFeedback.category)}
                {getStatusBadge(selectedFeedback.status)}
              </div>
              <DialogTitle className='text-lg font-extrabold text-slate-900 leading-snug'>
                {selectedFeedback.subject}
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-400'>
                Dikirim pada{' '}
                {new Date(selectedFeedback.createdAt).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </DialogDescription>
            </DialogHeader>

            {/* Content view */}
            <div className='space-y-3 py-2 border-y border-slate-100'>
              {selectedFeedback.rating && (
                <div className='flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl w-fit border border-amber-200'>
                  <span>Penilaian Kepuasan:</span>
                  <div className='flex items-center ml-1'>
                    {[...Array(selectedFeedback.rating)].map((_, i) => (
                      <Star key={i} className='h-3.5 w-3.5 fill-amber-400 text-amber-400' />
                    ))}
                  </div>
                </div>
              )}

              <div className='space-y-1'>
                <p className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                  Isi Masukan:
                </p>
                <div className='p-3.5 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed whitespace-pre-line border border-slate-200/80 max-h-60 overflow-y-auto'>
                  {selectedFeedback.content}
                </div>
              </div>

              {/* Admin Response section inside modal */}
              {selectedFeedback.adminResponse ? (
                <div className='space-y-1.5 pt-2'>
                  <p className='text-xs font-bold text-emerald-800 flex items-center gap-1.5'>
                    <MessageSquareQuote className='h-4 w-4 text-emerald-600' />
                    Tanggapan dari Admin ({selectedFeedback.respondedBy || 'Administrator'})
                  </p>
                  <div className='p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line'>
                    {selectedFeedback.adminResponse}
                  </div>
                </div>
              ) : (
                <div className='p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-800 flex items-center gap-2'>
                  <Clock className='h-4 w-4 text-amber-600 shrink-0' />
                  <span>Masukan Anda sedang menunggu tanggapan atau evaluasi dari Admin.</span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setSelectedFeedback(null)}
                className='rounded-xl text-xs font-semibold cursor-pointer w-full sm:w-auto'
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, feedbackId: '', subject: '' })}
        title='Hapus Masukan'
        description={`Apakah Anda yakin ingin menghapus masukan "${deleteConfirm.subject}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText='Ya, Hapus'
        cancelText='Batal'
        variant='danger'
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.feedbackId)}
      />
    </div>
  );
}
