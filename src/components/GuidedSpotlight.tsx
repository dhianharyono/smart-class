'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';

interface GuidedSpotlightProps {
  targetRef: React.RefObject<HTMLElement | null>;
  stepTitle: string;
  stepDescription: string;
  onClose: () => void;
}

export default function GuidedSpotlight({
  targetRef,
  stepTitle,
  stepDescription,
  onClose,
}: GuidedSpotlightProps) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setMounted(true);

    const updateRect = () => {
      if (targetRef.current) {
        setRect(targetRef.current.getBoundingClientRect());
      }
    };

    // Multiple update passes to handle CSS animations/font loading
    updateRect();
    const timer1 = setTimeout(updateRect, 50);
    const timer2 = setTimeout(updateRect, 200);
    const timer3 = setTimeout(updateRect, 400);

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [targetRef]);

  if (!mounted || !rect || rect.width === 0 || rect.height === 0) return null;

  // Cutout padding around target button
  const pad = 6;
  const holeX = Math.max(0, rect.left - pad);
  const holeY = Math.max(0, rect.top - pad);
  const holeW = rect.width + pad * 2;
  const holeH = rect.height + pad * 2;

  // Tooltip position calculation
  const tooltipTop = holeY + holeH + 12;
  const tooltipWidth = 320;
  // Align right edge of tooltip with right edge of spotlight hole
  const leftPos = Math.max(
    16,
    Math.min(
      window.innerWidth - tooltipWidth - 16,
      holeX + holeW - tooltipWidth,
    ),
  );

  // Arrow offset pointing to horizontal center of hole
  const arrowRight = Math.max(
    16,
    Math.min(tooltipWidth - 24, leftPos + tooltipWidth - (holeX + holeW / 2)),
  );

  return createPortal(
    <div className='print:hidden'>
      {/* 1. SVG MASK BACKDROP (CUTS OUT TRANSPARENT HOLE OVER THE TARGET BUTTON) */}
      <svg
        className='fixed inset-0 w-full h-full z-[9990] pointer-events-none'
        style={{ width: '100vw', height: '100vh' }}
      >
        <defs>
          <mask id='spotlight-hole-mask'>
            {/* White background = show dark backdrop */}
            <rect x='0' y='0' width='100%' height='100%' fill='white' />
            {/* Black rounded rect = cutout hole for real button */}
            <rect
              x={holeX}
              y={holeY}
              width={holeW}
              height={holeH}
              rx='14'
              ry='14'
              fill='black'
            />
          </mask>
        </defs>
        {/* Dark overlay with cutout mask */}
        <rect
          x='0'
          y='0'
          width='100%'
          height='100%'
          fill='rgba(15, 23, 42, 0.82)'
          mask='url(#spotlight-hole-mask)'
          className='pointer-events-auto cursor-pointer'
          onClick={onClose}
        />
      </svg>

      {/* 2. GLOWING SPOTLIGHT BORDER HALO AROUND THE HOLE */}
      <div
        style={{
          position: 'fixed',
          top: holeY,
          left: holeX,
          width: holeW,
          height: holeH,
        }}
        className='z-[9995] rounded-2xl border-2 border-emerald-400 ring-4 ring-emerald-400/40 ring-offset-2 ring-offset-slate-950 animate-pulse shadow-[0_0_30px_rgba(52,211,153,0.6)] pointer-events-none transition-all duration-150'
      />

      {/* 3. GUIDED TOOLTIP CALLOUT BADGE */}
      <div
        style={{
          position: 'fixed',
          top: tooltipTop,
          left: leftPos,
        }}
        className='z-[9999] w-72 sm:w-80 bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-400/60 animate-in fade-in zoom-in-95 duration-200'
      >
        {/* Arrow pointing up directly at center of target button */}
        <div
          style={{ right: arrowRight }}
          className='absolute -top-1.5 w-3 h-3 bg-slate-900 border-t border-l border-emerald-400/60 rotate-45'
        />

        <div className='flex items-start justify-between gap-2.5 relative z-10'>
          <div className='flex items-start gap-2.5'>
            <div className='h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs'>
              <Sparkles className='h-4.5 w-4.5' />
            </div>
            <div>
              <p className='text-xs font-extrabold text-white flex items-center gap-1.5 tracking-tight'>
                <span>{stepTitle}</span>
              </p>
              <p className='text-[11px] text-slate-300 mt-1 leading-relaxed font-medium'>
                {stepDescription}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0'
            title='Tutup panduan'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
