import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth';

const isPublicRoute = (path: string) => {
  return path.startsWith('/sign-in') || path.startsWith('/sign-up');
};

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Jika ada parameter '?clear=1', hapus cookie sesi dan bersihkan URL
  if (req.nextUrl.searchParams.get('clear') === '1') {
    const response = NextResponse.redirect(new URL('/sign-in', req.nextUrl));
    response.cookies.delete('session');
    return response;
  }
  
  // Read session cookie
  const sessionToken = req.cookies.get('session')?.value;
  const session = sessionToken ? await verifySession(sessionToken) : null;
  const isAuthenticated = !!session;

  if (isPublicRoute(path)) {
    if (isAuthenticated) {
      if (session?.isAdmin) {
        return NextResponse.redirect(new URL('/admin', req.nextUrl));
      }
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl));
  }

  if (path.startsWith('/admin')) {
    if (!session?.isAdmin) {
      return NextResponse.redirect(new URL('/', req.nextUrl));
    }
  } else {
    // Admin tidak boleh mengakses rute guru reguler, redirect ke /admin
    if (session?.isAdmin) {
      return NextResponse.redirect(new URL('/admin', req.nextUrl));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
