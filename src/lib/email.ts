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
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || '"Smart Class" <no-reply@smartclass.sch.id>';

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: smtpFrom,
        to,
        subject: `[Smart Class] Kode Verifikasi Email Anda: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded-radius: 16px;">
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
    } else {
      console.log(`[EMAIL SIMULATION] SMTP tidak dikonfigurasi. Kode OTP untuk ${to} (${name}) adalah: ${otp}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    // Return success: true so app doesn't crash if SMTP fails, but log error
    return { success: true, warning: 'Gagal mengirim email secara otomatis, gunakan kode OTP yang ditampilkan.' };
  }
}
