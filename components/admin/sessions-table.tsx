'use client';

import { useEffect, useState } from 'react';
import { Session, SessionStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SESSION_STATUS_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

const emptyForm = {
  legislature_number: 1,
  session_date: '',
  start_time: '',
  end_time: '',
  title: '',
  description: '',
  quorum_required: 50,
  status: SessionStatus.SCHEDULED,
};

export function SessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/sessions');
      const result = await response.json();

      if (result.success) {
        setSessions(result.data || []);
      } else {
        toast({
          title: 'Error',
          description: result.error || 'No se pudieron cargar las sesiones',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error fetching sessions:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar las sesiones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEditingSession(null);
    setFormData(emptyForm);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditDialog = (session: Session) => {
    setEditingSession(session);
    setFormData({
      legislature_number: session.legislature_number,
      session_date: session.session_date,
      start_time: session.start_time || '',
      end_time: session.end_time || '',
      title: session.title || '',
      description: session.description || '',
      quorum_required: session.quorum_required,
      status: session.status,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setIsSaving(true);
      const payload: Record<string, any> = {
        ...formData,
        legislature_number: Number(formData.legislature_number),
        quorum_required: Number(formData.quorum_required),
      };

      if (editingSession) {
        payload.id = editingSession.id;
      }

      const response = await fetch('/api/sessions', {
        method: editingSession ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'No se pudo guardar la sesión');
      }

      toast({
        title: editingSession ? 'Sesión actualizada' : 'Sesión creada',
        description: editingSession
          ? 'Los datos de la sesión fueron actualizados.'
          : 'La sesión fue registrada correctamente.',
      });
      setIsOpen(false);
      resetForm();
      fetchSessions();
    } catch (error) {
      console.error('[v0] Error saving session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar la sesión',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('¿Seguro que deseas cancelar esta sesión?')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions?id=${sessionId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo cancelar la sesión');
      }
      toast({ title: 'Sesión cancelada', description: 'La sesión quedó marcada como cancelada.' });
      fetchSessions();
    } catch (error) {
      console.error('[v0] Error deleting session:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo cancelar la sesión',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: SessionStatus): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Sesiones Parlamentarias</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Crear Sesión</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Editar Sesión' : 'Crear Sesión'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="legislature_number">Legislatura *</Label>
                  <Input
                    id="legislature_number"
                    type="number"
                    min="1"
                    value={formData.legislature_number}
                    onChange={(event) => setFormData({ ...formData, legislature_number: Number(event.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="session_date">Fecha *</Label>
                  <Input
                    id="session_date"
                    type="date"
                    value={formData.session_date}
                    onChange={(event) => setFormData({ ...formData, session_date: event.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="start_time">Hora inicio</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(event) => setFormData({ ...formData, start_time: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">Hora fin</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(event) => setFormData({ ...formData, end_time: event.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="quorum_required">Quórum requerido</Label>
                  <Input
                    id="quorum_required"
                    type="number"
                    min="1"
                    value={formData.quorum_required}
                    onChange={(event) => setFormData({ ...formData, quorum_required: Number(event.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: SessionStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SessionStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {SESSION_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="Ej: Sesión ordinaria"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder="Detalle de la agenda o notas de la sesión"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : editingSession ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Cargando sesiones...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600">No hay sesiones creadas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número de Legislatura</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Hora Inicio</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Quórum Requerido</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{session.legislature_number}</TableCell>
                  <TableCell>{session.session_date}</TableCell>
                  <TableCell>{session.start_time || '-'}</TableCell>
                  <TableCell>{session.title || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)}>
                      {SESSION_STATUS_LABELS[session.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{session.quorum_required}</TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(session)}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSession(session.id)}>
                      Cancelar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
