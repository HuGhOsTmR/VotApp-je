import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = ['/auth/login', '/auth/forgot-password', '/public'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes without authentication
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Create Supabase server client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase is not configured, redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // This function is used to set cookies in the response
        // Not applicable in middleware but required for the client
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
        });
      },
    },
  });

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
