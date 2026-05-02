'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa tu correo electrónico',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/login`,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Revisa tu correo',
        description: 'Te hemos enviado un enlace para restablecer la contraseña.',
      });
      router.push('/auth/login');
    } catch (error) {
      console.error('[v0] Forgot password error:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'No se pudo enviar el correo de recuperación',
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
          <h1 className="text-4xl font-bold text-white mb-2">Recuperar contraseña</h1>
          <p className="text-slate-400">Ingresa tu correo para recibir un enlace de restablecimiento.</p>
        </div>

        <Card className="p-8 bg-white shadow-xl">
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
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

            <Button type="submit" disabled={isLoading} className="w-full bg-blue-900 hover:bg-blue-950 text-white">
              {isLoading ? 'Enviando...' : 'Enviar enlace'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            ¿Recordaste tu contraseña?{' '}
            <a href="/auth/login" className="font-medium text-blue-700 hover:underline">
              Volver al login
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
