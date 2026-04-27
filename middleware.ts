import { type NextRequest } from 'next/server';
import { updateSession } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  console.log('[v0] Middleware processing:', request.nextUrl.pathname);

  // Rutas públicas (sin protección)
  const publicRoutes = ['/auth/login', '/auth/register', '/public'];
  const isPublicRoute = publicRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isPublicRoute) {
    return await updateSession(request);
  }

  // Actualizar sesión de Supabase
  let response = await updateSession(request);

  // Obtener token de la sesión
  const supabaseResponse = response.clone();
  const cookies = supabaseResponse.headers.getSetCookie();

  // Verificar autenticación para rutas protegidas
  const authHeader = request.headers.get('authorization');
  const hasSession = cookies.some((cookie) => cookie.includes('sb-'));

  if (!authHeader && !hasSession && !isPublicRoute) {
    // Redirigir a login si no está autenticado
    return Response.redirect(new URL('/auth/login', request.url));
  }

  return response;
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
