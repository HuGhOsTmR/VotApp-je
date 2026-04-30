import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const publicRoutes = ['/auth/login', '/auth/register', '/public'];

function hasSupabaseSession(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'));
}

function getSupabaseCookies(request: NextRequest) {
  return request.cookies.getAll().map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
  }));
}

async function refreshSupabaseSession(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables for middleware');
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => getSupabaseCookies(request),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options ?? {});
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  await supabase.auth.getSession();
}

export async function middleware(request: NextRequest) {
  console.log('[v0] Middleware processing:', request.nextUrl.pathname);

  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const response = NextResponse.next();
  await refreshSupabaseSession(request, response);

  const authHeader = request.headers.get('authorization');
  const hasSession = hasSupabaseSession(request);

  if (!authHeader && !hasSession && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
