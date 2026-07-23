'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, LogOut, Info, CheckCircle2, Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
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
  confirmText = 'Ya',
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
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950 border border-rose-900 text-rose-500 mb-4 animate-bounce-slow'>
            <LogOut className='h-6 w-6' />
          </div>
        );
      case 'success':
        return (
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-950 border border-emerald-900 text-emerald-500 mb-4 animate-bounce-slow'>
            <CheckCircle2 className='h-6 w-6' />
          </div>
        );
      case 'info':
        return (
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-950 border border-blue-900 text-blue-500 mb-4 animate-bounce-slow'>
            <Info className='h-6 w-6' />
          </div>
        );
      case 'warning':
      default:
        return (
          <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-950 border border-amber-900 text-amber-500 mb-4 animate-bounce-slow'>
            <AlertTriangle className='h-6 w-6' />
          </div>
        );
    }
  };

  const getConfirmButtonStyles = () => {
    const base = 'h-10 px-4 rounded-xl flex-1 gap-2 font-semibold text-xs sm:text-sm cursor-pointer shadow-lg transition-all duration-200 justify-center items-center';
    switch (variant) {
      case 'danger':
        return `${base} bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20`;
      case 'success':
        return `${base} bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20`;
      case 'info':
        return `${base} bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20`;
      case 'warning':
      default:
        return `${base} bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-zinc-900/95 backdrop-blur-md border border-zinc-800/80 text-white rounded-2xl w-[calc(100%-2.5rem)] sm:w-full max-w-sm p-5 sm:p-6 shadow-2xl' showCloseButton={false}>
        <DialogHeader>
          {getIcon()}
          <DialogTitle className='text-center text-lg font-bold text-zinc-100 tracking-tight'>
            {title}
          </DialogTitle>
          <DialogDescription className='text-center text-xs text-zinc-400 mt-1 leading-relaxed'>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className='mt-6 flex flex-row items-center justify-center gap-3 w-full'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className='h-10 rounded-xl flex-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-300 font-semibold text-xs sm:text-sm cursor-pointer transition-all duration-200'
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
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
