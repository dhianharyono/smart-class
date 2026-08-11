'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Info, CheckCircle2, Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  icon?: React.ReactNode;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  isLoading = false,
  onConfirm,
  variant = 'warning',
  icon,
}: ConfirmDialogProps) {
  const getIcon = () => {
    if (icon) return icon;

    switch (variant) {
      case 'danger':
        return (
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 mb-3 shadow-xs'>
            <Trash2 className='h-7 w-7 stroke-[1.8]' />
          </div>
        );
      case 'success':
        return (
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 mb-3 shadow-xs'>
            <CheckCircle2 className='h-7 w-7 stroke-[1.8]' />
          </div>
        );
      case 'info':
        return (
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-3 shadow-xs'>
            <Info className='h-7 w-7 stroke-[1.8]' />
          </div>
        );
      case 'warning':
      default:
        return (
          <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 mb-3 shadow-xs'>
            <AlertTriangle className='h-7 w-7 stroke-[1.8]' />
          </div>
        );
    }
  };

  const getConfirmButtonStyles = () => {
    const base =
      'h-10 px-4 rounded-xl flex-1 gap-2 font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all duration-200 justify-center items-center';
    switch (variant) {
      case 'danger':
        return `${base} bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white shadow-rose-600/20`;
      case 'success':
        return `${base} bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-emerald-600/20`;
      case 'info':
        return `${base} bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white shadow-blue-600/20`;
      case 'warning':
      default:
        return `${base} bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white shadow-amber-600/20`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-900 rounded-3xl w-[calc(100%-2rem)] sm:w-full max-w-sm p-6 shadow-2xl transition-all'
        showCloseButton={false}
      >
        <DialogHeader className='items-center text-center'>
          {getIcon()}
          <DialogTitle className='text-center text-lg font-extrabold text-slate-900 tracking-tight'>
            {title}
          </DialogTitle>
          <DialogDescription className='text-center text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed font-medium'>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className='mt-6 flex flex-row items-center justify-center gap-3 w-full'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className='h-10 rounded-xl flex-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 font-semibold text-xs sm:text-sm cursor-pointer transition-all duration-200'
          >
            {cancelText}
          </Button>
          <Button
            type='button'
            disabled={isLoading}
            onClick={onConfirm}
            className={getConfirmButtonStyles()}
          >
            {isLoading ? (
              <>
                <Loader2 className='h-4 w-4 animate-spin' />
                <span>Memproses...</span>
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
