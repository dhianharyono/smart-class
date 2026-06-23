import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminSekolahLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-full max-w-xs rounded-xl" />
        <Skeleton className="h-4 w-full max-w-lg rounded-lg" />
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Tambah Sekolah Form Skeleton */}
        <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-2xl p-6 space-y-4 md:col-span-1">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 rounded" />
            <Skeleton className="h-3 w-64 max-w-full rounded" />
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
              <Skeleton className="h-5 w-48 max-w-full rounded" />
              <Skeleton className="h-3 w-full max-w-sm rounded" />
            </div>
          </div>
          <div className="divide-y divide-zinc-900/50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3 flex-1 min-w-0 mr-4">
                  <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-4.5 w-full max-w-[192px] rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
