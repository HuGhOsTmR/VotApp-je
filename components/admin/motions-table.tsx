'use client';

import { useEffect, useState } from 'react';
import { Motion, MotionStatus, MotionType, Parliamentarian, Session } from '@/lib/types';
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
import { MOTION_STATUS_LABELS, MOTION_TYPE_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

const emptyForm = {
  session_id: '',
  title: '',
  description: '',
  proposer_id: '',
  motion_type: MotionType.RESOLUTION,
  status: MotionStatus.PENDING,
};

export function MotionsTable() {
  const [motions, setMotions] = useState<Motion[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [parliamentarians, setParliamentarians] = useState<Parliamentarian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingMotion, setEditingMotion] = useState<Motion | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [motionsResponse, sessionsResponse, parliamentariansResponse] = await Promise.all([
        fetch('/api/motions'),
        fetch('/api/sessions'),
        fetch('/api/parliamentarians'),
      ]);
      const [motionsResult, sessionsResult, parliamentariansResult] = await Promise.all([
        motionsResponse.json(),
        sessionsResponse.json(),
        parliamentariansResponse.json(),
      ]);

      if (motionsResult.success) {
        setMotions(motionsResult.data || []);
      } else {
        throw new Error(motionsResult.error || 'No se pudieron cargar las mociones');
      }

      if (sessionsResult.success) {
        setSessions(sessionsResult.data || []);
      }

      if (parliamentariansResult.success) {
        setParliamentarians(parliamentariansResult.data || []);
      }
    } catch (error) {
      console.error('[v0] Error fetching motions data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cargar las mociones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMotions = async () => {
    const response = await fetch('/api/motions');
    const result = await response.json();
    if (result.success) {
      setMotions(result.data || []);
    }
  };

  const resetForm = () => {
    setEditingMotion(null);
    setFormData({
      ...emptyForm,
      session_id: sessions[0]?.id || '',
      proposer_id: parliamentarians[0]?.id || '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditDialog = (motion: Motion) => {
    setEditingMotion(motion);
    setFormData({
      session_id: motion.session_id,
      title: motion.title,
      description: motion.description || '',
      proposer_id: motion.proposer_id || '',
      motion_type: motion.motion_type,
      status: motion.status,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.session_id || !formData.title || !formData.proposer_id) {
      toast({
        title: 'Campos incompletos',
        description: 'Selecciona sesión, proponente y título.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(editingMotion ? `/api/motions/${editingMotion.id}` : '/api/motions', {
        method: editingMotion ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'No se pudo guardar la moción');
      }

      toast({
        title: editingMotion ? 'Moción actualizada' : 'Moción creada',
        description: editingMotion
          ? 'Los datos de la moción fueron actualizados.'
          : 'La moción fue registrada correctamente.',
      });
      setIsOpen(false);
      resetForm();
      fetchMotions();
    } catch (error) {
      console.error('[v0] Error saving motion:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al guardar la moción',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateMotionStatus = async (motion: Motion, status: MotionStatus) => {
    try {
      const response = await fetch(`/api/motions/${motion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo actualizar la moción');
      }
      toast({ title: 'Moción actualizada', description: `Estado: ${MOTION_STATUS_LABELS[status]}` });
      fetchMotions();
    } catch (error) {
      console.error('[v0] Error updating motion status:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo actualizar la moción',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMotion = async (motionId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta moción pendiente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/motions/${motionId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo eliminar la moción');
      }
      toast({ title: 'Moción eliminada', description: 'La moción fue removida correctamente.' });
      fetchMotions();
    } catch (error) {
      console.error('[v0] Error deleting motion:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar la moción',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: MotionStatus): string => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getParliamentarianName = (id?: string) =>
    parliamentarians.find((parliamentarian) => parliamentarian.id === id)?.full_name || '-';

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mociones</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>Crear Moción</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle>{editingMotion ? 'Editar Moción' : 'Crear Moción'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <Label htmlFor="session_id">Sesión *</Label>
                <Select value={formData.session_id} onValueChange={(value) => setFormData({ ...formData, session_id: value })}>
                  <SelectTrigger id="session_id">
                    <SelectValue placeholder="Seleccionar sesión" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id}>
                        {session.title || `Legislatura ${session.legislature_number}`} — {session.session_date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                  placeholder="Título de la moción"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                  placeholder="Detalle de la moción"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="proposer_id">Proponente *</Label>
                  <Select value={formData.proposer_id} onValueChange={(value) => setFormData({ ...formData, proposer_id: value })}>
                    <SelectTrigger id="proposer_id">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {parliamentarians.map((parliamentarian) => (
                        <SelectItem key={parliamentarian.id} value={parliamentarian.id}>
                          {parliamentarian.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="motion_type">Tipo</Label>
                  <Select
                    value={formData.motion_type}
                    onValueChange={(value: MotionType) => setFormData({ ...formData, motion_type: value })}
                  >
                    <SelectTrigger id="motion_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(MotionType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {MOTION_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: MotionStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(MotionStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {MOTION_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : editingMotion ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Cargando mociones...</p>
        </div>
      ) : motions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600">No hay mociones creadas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Proponente</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {motions.map((motion) => (
                <TableRow key={motion.id}>
                  <TableCell className="font-medium max-w-md truncate">{motion.title}</TableCell>
                  <TableCell>{MOTION_TYPE_LABELS[motion.motion_type] || motion.motion_type}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(motion.status)}>
                      {MOTION_STATUS_LABELS[motion.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{getParliamentarianName(motion.proposer_id)}</TableCell>
                  <TableCell>{new Date(motion.created_at).toLocaleDateString('es-BO')}</TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap">
                    {motion.status === MotionStatus.PENDING && (
                      <Button variant="outline" size="sm" onClick={() => updateMotionStatus(motion, MotionStatus.OPEN)}>
                        Abrir Votación
                      </Button>
                    )}
                    {motion.status === MotionStatus.OPEN && (
                      <Button variant="outline" size="sm" onClick={() => updateMotionStatus(motion, MotionStatus.CLOSED)}>
                        Cerrar
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(motion)}>
                      Editar
                    </Button>
                    {motion.status === MotionStatus.PENDING && (
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteMotion(motion.id)}>
                        Eliminar
                      </Button>
                    )}
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
