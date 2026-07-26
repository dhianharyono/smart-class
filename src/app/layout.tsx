import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from '@/components/ui/sonner';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: {
    default: 'Smart Class - Dashboard Wali Kelas',
    template: '%s | Smart Class',
  },
  description:
    'Aplikasi produktivitas dan pengelolaan kelas terpadu untuk wali kelas: absensi siswa, jurnal harian guru, rekap nilai, dan buku tabungan kelas.',
  keywords: [
    'Smart Class',
    'Dashboard Wali Kelas',
    'Jurnal Guru Harian',
    'Absensi Siswa Online',
    'Tabungan Kelas',
    'Rekap Nilai Siswa',
    'Aplikasi Sekolah',
    'Manajemen Kelas',
  ],
  authors: [{ name: 'Smart Class Team' }],
  creator: 'Smart Class',
  publisher: 'Smart Class',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://smart-class.vercel.app',
  ),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Smart Class - Dashboard Wali Kelas',
    description:
      'Aplikasi produktivitas dan pengelolaan kelas terpadu untuk wali kelas: absensi siswa, jurnal harian guru, rekap nilai, dan buku tabungan kelas.',
    url: '/',
    siteName: 'Smart Class',
    locale: 'id_ID',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Smart Class - Dashboard Wali Kelas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Class - Dashboard Wali Kelas',
    description:
      'Aplikasi produktivitas dan pengelolaan kelas terpadu untuk wali kelas: absensi siswa, jurnal harian guru, rekap nilai, dan buku tabungan kelas.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png' },
    ],
    shortcut: '/icon.svg',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='id' className={`${outfit.variable} h-full antialiased`}>
      <body className='font-sans min-h-full flex flex-col bg-slate-50 text-slate-900'>
        <QueryProvider>
          {children}
          <Toaster richColors closeButton theme='light' position='top-right' />
        </QueryProvider>
      </body>
    </html>
  );
}
