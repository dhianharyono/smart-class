'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { ShieldCheck, AlertCircle } from 'lucide-react';

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
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Render reCAPTCHA widget once script is loaded
  const renderWidget = () => {
    if (!siteKey || !containerRef.current || !window.grecaptcha || !window.grecaptcha.render) {
      return;
    }

    try {
      if (widgetIdRef.current !== null) {
        window.grecaptcha.reset(widgetIdRef.current);
        return;
      }

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
          setError('Gagal memuat reCAPTCHA. Silakan refresh halaman.');
          onExpire?.();
        },
      });

      widgetIdRef.current = widgetId;
    } catch (err: any) {
      console.error('Error rendering reCAPTCHA:', err);
    }
  };

  useEffect(() => {
    if (window.grecaptcha && window.grecaptcha.render) {
      setScriptLoaded(true);
      renderWidget();
    } else {
      window.onReCaptchaLoadCallback = () => {
        setScriptLoaded(true);
      };
    }
  }, []);

  useEffect(() => {
    if (scriptLoaded) {
      renderWidget();
    }
  }, [scriptLoaded]);

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
    <div className="flex flex-col items-center justify-center my-3">
      <Script
        src={`https://www.google.com/recaptcha/api.js?onload=onReCaptchaLoadCallback&render=explicit`}
        strategy="afterInteractive"
        onLoad={() => {
          setScriptLoaded(true);
        }}
      />
      <div ref={containerRef} className="min-h-[78px] flex items-center justify-center" />
      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-400">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
