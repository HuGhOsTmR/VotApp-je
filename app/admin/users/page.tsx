'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/lib/types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PARLIAMENTARIAN);
  const [isActive, setIsActive] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
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

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setRole(UserRole.PARLIAMENTARIAN);
    setIsActive(true);
    setEditingUser(null);
  };

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csvRows = rows.map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    );
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportUsers = () => {
    const rows = [
      ['Nombre', 'Email', 'Rol', 'Activo', 'Creado'],
      ...filteredUsers.map((user) => [
        user.full_name,
        user.email,
        user.role,
        user.is_active ? 'Sí' : 'No',
        new Date(user.created_at).toLocaleString(),
      ]),
    ];
    downloadCsv('usuarios.csv', rows);
    toast({
      title: 'Exportación lista',
      description: 'Se descargó el listado de usuarios en CSV.',
    });
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setEmail(user.email);
    setFullName(user.full_name);
    setRole(user.role);
    setIsActive(user.is_active);
    setPassword('');
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        user.full_name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);

      const matchesRole = filterRole === 'all' || user.role === filterRole;
      const matchesActive = !showOnlyActive || user.is_active;

      return matchesSearch && matchesRole && matchesActive;
    });
  }, [users, search, filterRole, showOnlyActive]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users?id=${userId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo eliminar el usuario');
      }

      toast({
        title: 'Usuario eliminado',
        description: 'El usuario fue removido correctamente',
      });
      fetchUsers();
    } catch (error) {
      console.error('[v0] Delete user error:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'No se pudo eliminar el usuario',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!fullName || (!editingUser && !email) || (!editingUser && !password)) {
      toast({
        title: 'Campos incompletos',
        description: 'Por favor completa todos los campos requeridos',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        full_name: fullName,
        role,
        is_active: isActive,
      };

      let method = 'POST';
      let url = '/api/users';

      if (editingUser) {
        method = 'PATCH';
        url = '/api/users';
        payload.id = editingUser.id;
        if (password) {
          payload.password = password;
        }
      } else {
        payload.email = email;
        payload.password = password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo guardar el usuario');
      }

      toast({
        title: editingUser ? 'Usuario actualizado' : 'Usuario creado',
        description: editingUser
          ? 'Los datos del usuario se actualizaron correctamente'
          : 'El usuario se creó correctamente',
      });

      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('[v0] Save user error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar el usuario',
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
          Gestiona cuentas de admin, parlamentarios y observadores.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,1fr] gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {editingUser ? 'Editar usuario' : 'Crear nuevo usuario'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            {!editingUser && (
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
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña{editingUser ? ' (opcional)' : ''}
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'admin123'}
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

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Cuenta activa
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (editingUser ? 'Guardando...' : 'Creando...') : editingUser ? 'Actualizar usuario' : 'Crear usuario'}
              </Button>
              {editingUser && (
                <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={resetForm}>
                  Cancelar edición
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="p-6 overflow-x-auto">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Usuarios existentes</h2>
              <p className="text-slate-600 mt-1">
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <Button size="sm" variant="secondary" onClick={handleExportUsers}>
                Exportar usuarios CSV
              </Button>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o email"
                className="min-w-[220px]"
              />
              <select
                value={filterRole}
                onChange={(event) => setFilterRole(event.target.value as UserRole | 'all')}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">Todos los roles</option>
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.PARLIAMENTARIAN}>Parlamentario</option>
                <option value={UserRole.OBSERVER}>Observador</option>
              </select>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showOnlyActive}
                  onChange={(event) => setShowOnlyActive(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Solo activos
              </label>
            </div>
          </div>
        </div>

          {isLoading ? (
            <p className="text-slate-600">Cargando usuarios...</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-slate-600">No hay usuarios que coincidan con los filtros.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell className="text-sm">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.is_active ? 'Sí' : 'No'}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                    <TableCell className="space-x-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => handleEditUser(user)}>
                        Editar
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                        Eliminar
                      </Button>
                    </TableCell>
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
