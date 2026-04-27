'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { UserRole } from '@/lib/types';
import { Spinner } from '@/components/ui/spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallbackUrl?: string;
}

export function AuthGuard({
  children,
  requiredRole,
  fallbackUrl = '/auth/login',
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, userRole } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(fallbackUrl);
        return;
      }

      // Verificar rol requerido
      if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        if (userRole && !roles.includes(userRole)) {
          router.push('/unauthorized');
        }
      }
    }
  }, [isAuthenticated, isLoading, userRole, requiredRole, router, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 mb-4" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Verificar rol
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (userRole && !roles.includes(userRole)) {
      return null;
    }
  }

  return <>{children}</>;
}
