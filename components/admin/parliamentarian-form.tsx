'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Parliamentarian, UserProfile } from '@/lib/types';

interface ParliamentarianFormProps {
  parliamentarian?: Parliamentarian;
  onSuccess?: () => void;
}

export function ParliamentarianForm({ parliamentarian, onSuccess }: ParliamentarianFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  
  const initialFormData: Record<string, string> = {
    full_name: parliamentarian?.full_name || '',
    political_party: parliamentarian?.political_party || '',
    circumscription: parliamentarian?.circumscription || '',
    email: parliamentarian?.email || '',
    phone_number: parliamentarian?.phone_number || '',
    photo_url: parliamentarian?.photo_url || '',
  };
  
  if (parliamentarian?.user_id) {
    initialFormData.user_id = parliamentarian.user_id;
  }
  
  const [formData, setFormData] = useState(initialFormData);
  const { toast } = useToast();

  useEffect(() => {
    const fetchParliamentarianUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const result = await response.json();
        if (result.success) {
          setUsers(result.data || []);
        }
      } catch (error) {
        console.error('[v0] Error fetching users for parliamentarian form:', error);
      }
    };

    fetchParliamentarianUsers();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.full_name || !formData.political_party || !formData.circumscription) {
      toast({
        title: 'Campos requeridos',
        description: 'Nombre completo, partido político y circunscripción son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);
      const method = parliamentarian ? 'PUT' : 'POST';
      const url = parliamentarian
        ? `/api/parliamentarians/${parliamentarian.id}`
        : '/api/parliamentarians';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: formData.user_id || null,
          ...(parliamentarian ? { id: parliamentarian.id } : {}),
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: parliamentarian ? 'Parlamentario actualizado' : 'Parlamentario creado',
          description: parliamentarian
            ? 'Los datos del parlamentario han sido actualizados'
            : 'El parlamentario ha sido registrado exitosamente',
        });
        setIsOpen(false);
        setFormData({
          full_name: '',
          political_party: '',
          circumscription: '',
          email: '',
          phone_number: '',
          photo_url: '',
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (formData as any).user_id;
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudo guardar el parlamentario',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error saving parliamentarian:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar el parlamentario',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const politicalParties = [
    'MAS',
    'UN',
    'CC',
    'PDC',
    'PAN-BOL',
    'Independiente',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          {parliamentarian ? 'Editar Parlamentario' : 'Agregar Parlamentario'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {parliamentarian ? 'Editar Parlamentario' : 'Agregar Parlamentario'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Nombre Completo *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Ej: Juan Pérez García"
              required
            />
          </div>

          <div>
            <Label htmlFor="political_party">Partido Político *</Label>
            <Select
              value={formData.political_party}
              onValueChange={(value: string) => setFormData({ ...formData, political_party: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar partido político" />
              </SelectTrigger>
              <SelectContent>
                {politicalParties.map((party) => (
                  <SelectItem key={party} value={party}>
                    {party}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="circumscription">Circunscripción *</Label>
            <Input
              id="circumscription"
              value={formData.circumscription}
              onChange={(e) => setFormData({ ...formData, circumscription: e.target.value })}
              placeholder="Ej: La Paz"
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <Label htmlFor="phone_number">Teléfono</Label>
            <Input
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              placeholder="+591 12345678"
            />
          </div>

          <div>
            <Label htmlFor="user_id">Cuenta de usuario vinculada</Label>
            <select
              id="user_id"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="">No vincular cuenta</option>
              {users
                .filter((user) => user.role === 'parliamentarian')
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name} — {user.email}
                  </option>
                ))}
            </select>
            <p className="text-sm text-slate-500 mt-1">
              Selecciona la cuenta de usuario que representa a este parlamentario.
            </p>
          </div>

          <div>
            <Label htmlFor="photo_url">URL de Foto de Perfil</Label>
            <Input
              id="photo_url"
              type="url"
              value={formData.photo_url}
              onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://ejemplo.com/foto.jpg"
            />
            <p className="text-sm text-slate-500 mt-1">
              Opcional: URL de una imagen para el perfil del parlamentario
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : parliamentarian ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
