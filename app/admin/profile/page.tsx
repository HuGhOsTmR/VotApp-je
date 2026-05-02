'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/lib/types';

export default function AdminProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/profile');
      const result = await response.json();

      if (result.success) {
        setUser(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo cargar el perfil',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar el perfil',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup2FA = async () => {
    try {
      setIsSettingUp2FA(true);
      const response = await fetch('/api/auth/two-factor', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.success) {
        setQrCode(result.data.qrCode);
        setSecret(result.data.secret);
        toast({
          title: '2FA configurado',
          description: 'Escanea el código QR con tu app autenticadora',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo configurar 2FA',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error setting up 2FA:', error);
      toast({
        title: 'Error',
        description: 'Error al configurar 2FA',
        variant: 'destructive',
      });
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorToken) {
      toast({
        title: 'Token requerido',
        description: 'Ingresa el código de 6 dígitos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsVerifying2FA(true);
      const response = await fetch('/api/auth/two-factor', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFactorToken }),
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: '2FA activado',
          description: 'La autenticación de dos factores está ahora activa',
        });
        setQrCode(null);
        setSecret(null);
        setTwoFactorToken('');
        fetchProfile();
      } else {
        toast({
          title: 'Código inválido',
          description: result.error || 'El código no es válido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error verifying 2FA:', error);
      toast({
        title: 'Error',
        description: 'Error al verificar el código',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('¿Seguro que deseas desactivar la autenticación de dos factores?')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/two-factor', {
        method: 'DELETE',
      });
      const result = await response.json();

      if (result.success) {
        toast({
          title: '2FA desactivado',
          description: 'La autenticación de dos factores ha sido desactivada',
        });
        fetchProfile();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo desactivar 2FA',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error disabling 2FA:', error);
      toast({
        title: 'Error',
        description: 'Error al desactivar 2FA',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Cargando perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">No se pudo cargar el perfil</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Mi Perfil</h1>
        <p className="text-slate-600">
          Gestiona tu cuenta de administrador y configuraciones de seguridad.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Información Personal</h2>
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{user.full_name}</h3>
              <p className="text-slate-600">{user.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre completo
              </label>
              <p className="text-slate-900">{user.full_name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <p className="text-slate-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rol
              </label>
              <p className="text-slate-900">Administrador</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estado
              </label>
              <p className={`font-medium ${user.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {user.is_active ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Seguridad</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Autenticación de Dos Factores</h3>
              <p className="text-sm text-slate-600 mb-4">
                {user.two_factor_enabled
                  ? 'La autenticación de dos factores está activada para mayor seguridad.'
                  : 'Agrega una capa extra de seguridad activando la autenticación de dos factores.'
                }
              </p>

              {user.two_factor_enabled ? (
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  className="w-full"
                >
                  Desactivar 2FA
                </Button>
              ) : qrCode ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-slate-600 mb-2">
                      Escanea este código QR con tu app autenticadora:
                    </p>
                    <img
                      src={qrCode}
                      alt="QR Code para 2FA"
                      className="mx-auto border rounded"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-2">
                      O ingresa manualmente este código:
                    </p>
                    <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                      {secret}
                    </code>
                  </div>
                  <div>
                    <Input
                      type="text"
                      placeholder="Ingresa el código de 6 dígitos"
                      value={twoFactorToken}
                      onChange={(e) => setTwoFactorToken(e.target.value)}
                      className="text-center"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleVerify2FA}
                    disabled={isVerifying2FA || twoFactorToken.length !== 6}
                    className="w-full"
                  >
                    {isVerifying2FA ? 'Verificando...' : 'Verificar y Activar'}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleSetup2FA}
                  disabled={isSettingUp2FA}
                  className="w-full"
                >
                  {isSettingUp2FA ? 'Configurando...' : 'Configurar 2FA'}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}