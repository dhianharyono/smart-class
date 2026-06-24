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
  title: 'Smart Class - Command Center Wali Kelas',
  description:
    'Aplikasi produktivitas mandiri wali kelas (Smart Class) untuk pengelolaan siswa, absensi, nilai, dan jurnal.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${outfit.variable} h-full antialiased dark`}>
      <body className='font-sans min-h-full flex flex-col bg-zinc-950 text-zinc-100'>
        <QueryProvider>
          {children}
          <Toaster richColors closeButton theme='dark' position='top-right' />
        </QueryProvider>
      </body>
    </html>
  );
}
