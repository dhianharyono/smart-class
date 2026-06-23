import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminGuruLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-60 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-44 rounded-xl" />
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/20 p-4 border border-zinc-900 rounded-2xl w-full">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
          <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
        </div>
        <Skeleton className="h-4 w-48 rounded" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 p-4 bg-zinc-900/40 border-b border-zinc-900">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-16 justify-self-center" />
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-zinc-900/50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-4 items-center">
                <div className="space-y-1.5">
                  <Skeleton className="h-4.5 w-36 rounded-md" />
                  <div className="flex gap-2 items-center">
                    <Skeleton className="h-3 w-28 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                </div>
                <Skeleton className="h-4.5 w-40 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <div className="flex gap-2 justify-center">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-8 w-8 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
