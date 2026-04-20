import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require an authenticated parent session. Everything else
// (landing page, login, auth callback, static assets) passes through without
// the supabase round-trip.
const PROTECTED_PREFIXES = ['/app', '/parent', '/onboarding'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // Cheap path: no session check needed, just let the request through.
  if (!needsAuth) return NextResponse.next();

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets and images — middleware never runs on them.
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav)$).*)',
  ],
};
