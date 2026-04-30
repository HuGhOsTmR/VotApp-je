'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/lib/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PARLIAMENTARIAN);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      const result = await response.json();

      if (result.success) {
        setUsers(result.data || []);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudieron cargar los usuarios',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar los usuarios',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password || !fullName) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor completa todos los campos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          role,
        }),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo crear el usuario');
      }

      toast({
        title: 'Usuario creado',
        description: 'El usuario se creó correctamente',
      });
      setEmail('');
      setPassword('');
      setFullName('');
      setRole(UserRole.PARLIAMENTARIAN);
      fetchUsers();
    } catch (error) {
      console.error('[v0] Create user error:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo crear el usuario',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Usuarios</h1>
        <p className="text-slate-600">
          Crea nuevos usuarios de la aplicación y asigna el rol correspondiente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Crear nuevo usuario</h2>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                Nombre completo
              </label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Nombre completo"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="usuario@diputados.bo"
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
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="admin123"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-1">
                Rol del usuario
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.PARLIAMENTARIAN}>Parlamentario</option>
                <option value={UserRole.OBSERVER}>Observador</option>
              </select>
            </div>
            <Button type="submit" disabled={isSaving} className="w-full">
              {isSaving ? 'Creando...' : 'Crear usuario'}
            </Button>
          </form>
        </Card>

        <Card className="p-6 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">Usuarios existentes</h2>
          {isLoading ? (
            <p className="text-slate-600">Cargando usuarios...</p>
          ) : users.length === 0 ? (
            <p className="text-slate-600">No hay usuarios creados aún.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Creado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.is_active ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
