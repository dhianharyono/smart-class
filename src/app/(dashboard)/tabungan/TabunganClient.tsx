'use client';

import React, { useState, useTransition } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  Loader2,
  Plus,
  History,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  User,
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
      toast.error('Tidak ada data jurnal untuk diekspor!');
      return;
    }
    toast.promise(exportSavingsToExcel(summaries), {
      loading: 'Menyusun laporan Excel jurnal...',
      success: 'Excel jurnal berhasil diunduh!',
      error: 'Gagal mengunduh Excel.',
    });
  };

  // Find active student name for transaction helper
  const activeStudentName =
    summaries?.find((s) => s.studentId === txForm.studentId)?.name || '';

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent'>
            Jurnal Siswa
          </h2>
          <p className='text-zinc-400 text-sm'>
            Pantau jurnal siswa, catat setoran (Kredit), penarikan (Debit), dan
            riwayat mutasi dana.
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            onClick={handleExcelExport}
            variant='outline'
            className='border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 font-medium rounded-xl h-10 px-4 gap-2'
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
            className='bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl h-10 px-4 gap-2'
          >
            <Plus className='h-4 w-4' />
            Transaksi Baru
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <Card className='bg-zinc-900/30 border-zinc-900 rounded-2xl overflow-hidden shadow-xl'>
        <CardContent className='p-0'>
          {isSummaryLoading ? (
            <div className='flex flex-col items-center justify-center py-20 text-zinc-500 text-sm'>
              <Loader2 className='h-8 w-8 animate-spin text-emerald-500 mb-3' />
              <span>Memuat ringkasan jurnal...</span>
            </div>
          ) : isError ? (
            <div className='text-center py-20 text-red-400 text-sm'>
              Gagal memuat ringkasan jurnal kelas.
            </div>
          ) : summaries && summaries.length > 0 ? (
            <Table>
              <TableHeader className='bg-zinc-900/50 border-b border-zinc-800'>
                <TableRow className='border-b border-zinc-800 hover:bg-transparent'>
                  <TableHead className='w-12 text-center text-zinc-400 font-bold'>
                    No
                  </TableHead>
                  <TableHead className='w-32 text-zinc-400 font-bold'>
                    NIS
                  </TableHead>
                  <TableHead className='text-zinc-400 font-bold'>
                    Nama Lengkap
                  </TableHead>
                  <TableHead className='w-24 text-zinc-400 font-bold'>
                    Kelas
                  </TableHead>
                  <TableHead className='w-32 text-center text-zinc-400 font-bold'>
                    Mutasi
                  </TableHead>
                  <TableHead className='w-48 text-zinc-400 font-bold'>
                    Saldo Saat Ini
                  </TableHead>
                  <TableHead className='w-40 text-center text-zinc-400 font-bold'>
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.map((row, index) => (
                  <TableRow
                    key={row.studentId}
                    className='border-b border-zinc-900 hover:bg-zinc-900/20 text-zinc-300'
                  >
                    <TableCell className='text-center font-medium'>
                      {index + 1}
                    </TableCell>
                    <TableCell className='font-mono'>{row.nis}</TableCell>
                    <TableCell className='font-semibold text-zinc-200'>
                      {row.name}
                    </TableCell>
                    <TableCell>{row.className}</TableCell>
                    <TableCell className='text-center'>
                      <span className='text-xs text-zinc-400 bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded-full'>
                        {row.transactionsCount} kali
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-bold ${
                          row.balance > 0 ? 'text-emerald-400' : 'text-zinc-500'
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
                          className='h-8 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-850 rounded-xl px-2.5 gap-1.5'
                        >
                          <History className='h-3.5 w-3.5' />
                          Riwayat
                        </Button>
                        <Button
                          onClick={() => openTxDialog(row.studentId)}
                          variant='ghost'
                          size='sm'
                          className='h-8 text-xs font-semibold text-emerald-400 hover:text-white hover:bg-emerald-600 hover:border-emerald-600 border border-emerald-950/65 rounded-xl px-2.5 gap-1.5'
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
            <div className='flex flex-col items-center justify-center py-20 text-zinc-500'>
              <Wallet className='h-10 w-10 text-zinc-700 mb-2' />
              <p className='text-sm font-semibold'>
                Tidak ada siswa terdaftar di kelas.
              </p>
              <p className='text-xs text-zinc-650'>
                Silakan tambahkan siswa terlebih dahulu di halaman Data Siswa.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={txOpen} onOpenChange={setTxOpen}>
        <DialogContent className='bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-sm'>
          <form onSubmit={handleTxSubmit}>
            <DialogHeader>
              <DialogTitle className='text-lg font-bold text-zinc-100'>
                Catat Transaksi Baru
              </DialogTitle>
              <DialogDescription className='text-xs text-zinc-400'>
                Log pencatatanjurnal siswa.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              {/* Student name display */}
              <div className='space-y-1'>
                <span className='text-[10px] text-zinc-500 font-bold uppercase tracking-wider block'>
                  Siswa Penerima
                </span>
                <span className='text-sm font-semibold text-zinc-200 block bg-zinc-950 border border-zinc-850 px-3 py-2 rounded-xl'>
                  {activeStudentName}
                </span>
              </div>

              {/* Transaction Type */}
              <div className='space-y-1.5'>
                <Label className='text-zinc-300 text-sm font-semibold'>
                  Jenis Transaksi
                </Label>
                <Select
                  value={txForm.type}
                  onValueChange={(val) =>
                    val &&
                    setTxForm({ ...txForm, type: val as 'Kredit' | 'Debit' })
                  }
                >
                  <SelectTrigger className='bg-zinc-950 border-zinc-800 text-white rounded-xl'>
                    <SelectValue placeholder='Pilih jenis' />
                  </SelectTrigger>
                  <SelectContent className='bg-zinc-900 border-zinc-800 text-white rounded-xl'>
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
                  className='text-zinc-300 text-sm font-semibold'
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
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'
                />
              </div>

              {/* Description */}
              <div className='space-y-1.5'>
                <Label
                  htmlFor='description'
                  className='text-zinc-300 text-sm font-semibold'
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
                  className='bg-zinc-950 border-zinc-800 focus:border-emerald-500 text-white rounded-xl'
                />
              </div>
            </div>

            <DialogFooter className='gap-2 sm:gap-0'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setTxOpen(false)}
                className='text-zinc-400 hover:text-zinc-200'
              >
                Batal
              </Button>
              <Button
                type='submit'
                disabled={isPending}
                className='bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl px-4 gap-2'
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
        <DialogContent className='bg-zinc-900 border border-zinc-800 text-white rounded-2xl max-w-lg max-h-[85vh] flex flex-col p-6'>
          <DialogHeader className='pb-4 border-b border-zinc-800'>
            <DialogTitle className='text-lg font-bold text-zinc-100 flex items-center gap-2'>
              <History className='h-5 w-5 text-emerald-500' />
              Riwayat Jurnal Siswa
            </DialogTitle>
            <DialogDescription className='text-xs text-zinc-400'>
              {ledgerData
                ? `${ledgerData.studentName} (NIS: ${ledgerData.studentNis})`
                : 'Memuat data siswa...'}
            </DialogDescription>
          </DialogHeader>

          {/* Ledger Content */}
          <div className='flex-1 overflow-y-auto py-4 space-y-3'>
            {isLedgerLoading ? (
              <div className='flex flex-col items-center justify-center py-12 text-zinc-500'>
                <Loader2 className='h-6 w-6 animate-spin text-emerald-500 mb-2' />
                <span className='text-xs'>Memuat mutasi kas...</span>
              </div>
            ) : ledgerData && ledgerData.ledger.length > 0 ? (
              <div className='space-y-2'>
                {ledgerData.ledger.map((tx: any) => {
                  const isKredit = tx.type === 'Kredit';
                  return (
                    <div
                      key={tx._id}
                      className='flex items-center justify-between p-3 bg-zinc-950 border border-zinc-900 rounded-xl'
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={`p-2 rounded-xl border ${
                            isKredit
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40'
                              : 'bg-rose-950/40 text-rose-400 border-rose-900/40'
                          }`}
                        >
                          {isKredit ? (
                            <ArrowUpRight className='h-4 w-4' />
                          ) : (
                            <ArrowDownRight className='h-4 w-4' />
                          )}
                        </div>
                        <div>
                          <span className='text-xs font-bold text-zinc-300 block'>
                            {isKredit
                              ? 'Setoran (Kredit)'
                              : 'Penarikan (Debit)'}
                          </span>
                          <span className='text-[10px] text-zinc-500 block'>
                            {new Date(tx.date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {tx.description && (
                            <span className='text-[10px] italic text-zinc-400 block mt-1'>
                              "{tx.description}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className='text-right'>
                        <span
                          className={`text-sm font-extrabold ${
                            isKredit ? 'text-emerald-400' : 'text-rose-400'
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
              <div className='text-center py-12 text-zinc-650 text-xs'>
                Siswa ini belum memiliki transaksi jurnal.
              </div>
            )}
          </div>

          <DialogFooter className='pt-4 border-t border-zinc-800'>
            <Button
              type='button'
              variant='outline'
              onClick={() => setLedgerOpen(false)}
              className='border-zinc-850 hover:bg-zinc-850 hover:text-white rounded-xl w-full'
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
