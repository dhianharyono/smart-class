/**
 * Server-side Google reCAPTCHA v2 / v3 verification helper
 */
export async function verifyRecaptchaToken(token?: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY || process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // Development / Unconfigured fallback: Gracefully bypass check if keys are missing
  if (!secretKey || !siteKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ Google reCAPTCHA keys are not configured in environment variables. Bypassing check for local development.');
      return { success: true };
    }
    return {
      success: false,
      error: 'Sistem reCAPTCHA belum dikonfigurasi di server.',
    };
  }

  if (!token) {
    return {
      success: false,
      error: 'Harap selesaikan verifikasi "Saya bukan robot" (reCAPTCHA).',
    };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }).toString(),
    });

    const data = await response.json();

    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: 'Verifikasi reCAPTCHA gagal atau telah kedaluwarsa. Silakan centang kembali.',
    };
  } catch (error: any) {
    console.error('Failed to verify reCAPTCHA token:', error);
    return {
      success: false,
      error: 'Terjadi kesalahan jaringan saat memverifikasi reCAPTCHA.',
    };
  }
}
