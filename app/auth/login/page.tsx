'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ConnectionStatus } from '@/components/shared/connection-status';
import { logger } from '@/lib/logger';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const redirectToRole = (role: string | undefined) => {
    if (role === 'admin') {
      router.push('/admin');
    } else if (role === 'parliamentarian') {
      router.push('/parliamentarian');
    } else {
      router.push('/public');
    }
  };

  const handleTwoFactorVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!twoFactorToken || twoFactorToken.length !== 6) {
      toast({
        title: 'Código inválido',
        description: 'Ingresa un código de 6 dígitos válido',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFactorToken }),
      });
      const result = await response.json();

      if (result.success) {
        // Obtener perfil para redirección
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', userId)
          .single();

        redirectToRole(profile?.role);
        toast({
          title: 'Éxito',
          description: 'Has iniciado sesión correctamente',
        });
      } else {
        toast({
          title: 'Código inválido',
          description: result.error || 'El código 2FA no es válido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] 2FA verification error:', error);
      toast({
        title: 'Error',
        description: 'Error al verificar el código 2FA',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setShowTwoFactor(false);
    setTwoFactorToken('');
    setUserId(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Error de login',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      if (data.user) {
        // Obtener perfil para determinar redirección y verificar 2FA
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, two_factor_enabled')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role;
        const twoFactorEnabled = profile?.two_factor_enabled;

        // Si es admin con 2FA activado, mostrar verificación 2FA
        if (role === 'admin' && twoFactorEnabled) {
          setUserId(data.user.id);
          setShowTwoFactor(true);
          setIsLoading(false);
          return;
        }

        // Redirigir según rol
        redirectToRole(role);

        toast({
          title: 'Éxito',
          description: 'Has iniciado sesión correctamente',
        });
      }
    } catch (error) {
      console.error('[v0] Login error:', error);
      toast({
        title: 'Error',
        description: 'Ocurrió un error durante el login',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Sistema Parlamentario
          </h1>
          <p className="text-slate-400">
            Votación en Tiempo Real - Cochabamba, Bolivia
          </p>
        </div>

<Card className="p-8 bg-white shadow-xl">
          <div className="flex justify-end mb-4">
            <ConnectionStatus showLabel={false} />
          </div>
          
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-900">
            {showTwoFactor ? 'Verificación de Dos Factores' : 'Iniciar Sesión'}
          </h2>

          {showTwoFactor ? (
            <form onSubmit={handleTwoFactorVerify} className="space-y-4">
              <div>
                <label htmlFor="twoFactorToken" className="block text-sm font-medium text-slate-700 mb-1">
                  Código de Autenticación
                </label>
                <Input
                  id="twoFactorToken"
                  type="text"
                  placeholder="000000"
                  value={twoFactorToken}
                  onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  disabled={isLoading}
                  className="w-full text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                <p className="text-sm text-slate-600 mt-2">
                  Ingresa el código de 6 dígitos de tu app autenticadora
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading || twoFactorToken.length !== 6}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white"
              >
                {isLoading ? 'Verificando...' : 'Verificar y Continuar'}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleBackToLogin}
                disabled={isLoading}
                className="w-full"
              >
                ← Volver al login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@diputados.bo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white"
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </Button>
          </form>
          )}

          {!showTwoFactor && (
            <>
              <div className="mt-4 text-center">
                <a href="/auth/forgot-password" className="text-sm font-medium text-blue-700 hover:underline">
                  Olvidé mi contraseña
                </a>
              </div>

              <p className="text-center text-sm text-slate-600 mt-6">
                Demo: usa <strong>admin@diputados.bo</strong> / <strong>admin123</strong> para acceder al panel de admin.
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

