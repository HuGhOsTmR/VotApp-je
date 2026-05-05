import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

const publicRoutes = ['/auth/login', '/auth/forgot-password', '/public'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes without authentication
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const supabase = createSupabaseMiddlewareClient(request);

  // Validate user session with Supabase auth
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If there's an error or no user, redirect to login
  if (error || !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\..*$).*)',
  ],
};
