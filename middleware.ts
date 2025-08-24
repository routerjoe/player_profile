import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect the dashboard behind a login cookie.
// We only check presence of the signed session cookie here;
// API routes additionally validate authorization.
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith('/dashboard')) {
    const hasSession = req.cookies.get('pp_session');
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      // Preserve where the user was going
      url.searchParams.set('from', pathname + (search || ''));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};