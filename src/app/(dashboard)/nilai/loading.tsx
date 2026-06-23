import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function NilaiLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64 rounded-xl" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Filter Options Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-zinc-900/20 border border-zinc-900/60 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Subject Dropdown */}
          <Skeleton className="h-10 w-60 rounded-xl" />
          {/* Add Subject Button */}
          <Skeleton className="h-10 w-44 rounded-xl" />
          {/* Divider */}
          <span className="hidden sm:inline text-zinc-800">|</span>
          {/* Category Dropdown */}
          <Skeleton className="h-10 w-48 rounded-xl" />
        </div>
      </div>

      {/* Main Table Skeleton */}
      <div className="bg-zinc-900/20 border border-zinc-900/60 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 p-4 bg-zinc-900/40 border-b border-zinc-900">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24 justify-self-center" />
          </div>
          {/* Table Rows */}
          <div className="divide-y divide-zinc-900/50">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4 p-4 items-center">
                <Skeleton className="h-4 w-6" />
                <Skeleton className="h-4.5 w-24 rounded-md font-mono" />
                <Skeleton className="h-5 w-48 rounded-md" />
                <Skeleton className="h-4.5 w-16 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-xl justify-self-center" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
