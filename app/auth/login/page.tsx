'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
        // Obtener perfil para determinar redirección
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const role = profile?.role;

        // Redirigir según rol
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'parliamentarian') {
          router.push('/parliamentarian');
        } else {
          router.push('/public');
        }

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
          <h2 className="text-2xl font-bold mb-6 text-center text-slate-900">
            Iniciar Sesión
          </h2>

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

          <p className="text-center text-sm text-slate-600 mt-6">
            Demo: usa <strong>admin@diputados.bo</strong> / <strong>admin123</strong> para acceder al panel de admin.
          </p>
        </Card>
      </div>
    </div>
  );
}
