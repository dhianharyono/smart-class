import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://smart-class.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sign-in', '/sign-up'],
        disallow: [
          '/dashboard',
          '/admin',
          '/absensi',
          '/nilai',
          '/jurnal',
          '/jadwal',
          '/jadwal-mengajar',
          '/kelas',
          '/siswa',
          '/settings',
          '/profile',
          '/feedback',
          '/piket',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
