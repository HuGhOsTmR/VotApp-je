import { NextResponse, type NextRequest } from 'next/server';

const publicRoutes = ['/auth/login', '/auth/register', '/public'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Permitir rutas públicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar si hay sesión Supabase
  const hasSession = request.cookies
    .getAll()
    .some((cookie) => cookie.name.includes('auth-token') || cookie.name.startsWith('sb-'));

  // Si no hay sesión y no es ruta pública, redirigir a login
  if (!hasSession) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};
