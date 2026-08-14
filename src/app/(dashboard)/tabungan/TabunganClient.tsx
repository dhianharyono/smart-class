'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Loader2,
  Plus,
  History,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  getSavingsSummary,
  getStudentLedger,
  addTransaction,
} from '@/actions/savingActions';
import { exportSavingsToExcel } from '@/lib/excelExport';

interface SavingsRow {
  studentId: string;
  name: string;
  nis: string;
  className: string;
  balance: number;
  transactionsCount: number;
}

export default function TabunganClient() {
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );

  // Dialog Open States
  const [txOpen, setTxOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Transaction Form States
  const [txForm, setTxForm] = useState({
    studentId: '',
    type: 'Kredit' as 'Kredit' | 'Debit',
    amount: '',
    description: '',
  });

  // Fetch savings summaries
  const {
    data: summaries,
    isLoading: isSummaryLoading,
    isError,
  } = useQuery<SavingsRow[]>({
    queryKey: ['savingsSummary'],
    queryFn: () => getSavingsSummary(),
  });

  // Fetch ledger for selected student
  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['studentLedger', selectedStudentId],
    queryFn: () => getStudentLedger(selectedStudentId!),
    enabled: !!selectedStudentId && ledgerOpen,
  });

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const handleTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.studentId || !txForm.amount) {
      toast.error('Siswa dan Nominal wajib diisi!');
      return;
    }

    const amountVal = Number(txForm.amount);
    if (amountVal <= 0 || isNaN(amountVal)) {
      toast.error('Nominal harus lebih dari 0.');
      return;
    }

    startTransition(async () => {
      try {
        await addTransaction({
          studentId: txForm.studentId,
          type: txForm.type,
          amount: amountVal,
          description: txForm.description || undefined,
        });

        // Invalidate caching
        queryClient.invalidateQueries({ queryKey: ['savingsSummary'] });
        if (selectedStudentId === txForm.studentId) {
          queryClient.invalidateQueries({
            queryKey: ['studentLedger', selectedStudentId],
          });
        }

        toast.success(`Transaksi berhasil disimpan!`);
        setTxOpen(false);
        setTxForm({
          studentId: '',
          type: 'Kredit',
          amount: '',
          description: '',
        });
      } catch (err: any) {
        toast.error(err.message || 'Gagal menyimpan transaksi.');
      }
    });
  };

  const openTxDialog = (studentId: string) => {
    setTxForm({
      studentId,
      type: 'Kredit',
      amount: '',
      description: '',
    });
    setTxOpen(true);
  };

  const openLedgerDialog = (studentId: string) => {
    setSelectedStudentId(studentId);
    setLedgerOpen(true);
  };

  const handleExcelExport = async () => {
    if (!summaries || summaries.length === 0) {
      toast.error('Tidak ada data tabungan untuk diekspor!');
      return;
    }
    toast.promise(exportSavingsToExcel(summaries), {
      loading: 'Menyusun laporan Excel tabungan...',
      success: 'Excel tabungan berhasil diunduh!',
      error: 'Gagal mengunduh Excel.',
    });
  };

  // Find active student name for transaction helper
  const activeStudentName =
    summaries?.find((s) => s.studentId === txForm.studentId)?.name || '';

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900'>
            Tabungan Siswa
          </h2>
          <p className='text-slate-600 text-xs sm:text-sm mt-1'>
            Pantau tabungan siswa, catat setoran (Kredit), penarikan (Debit),
            dan riwayat mutasi dana.
          </p>
        </div>

        <div className='grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto'>
          <Button
            onClick={handleExcelExport}
            variant='outline'
            className='border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl h-10 px-3.5 sm:px-4 gap-2 shadow-xs w-full sm:w-auto justify-center'
          >
            <Download className='h-4 w-4' />
            Ekspor Excel
          </Button>
          <Button
            onClick={() => {
              if (summaries && summaries.length > 0) {
                openTxDialog(summaries[0].studentId);
              } else {
                toast.error('Tambahkan data siswa terlebih dahulu!');
              }
            }}
            className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl h-10 px-3.5 sm:px-4 gap-2 shadow-xs w-full sm:w-auto justify-center'
          >
            <Plus className='h-4 w-4' />
            Transaksi Baru
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className='bg-white border-slate-200/80 rounded-2xl overflow-hidden shadow-xs'>
        <CardContent className='p-0'>
          {isSummaryLoading ? (
            <div className='flex flex-col items-center justify-center py-20 text-slate-500 text-sm'>
              <Loader2 className='h-8 w-8 animate-spin text-emerald-600 mb-3' />
              <span>Memuat ringkasan tabungan...</span>
            </div>
          ) : isError ? (
            <div className='text-center py-20 text-rose-600 text-sm font-medium'>
              Gagal memuat ringkasan tabungan kelas.
            </div>
          ) : summaries && summaries.length > 0 ? (
            <Table>
              <TableHeader className='bg-slate-50/80 border-b border-slate-200'>
                <TableRow className='border-b border-slate-200 hover:bg-transparent'>
                  <TableHead className='w-12 text-center text-slate-700 font-bold'>
                    No
                  </TableHead>
                  <TableHead className='w-32 text-slate-700 font-bold'>
                    NIS
                  </TableHead>
                  <TableHead className='text-slate-700 font-bold'>
                    Nama Lengkap
                  </TableHead>
                  <TableHead className='w-24 text-slate-700 font-bold'>
                    Kelas
                  </TableHead>
                  <TableHead className='w-32 text-center text-slate-700 font-bold'>
                    Mutasi
                  </TableHead>
                  <TableHead className='w-48 text-slate-700 font-bold'>
                    Saldo Saat Ini
                  </TableHead>
                  <TableHead className='w-40 text-center text-slate-700 font-bold'>
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((row, index) => (
                  <TableRow
                    key={row.studentId}
                    className='border-b border-slate-100 hover:bg-slate-50/80 text-slate-700 transition-colors'
                  >
                    <TableCell className='text-center font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono font-medium'>
                      {row.nis}
                    </TableCell>
                    <TableCell className='font-bold text-slate-900'>
                      {row.name}
                    </TableCell>
                    <TableCell className='font-medium'>
                      {row.className}
                    </TableCell>
                    <TableCell className='text-center'>
                      <span className='text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full'>
                        {row.transactionsCount} kali
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          row.balance > 0
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {formatIDR(row.balance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-center gap-2'>
                        <Button
                          onClick={() => openLedgerDialog(row.studentId)}
                          variant='ghost'
                          size='sm'
                          className='h-8 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl px-2.5 gap-1.5'
                        >
                          <History className='h-3.5 w-3.5' />
                          Riwayat
                        </Button>
                        <Button
                          onClick={() => openTxDialog(row.studentId)}
                          variant='ghost'
                          size='sm'
                          className='h-8 text-xs font-semibold text-emerald-700 hover:text-white hover:bg-emerald-600 border border-emerald-200 rounded-xl px-2.5 gap-1.5'
                        >
                          <Plus className='h-3.5 w-3.5' />
                          Tambah
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className='flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center text-slate-500 max-w-md mx-auto space-y-3'>
              <div className='h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 shadow-xs'>
                <Wallet className='h-7 w-7' />
              </div>
              <div>
                <p className='text-base font-extrabold text-slate-900 tracking-tight'>
                  Tidak ada siswa terdaftar di kelas.
                </p>
                <p className='text-xs text-slate-500 mt-1 font-medium leading-relaxed'>
                  Silakan tambahkan siswa terlebih dahulu di halaman Data Siswa.
                </p>
              </div>
              <Link href='/siswa'>
                <Button className='bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-10 px-5 gap-2 shadow-xs cursor-pointer mt-1'>
                  <Plus className='h-4 w-4' />
                  <span>Input Data Siswa Sekarang</span>
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-sm p-5 sm:p-6 shadow-2xl'>
          <form onSubmit={handleTxSubmit}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold text-slate-900'>
                Catat Transaksi Baru
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-500'>
                Log pencatatan tabungan siswa.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              {/* Student name display */}
              <div className='space-y-1'>
                <span className='text-[10px] text-slate-500 font-bold uppercase tracking-wider block'>
                  Siswa Penerima
                </span>
                <span className='text-sm font-bold text-slate-800 block bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl'>
                  {activeStudentName}
                </span>
              </div>

              {/* Transaction Type */}
              <div className='space-y-1.5'>
                <Label className='text-slate-700 text-sm font-semibold'>
                  Jenis Transaksi
                </Label>
                <Select
                  value={txForm.type}
                  onValueChange={(val) =>
                    val &&
                    setTxForm({ ...txForm, type: val as 'Kredit' | 'Debit' })
                  }
                >
                  <SelectTrigger className='bg-slate-50 border-slate-200 text-slate-900 rounded-xl'>
                    <SelectValue placeholder='Pilih jenis' />
                  </SelectTrigger>
                  <SelectContent className='bg-white border-slate-200 text-slate-900 rounded-xl'>
                    <SelectItem value='Kredit'>
                      Kredit / Kas Masuk (Setoran)
                    </SelectItem>
                    <SelectItem value='Debit'>
                      Debit / Kas Keluar (Penarikan)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nominal Amount */}
              <div className='space-y-1.5'>
                <Label
                  htmlFor='amount'
                  className='text-slate-700 text-sm font-semibold'
                >
                  Nominal Uang (Rupiah)
                </Label>
                <Input
                  id='amount'
                  type='number'
                  required
                  placeholder='Contoh: 10000'
                  value={txForm.amount}
                  onChange={(e) =>
                    setTxForm({ ...txForm, amount: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                />
              </div>

              {/* Description */}
              <div className='space-y-1.5'>
                <Label
                  htmlFor='description'
                  className='text-slate-700 text-sm font-semibold'
                >
                  Keterangan / Catatan
                </Label>
                <Input
                  id='description'
                  placeholder='Contoh: Uang kas minggu ke-2, Jajan'
                  value={txForm.description}
                  onChange={(e) =>
                    setTxForm({ ...txForm, description: e.target.value })
                  }
                  className='bg-slate-50 border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl'
                />
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setTxOpen(false)}
                className='text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl px-4 gap-2 shadow-xs'
              >
                {isPending ? (
                  <Loader2 className='h-4 w-4 animate-spin' />
                ) : (
                  'Catat Transaksi'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ledger History Dialog */}
      <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
        <DialogContent className='bg-white border border-slate-200 text-slate-900 rounded-2xl max-w-lg max-h-[85vh] flex flex-col p-6 shadow-2xl'>
          <DialogHeader className='pb-4 border-b border-slate-200'>
            <DialogTitle className='text-lg font-bold text-slate-900 flex items-center gap-2'>
              <History className='h-5 w-5 text-emerald-600' />
              Riwayat Tabungan Siswa
            </DialogTitle>
            <DialogDescription className='text-xs text-slate-500'>
              {ledgerData
                ? `${ledgerData.studentName} (NIS: ${ledgerData.studentNis})`
                : 'Memuat data siswa...'}
            </DialogDescription>
          </DialogHeader>

          {/* Ledger Content */}
          <div className='flex-1 overflow-y-auto py-4 space-y-3'>
            {isLedgerLoading ? (
              <div className='flex flex-col items-center justify-center py-12 text-slate-500'>
                <Loader2 className='h-6 w-6 animate-spin text-emerald-600 mb-2' />
                <span className='text-xs'>Memuat mutasi kas...</span>
              </div>
            ) : ledgerData && ledgerData.ledger.length > 0 ? (
              <div className='space-y-2'>
                {ledgerData.ledger.map((tx: any) => {
                  const isKredit = tx.type === 'Kredit';
                  return (
                    <div
                      key={tx._id}
                      className='flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl'
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={`p-2 rounded-xl border ${
                            isKredit
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isKredit ? (
                            <ArrowUpRight className='h-4 w-4' />
                          ) : (
                            <ArrowDownRight className='h-4 w-4' />
                          )}
                        </div>
                        <div>
                          <span className='text-xs font-bold text-slate-800 block'>
                            {isKredit
                              ? 'Setoran (Kredit)'
                              : 'Penarikan (Debit)'}
                          </span>
                          <span className='text-[10px] text-slate-500 block'>
                            {new Date(tx.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {tx.description && (
                            <span className='text-[10px] italic text-slate-500 block mt-1'>
                              "{tx.description}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='text-right'>
                        <span
                          className={`text-sm font-extrabold ${
                            isKredit ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isKredit ? '+' : '-'} {formatIDR(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='text-center py-12 text-slate-400 text-xs'>
                Siswa ini belum memiliki transaksi tabungan.
              </div>
            )}
          </div>

          <DialogFooter className='pt-4 border-t border-slate-200'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setLedgerOpen(false)}
              className='border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl w-full'
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
