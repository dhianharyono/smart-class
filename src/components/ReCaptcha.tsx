'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    grecaptcha: any;
    onReCaptchaLoadCallback?: () => void;
  }
}

interface ReCaptchaProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  resetTrigger?: number;
}

export default function ReCaptcha({ onVerify, onExpire, resetTrigger }: ReCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  const renderWidget = () => {
    if (!siteKey || !containerRef.current || !window.grecaptcha || typeof window.grecaptcha.render !== 'function') {
      return false;
    }

    try {
      if (widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
        setIsReady(true);
        return true;
      }

      // Clear container in case of re-mount
      containerRef.current.innerHTML = '';

      const widgetId = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'dark',
        callback: (token: string) => {
          setError(null);
          onVerify(token);
        },
        'expired-callback': () => {
          onExpire?.();
        },
        'error-callback': () => {
          setError('Gagal memuat reCAPTCHA. Silakan coba lagi.');
          onExpire?.();
        },
      });

      widgetIdRef.current = widgetId;
      setIsReady(true);
      return true;
    } catch (err: any) {
      console.error('Error rendering reCAPTCHA:', err);
      return false;
    }
  };

  useEffect(() => {
    // Check if grecaptcha is already available globally (e.g. from previous navigation)
    if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
      setIsLoaded(true);
      renderWidget();
      return;
    }

    // Set callback on window
    window.onReCaptchaLoadCallback = () => {
      setIsLoaded(true);
    };

    // Polling fallback to check if script loaded without firing callback
    const interval = setInterval(() => {
      if (window.grecaptcha && typeof window.grecaptcha.render === 'function') {
        setIsLoaded(true);
        renderWidget();
        clearInterval(interval);
      }
    }, 150);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (isLoaded) {
      renderWidget();
    }
  }, [isLoaded]);

  // Reset widget when resetTrigger changes
  useEffect(() => {
    if (widgetIdRef.current !== null && window.grecaptcha) {
      try {
        window.grecaptcha.reset(widgetIdRef.current);
      } catch (e) {
        // ignore
      }
    }
  }, [resetTrigger]);

  // Fallback if siteKey is missing (e.g. local dev without env)
  if (!siteKey) {
    return (
      <div className="flex items-center gap-2 p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-400">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-zinc-300 font-medium">Dev Mode:</strong> Proteksi reCAPTCHA aktif (Bypass Mode karena Site Key belum diisi di .env.local).
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center my-3 relative min-h-[78px] w-full">
      <Script
        src="https://www.google.com/recaptcha/api.js?onload=onReCaptchaLoadCallback&render=explicit"
        strategy="afterInteractive"
        onReady={() => {
          setIsLoaded(true);
          renderWidget();
        }}
      />
      {!isReady && !error && (
        <div className="flex items-center justify-center gap-2 px-4 py-5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl text-xs text-zinc-400 w-full max-w-[304px] animate-pulse my-1">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400 shrink-0" />
          <span>Memuat verifikasi reCAPTCHA...</span>
        </div>
      )}
      <div ref={containerRef} className={`min-h-[78px] flex items-center justify-center ${!isReady ? 'hidden' : 'block'}`} />
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

