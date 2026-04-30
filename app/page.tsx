'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Spinner } from '@/components/ui/spinner';

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [hasTimeout, setHasTimeout] = useState(false);

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      try {
        // Timeout de 5 segundos
        const timeoutId = setTimeout(() => {
          setHasTimeout(true);
          router.push('/auth/login');
        }, 5000);

        // Obtener sesión actual
        const { data: sessionData } = await supabase.auth.getSession();

        clearTimeout(timeoutId);

        if (sessionData?.session?.user) {
          // Obtener perfil del usuario para determinar rol
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', sessionData.session.user.id)
            .single();

          const role = profileData?.role;

          // Redirigir según rol
          if (role === 'admin') {
            router.push('/admin');
          } else if (role === 'parliamentarian') {
            router.push('/parliamentarian');
          } else {
            router.push('/public');
          }
        } else {
          // No hay sesión, ir a login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('[v0] Redirect error:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <Spinner className="w-16 h-16 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">
          Sistema Parlamentario de Votación
        </h1>
        <p className="text-slate-400">
          {hasTimeout ? 'Redirigiendo...' : 'Cargando...'}
        </p>
      </div>
    </div>
  );
}
