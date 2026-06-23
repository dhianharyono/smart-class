import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-9 w-72 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded" />
        </div>
      </div>

      {/* Grid Stats Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-zinc-900/20 border border-zinc-900/60 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Columns: Sekolah & Pengguna Online */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sekolah Stats */}
        <div className="bg-zinc-900/20 border border-zinc-900/60 p-6 rounded-2xl flex flex-col justify-between h-[350px]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-56" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-zinc-900/20 last:border-b-0">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pengguna Online */}
        <div className="bg-zinc-900/20 border border-zinc-900/60 p-6 rounded-2xl flex flex-col justify-between h-[350px]">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="h-3 w-60" />
            </div>
            <div className="space-y-2.5 max-h-[220px] overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-zinc-900/30 border border-zinc-900 rounded-xl">
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-2.5 w-44" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Guru */}
      <div className="bg-zinc-900/20 border border-zinc-900/60 p-6 rounded-2xl space-y-4">
        <div className="flex justify-between items-center pb-2">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3.5 w-80" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-t border-zinc-900/40">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4.5 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-40 flex-1" />
              <Skeleton className="h-6 w-16 rounded-md flex-1 justify-self-center max-w-[80px]" />
              <Skeleton className="h-4.5 w-16 flex-1 text-right max-w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
