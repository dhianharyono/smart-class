import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSekolahLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-72 rounded-xl" />
        <Skeleton className="h-4 w-[500px] rounded-lg" />
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Tambah Sekolah Form Skeleton */}
        <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-2xl p-6 space-y-4 md:col-span-1">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3 w-64 rounded" />
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* List Sekolah Skeleton */}
        <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-2xl md:col-span-2 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-zinc-900">
            <div className="space-y-2">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3 w-96 rounded" />
            </div>
          </div>
          <div className="divide-y divide-zinc-900/50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4.5 w-48 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
