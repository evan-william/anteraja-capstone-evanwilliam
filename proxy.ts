import { NextResponse, type NextRequest } from 'next/server';

import { updateSession } from '@/lib/supabase/proxy';

/** Halaman kerja yang memang meminta akun; URL lain tetap boleh mencapai 404. */
const PROTECTED_ROUTES = ['/admin', '/seller', '/akun', '/aktivasi-admin', '/pengiriman', '/transaksi', '/import', '/kategori'];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Route handler mengurus otorisasinya sendiri dan membalas envelope JSON,
  // jadi jangan di-redirect ke halaman login.
  if (pathname.startsWith('/api/')) return response;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = '/masuk';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff|woff2|ttf|otf)$).*)'],
};
