'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userRole } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirigir según rol del usuario
        if (userRole === 'admin') {
          router.push('/admin');
        } else if (userRole === 'parliamentarian') {
          router.push('/parliamentarian');
        } else {
          router.push('/public');
        }
      } else {
        // Redirigir a login si no está autenticado
        router.push('/auth/login');
      }
    }
  }, [isAuthenticated, isLoading, userRole, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center">
        <Spinner className="w-16 h-16 mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">
          Sistema Parlamentario de Votación
        </h1>
        <p className="text-slate-400">Cargando...</p>
      </div>
    </div>
  );
}
