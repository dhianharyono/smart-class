import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminSekolahLoading() {
  return (
    <div className='space-y-6 animate-fade-in pb-12'>
      {/* Header Skeleton */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 sm:h-9 w-64 max-w-full rounded-xl' />
          <Skeleton className='h-4 w-full max-w-xl rounded-lg' />
        </div>
        <Skeleton className='h-10 w-full sm:w-38 rounded-xl shrink-0' />
      </div>

      {/* Filter & Search Bar Skeleton */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs'>
        <div className='flex-1'>
          <Skeleton className='h-9 w-full sm:max-w-md rounded-xl' />
        </div>
        <Skeleton className='h-4 w-36 rounded shrink-0' />
      </div>

      {/* Table Card Skeleton */}
      <Card className='bg-white border-slate-200/80 rounded-2xl shadow-xs'>
        <CardContent className='p-0'>
          <div className='overflow-x-auto min-w-0 max-w-full'>
            <table className='w-full min-w-[650px] text-left text-sm text-slate-700 border-collapse'>
              <thead>
                <tr className='border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider bg-slate-50'>
                  <th className='py-3.5 px-6'>Nama Sekolah</th>
                  <th className='py-3.5 px-6'>Jumlah Guru Terkait</th>
                  <th className='py-3.5 px-6'>Tanggal Terdaftar</th>
                  <th className='py-3.5 px-6'>Status</th>
                  <th className='py-3.5 px-6 text-center'>Aksi</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {[...Array(6)].map((_, i) => (
                  <tr key={i} className='hover:bg-slate-50/80 transition-colors'>
                    <td className='py-4 px-6'>
                      <div className='flex items-center gap-3'>
                        <Skeleton className='h-9 w-9 rounded-xl shrink-0' />
                        <Skeleton
                          className={`h-4.5 rounded-md ${
                            i % 3 === 0
                              ? 'w-48'
                              : i % 3 === 1
                              ? 'w-36'
                              : 'w-56'
                          }`}
                        />
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center gap-2'>
                        <Skeleton className='h-4 w-4 rounded shrink-0' />
                        <Skeleton className='h-3.5 w-20 rounded' />
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <div className='flex items-center gap-1.5'>
                        <Skeleton className='h-3.5 w-3.5 rounded shrink-0' />
                        <Skeleton className='h-3.5 w-24 rounded' />
                      </div>
                    </td>
                    <td className='py-4 px-6'>
                      <Skeleton className='h-6 w-28 rounded-lg' />
                    </td>
                    <td className='py-4 px-6 text-center'>
                      <div className='flex justify-center items-center'>
                        <Skeleton className='h-8 w-8 rounded-xl shrink-0' />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
