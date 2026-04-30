import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Rutas públicas (sin protección)
  const publicRoutes = ['/auth/login', '/auth/register', '/public'];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Si es ruta pública, permitir acceso
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Para rutas protegidas, verificar si tiene cookie de sesión de Supabase
  const cookieHeader = request.headers.get('cookie') || '';
  const hasSession = cookieHeader.includes('sb-') || request.cookies.has('sb-auth-token');

  if (!hasSession) {
    // Redirigir a login si no está autenticado
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
