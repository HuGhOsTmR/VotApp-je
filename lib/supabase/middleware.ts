import { createServerClient } from '@supabase/ssr';
import { type NextRequest } from 'next/server';

export function createSupabaseMiddlewareClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // In middleware, cookie updates must be applied to the response.
        // @supabase/ssr expects `setAll` to work, but Next middleware
        // handles cookie mutations via NextResponse.
        //
        // We intentionally mirror the existing pattern: no-op here and rely
        // on the middleware response cookie handling.
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
      },
    },
  });
}
