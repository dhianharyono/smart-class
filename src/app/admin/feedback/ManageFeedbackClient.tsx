'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminFeedbacks,
  getAdminFeedbackStats,
  respondToFeedback,
  adminDeleteFeedback,
} from '@/actions/feedbackActions';
import { toast } from 'sonner';
import {
  MessageSquareText,
  Trash2,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Star,
  MessageSquareQuote,
  Inbox,
  HelpCircle,
  Bug,
  Lightbulb,
  AlertCircle,
  Send,
  School as SchoolIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
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

interface StatsData {
  total: number;
  pending: number;
  diproses: number;
  selesai: number;
}

interface ManageFeedbackClientProps {
  initialFeedbacks: FeedbackItem[];
  initialStats: StatsData;
}

export default function ManageFeedbackClient({
  initialFeedbacks,
  initialStats,
}: ManageFeedbackClientProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Response Modal State
  const [respondingItem, setRespondingItem] = useState<FeedbackItem | null>(null);
  const [responseStatus, setResponseStatus] = useState<'Pending' | 'Diproses' | 'Selesai'>('Pending');
  const [adminResponseText, setAdminResponseText] = useState('');

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

  // React Query for Admin Feedbacks
  const { data: feedbacks = initialFeedbacks, isLoading } = useQuery<FeedbackItem[]>({
    queryKey: ['admin-feedbacks', categoryFilter, statusFilter, searchTerm],
    queryFn: async () => {
      return await getAdminFeedbacks({
        category: categoryFilter,
        status: statusFilter,
        search: searchTerm,
      });
    },
    initialData: initialFeedbacks,
  });

  // React Query for Stats
  const { data: stats = initialStats } = useQuery<StatsData>({
    queryKey: ['admin-feedback-stats'],
    queryFn: async () => {
      return await getAdminFeedbackStats();
    },
    initialData: initialStats,
  });

  // Respond Mutation
  const respondMutation = useMutation({
    mutationFn: async (payload: {
      feedbackId: string;
      status: 'Pending' | 'Diproses' | 'Selesai';
      adminResponse?: string;
    }) => {
      const res = await respondToFeedback(payload);
      if (!res.success) throw new Error(res.error || 'Gagal menyimpan tanggapan.');
      return res;
    },
    onSuccess: () => {
      toast.success('Tanggapan berhasil disimpan!');
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback-stats'] });
      setRespondingItem(null);
      setAdminResponseText('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menyimpan tanggapan.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const res = await adminDeleteFeedback(feedbackId);
      if (!res.success) throw new Error(res.error || 'Gagal menghapus masukan.');
      return res;
    },
    onSuccess: () => {
      toast.success('Masukan berhasil dihapus.');
      queryClient.invalidateQueries({ queryKey: ['admin-feedbacks'] });
      queryClient.invalidateQueries({ queryKey: ['admin-feedback-stats'] });
      setDeleteConfirm({ open: false, feedbackId: '', subject: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Gagal menghapus masukan.');
    },
  });

  const openRespondModal = (item: FeedbackItem) => {
    setRespondingItem(item);
    setResponseStatus(item.status === 'Pending' ? 'Pending' : item.status);
    setAdminResponseText(item.adminResponse || '');
  };

  const handleRespondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingItem) return;

    respondMutation.mutate({
      feedbackId: respondingItem._id,
      status: responseStatus,
      adminResponse: adminResponseText.trim(),
    });
  };

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
            Kelola Kritik & Saran
          </h1>
          <p className='text-sm text-slate-500'>
            Kelola, evaluasi, dan berikan tanggapan atas masukan dan saran yang dikirim oleh Wali Kelas.
          </p>
        </div>
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
              <p className='text-xl font-extrabold text-slate-900'>{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white'>
          <CardContent className='p-4 flex items-center gap-3.5'>
            <div className='h-11 w-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border border-amber-100'>
              <Clock className='h-5 w-5' />
            </div>
            <div>
              <p className='text-xs font-medium text-slate-500'>Butuh Tanggapan</p>
              <p className='text-xl font-extrabold text-amber-600'>{stats.pending}</p>
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
              <p className='text-xl font-extrabold text-indigo-600'>{stats.diproses}</p>
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
              <p className='text-xl font-extrabold text-emerald-600'>{stats.selesai}</p>
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
              placeholder='Cari nama guru, sekolah, atau judul masukan...'
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

      {/* Admin Feedbacks List */}
      {isLoading ? (
        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white p-12 text-center'>
          <div className='flex flex-col items-center justify-center gap-3'>
            <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
            <p className='text-sm text-slate-500 font-medium'>Memuat data masukan wali kelas...</p>
          </div>
        </Card>
      ) : feedbacks.length === 0 ? (
        <Card className='rounded-2xl border-slate-200/80 shadow-xs bg-white p-12 text-center'>
          <div className='flex flex-col items-center justify-center gap-3 max-w-md mx-auto'>
            <div className='h-16 w-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100'>
              <MessageSquareText className='h-8 w-8' />
            </div>
            <h3 className='text-base font-extrabold text-slate-900'>Tidak Ada Masukan Ditemukan</h3>
            <p className='text-xs text-slate-500 leading-relaxed'>
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Tidak ada masukan yang sesuai dengan pencarian atau filter yang dipilih.'
                : 'Belum ada kritik dan saran yang masuk dari wali kelas.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className='space-y-4'>
          {feedbacks.map((item) => (
            <Card
              key={item._id}
              className='rounded-2xl border-slate-200/80 shadow-xs bg-white hover:border-emerald-200/80 transition-all duration-200 overflow-hidden'
            >
              <CardContent className='p-5 space-y-4'>
                {/* Header row */}
                <div className='flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3'>
                  <div className='flex items-center gap-3'>
                    <div className='h-9 w-9 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0'>
                      {item.teacherName ? item.teacherName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-bold text-slate-900'>
                          {item.teacherName}
                        </span>
                        <span className='text-[10px] text-slate-400'>
                          ({item.teacherEmail})
                        </span>
                      </div>
                      <div className='flex items-center gap-1.5 text-[11px] text-slate-500 font-medium'>
                        {item.schoolName && (
                          <span className='flex items-center gap-1'>
                            <SchoolIcon className='h-3 w-3 text-slate-400' />
                            {item.schoolName}
                          </span>
                        )}
                        {item.className && <span>• Kelas {item.className}</span>}
                      </div>
                    </div>
                  </div>

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
                </div>

                {/* Content body */}
                <div className='space-y-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <h3 className='text-base font-extrabold text-slate-900 leading-snug'>
                      {item.subject}
                    </h3>
                    <span className='text-[10px] font-medium text-slate-400 shrink-0'>
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className='text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50/70 p-3 rounded-xl border border-slate-100'>
                    {item.content}
                  </p>
                </div>

                {/* Existing Admin Response view */}
                {item.adminResponse && (
                  <div className='p-4 rounded-xl bg-gradient-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200/80 space-y-1.5'>
                    <div className='flex items-center justify-between gap-2 text-xs font-bold text-emerald-800'>
                      <span className='flex items-center gap-1.5'>
                        <MessageSquareQuote className='h-4 w-4 text-emerald-600' />
                        Tanggapan Anda ({item.respondedBy || 'Admin'})
                      </span>
                      {item.respondedAt && (
                        <span className='text-[10px] text-slate-400 font-normal'>
                          {new Date(item.respondedAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-slate-700 font-medium leading-relaxed whitespace-pre-line pl-5'>
                      {item.adminResponse}
                    </p>
                  </div>
                )}

                {/* Action footer */}
                <div className='flex items-center justify-end gap-2 pt-2 border-t border-slate-100'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => openRespondModal(item)}
                    className='h-8 text-xs font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg cursor-pointer gap-1.5'
                  >
                    <MessageSquareText className='h-3.5 w-3.5' />
                    {item.adminResponse ? 'Edit Tanggapan' : 'Tanggapi'}
                  </Button>

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
                    className='h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer gap-1.5'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                    Hapus
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog: Tanggapi Masukan */}
      <Dialog open={!!respondingItem} onOpenChange={(open) => !open && setRespondingItem(null)}>
        {respondingItem && (
          <DialogContent className='max-w-xl rounded-2xl p-6 space-y-4'>
            <DialogHeader>
              <div className='flex items-center gap-2 mb-1'>
                {getCategoryBadge(respondingItem.category)}
                <span className='text-xs font-semibold text-slate-500'>
                  Dari: {respondingItem.teacherName} ({respondingItem.schoolName || 'Smart Class'})
                </span>
              </div>
              <DialogTitle className='text-lg font-extrabold text-slate-900 leading-snug'>
                Tanggapi: {respondingItem.subject}
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-400'>
                Kirim tanggapan atau pembaruan status untuk masukan ini. Tanggapan akan langsung terlihat oleh Wali Kelas.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRespondSubmit} className='space-y-4 py-2'>
              {/* Original Content Preview */}
              <div className='space-y-1'>
                <Label className='text-xs font-bold text-slate-500 uppercase tracking-wider'>
                  Isi Masukan Wali Kelas:
                </Label>
                <div className='p-3 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto border border-slate-200/80 whitespace-pre-line'>
                  {respondingItem.content}
                </div>
              </div>

              {/* Status Select */}
              <div className='space-y-1.5'>
                <Label className='text-xs font-bold text-slate-700'>
                  Status Masukan <span className='text-rose-500'>*</span>
                </Label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value as any)}
                  className='w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer'
                >
                  <option value='Pending'>⏳ Pending (Belum Selesai)</option>
                  <option value='Diproses'>🔄 Diproses (Sedang Ditindaklanjuti)</option>
                  <option value='Selesai'>✅ Selesai (Telah Ditanggapi)</option>
                </select>
              </div>

              {/* Admin Response Textarea */}
              <div className='space-y-1.5'>
                <Label htmlFor='adminResponse' className='text-xs font-bold text-slate-700'>
                  Tanggapan / Catatan Admin
                </Label>
                <textarea
                  id='adminResponse'
                  rows={4}
                  placeholder='Tuliskan penjelasan, solusi, atau ucapan terima kasih kepada wali kelas...'
                  value={adminResponseText}
                  onChange={(e) => setAdminResponseText(e.target.value)}
                  maxLength={2000}
                  className='w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none'
                />
                <div className='flex justify-end'>
                  <span className='text-[10px] text-slate-400'>
                    {adminResponseText.length}/2000 karakter
                  </span>
                </div>
              </div>

              <DialogFooter className='pt-2 gap-2 sm:gap-0'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setRespondingItem(null)}
                  className='rounded-xl text-xs font-semibold cursor-pointer'
                >
                  Batal
                </Button>
                <Button
                  type='submit'
                  disabled={respondMutation.isPending}
                  className='bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer gap-2'
                >
                  {respondMutation.isPending ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Simpan Tanggapan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, feedbackId: '', subject: '' })}
        title='Hapus Masukan'
        description={`Apakah Anda yakin ingin menghapus masukan "${deleteConfirm.subject}"? Data akan dihapus secara permanen.`}
        confirmText='Ya, Hapus'
        cancelText='Batal'
        variant='danger'
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(deleteConfirm.feedbackId)}
      />
    </div>
  );
}
