import nodemailer from 'nodemailer';

interface SendVerificationEmailParams {
  to: string;
  name: string;
  otp: string;
}

export async function sendVerificationEmail({ to, name, otp }: SendVerificationEmailParams) {
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER?.trim();
    // Trim spaces from App Password
    const smtpPass = process.env.SMTP_PASS?.replace(/\s+/g, '');
    let smtpFrom = process.env.SMTP_FROM?.trim() || '"Smart Class" <mysmartclassindonesia@gmail.com>';

    // Clean up outer quotes if present from Vercel UI
    if (smtpFrom.startsWith('"') && smtpFrom.endsWith('"')) {
      smtpFrom = smtpFrom.slice(1, -1);
    }

    if (smtpHost && smtpUser && smtpPass) {
      const isGmail = smtpHost.includes('gmail');
      // On serverless platforms like Vercel, port 465 (SSL) is much more reliable than port 587 (STARTTLS)
      const secure = smtpPort === 465 || (isGmail && smtpPort !== 587);
      const actualPort = isGmail && smtpPort === 587 ? 465 : smtpPort;

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: actualPort,
        secure: actualPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      await transporter.sendMail({
        from: smtpFrom,
        replyTo: smtpUser,
        to,
        subject: `[Smart Class] Kode Verifikasi Email Anda: ${otp}`,
        text: `Halo ${name},\n\nTerima kasih telah mendaftar di Smart Class.\nKode OTP verifikasi email Anda adalah: ${otp}\n\nKode ini berlaku selama 15 menit.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px;">
            <h2 style="color: #059669; margin-bottom: 8px;">Verifikasi Email Akun Smart Class</h2>
            <p style="color: #475569; font-size: 14px;">Halo <strong>${name}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              Terima kasih telah mendaftar di Smart Class. Gunakan 6 digit kode OTP di bawah ini untuk memverifikasi alamat email Anda:
            </p>
            <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 12px; text-align: center; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #047857;">${otp}</span>
            </div>
            <p style="color: #64748b; font-size: 12px;">
              Kode verifikasi ini berlaku selama 15 menit. Jika Anda tidak merasa mendaftar di Smart Class, silakan abaikan email ini.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">&copy; ${new Date().getFullYear()} Smart Class Dashboard Wali Kelas</p>
          </div>
        `,
      });
      console.log(`[EMAIL SENT] Kode OTP ${otp} berhasil dikirim via SMTP ke ${to}`);
      return { success: true };
    } else {
      console.warn(`[EMAIL SIMULATION] SMTP tidak lengkap (Host: ${!!smtpHost}, User: ${!!smtpUser}, Pass: ${!!smtpPass}). Kode OTP untuk ${to}: ${otp}`);
      return { success: false, error: 'SMTP Environment Variables tidak lengkap di Server.' };
    }
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error?.message || 'Gagal mengirim email verifikasi via SMTP.' };
  }
}
