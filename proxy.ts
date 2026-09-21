import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

/** Halaman yang boleh dibuka tanpa login. */
const PUBLIC_ROUTES = ['/masuk', '/daftar', '/ui-preview'];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Route handler mengurus otorisasinya sendiri dan membalas envelope JSON,
  // jadi jangan di-redirect ke halaman login.
  if (pathname.startsWith('/api/')) return response;

  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/masuk';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (user && isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/transaksi';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
