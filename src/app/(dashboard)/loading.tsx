import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 max-w-full rounded-xl" />
          <Skeleton className="h-4 w-full max-w-sm rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Grid Stats Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-slate-200/80 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between h-[120px] shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Chart 1 (Large) */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl h-[380px] md:col-span-2 flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-[260px] w-full rounded-xl" />
        </div>

        {/* Chart 2 */}
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl h-[380px] flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-44 w-44 rounded-full mx-auto" />
          <div className="flex gap-2 justify-center pt-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-12 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Alert Center Skeleton */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <Skeleton className="h-5 w-full max-w-xs" />
            <Skeleton className="h-3.5 w-full max-w-sm" />
          </div>
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between items-center py-3 border-t border-slate-100">
              <div className="space-y-1.5">
                <Skeleton className="h-4.5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
