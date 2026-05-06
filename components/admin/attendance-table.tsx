'use client';

import { useEffect, useMemo, useState } from 'react';
import { Attendance, AttendanceStatus, Parliamentarian, Session } from '@/lib/types';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

type AttendanceWithRelations = Attendance & {
  sessions?: Pick<Session, 'id' | 'title' | 'session_date'> | null;
  parliamentarians?: Pick<Parliamentarian, 'id' | 'full_name' | 'political_party'> | null;
};

const emptyForm = {
  session_id: '',
  parliamentarian_id: '',
  status: AttendanceStatus.PRESENT,
};

export function AttendanceTable() {
  const [attendance, setAttendance] = useState<AttendanceWithRelations[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [parliamentarians, setParliamentarians] = useState<Parliamentarian[]>([]);
  const [sessionFilter, setSessionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<AttendanceWithRelations | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [attendanceResponse, sessionsResponse, parliamentariansResponse] = await Promise.all([
        fetch('/api/attendance'),
        fetch('/api/sessions'),
        fetch('/api/parliamentarians'),
      ]);

      const [attendanceResult, sessionsResult, parliamentariansResult] = await Promise.all([
        attendanceResponse.json(),
        sessionsResponse.json(),
        parliamentariansResponse.json(),
      ]);

      if (attendanceResult.success) {
        setAttendance(attendanceResult.data || []);
      } else {
        throw new Error(attendanceResult.error || 'No se pudo cargar la asistencia');
      }

      if (sessionsResult.success) {
        setSessions(sessionsResult.data || []);
      }

      if (parliamentariansResult.success) {
        setParliamentarians(parliamentariansResult.data || []);
      }
    } catch (error) {
      console.error('[v0] Error fetching attendance data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Error al cargar la asistencia',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    const response = await fetch('/api/attendance');
    const result = await response.json();
    if (result.success) {
      setAttendance(result.data || []);
    }
  };

  const filteredAttendance = useMemo(() => {
    if (sessionFilter === 'all') {
      return attendance;
    }

    return attendance.filter((record) => record.session_id === sessionFilter);
  }, [attendance, sessionFilter]);

  const resetForm = () => {
    setEditingAttendance(null);
    setFormData({
      ...emptyForm,
      session_id: sessionFilter !== 'all' ? sessionFilter : sessions[0]?.id || '',
      parliamentarian_id: parliamentarians[0]?.id || '',
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditDialog = (record: AttendanceWithRelations) => {
    setEditingAttendance(record);
    setFormData({
      session_id: record.session_id,
      parliamentarian_id: record.parliamentarian_id,
      status: record.status,
    });
    setIsOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.session_id || !formData.parliamentarian_id || !formData.status) {
      toast({
        title: 'Campos incompletos',
        description: 'Selecciona sesión, parlamentario y estado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      const payload = editingAttendance
        ? { id: editingAttendance.id, status: formData.status }
        : formData;
      const response = await fetch('/api/attendance', {
        method: editingAttendance ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'No se pudo guardar la asistencia');
      }

      toast({
        title: editingAttendance ? 'Asistencia actualizada' : 'Asistencia registrada',
        description: editingAttendance
          ? 'El estado de asistencia fue actualizado.'
          : 'El registro de asistencia fue creado correctamente.',
      });
      setIsOpen(false);
      resetForm();
      fetchAttendance();
    } catch (error) {
      console.error('[v0] Error saving attendance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo guardar la asistencia',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttendance = async (attendanceId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este registro de asistencia?')) {
      return;
    }

    try {
      const response = await fetch(`/api/attendance?id=${attendanceId}`, { method: 'DELETE' });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'No se pudo eliminar el registro de asistencia');
      }
      toast({ title: 'Asistencia eliminada', description: 'El registro fue removido correctamente.' });
      fetchAttendance();
    } catch (error) {
      console.error('[v0] Error deleting attendance:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo eliminar la asistencia',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: AttendanceStatus): string => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'bg-green-100 text-green-800';
      case AttendanceStatus.ABSENT:
        return 'bg-red-100 text-red-800';
      case AttendanceStatus.EXCUSED:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSessionLabel = (session: Pick<Session, 'legislature_number' | 'title' | 'session_date'>) =>
    `${session.title || `Legislatura ${session.legislature_number}`} — ${session.session_date}`;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Asistencia</h2>
          <p className="text-sm text-slate-600">
            Registra y actualiza la asistencia usada para el cálculo de quórum.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Select value={sessionFilter} onValueChange={setSessionFilter}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Filtrar por sesión" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sesiones</SelectItem>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {getSessionLabel(session)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>Registrar Asistencia</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAttendance ? 'Editar Asistencia' : 'Registrar Asistencia'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="session_id">Sesión *</Label>
                  <Select
                    value={formData.session_id}
                    onValueChange={(value) => setFormData({ ...formData, session_id: value })}
                    disabled={Boolean(editingAttendance)}
                  >
                    <SelectTrigger id="session_id">
                      <SelectValue placeholder="Seleccionar sesión" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {getSessionLabel(session)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="parliamentarian_id">Parlamentario *</Label>
                  <Select
                    value={formData.parliamentarian_id}
                    onValueChange={(value) => setFormData({ ...formData, parliamentarian_id: value })}
                    disabled={Boolean(editingAttendance)}
                  >
                    <SelectTrigger id="parliamentarian_id">
                      <SelectValue placeholder="Seleccionar parlamentario" />
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
                  <Label htmlFor="status">Estado *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: AttendanceStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(AttendanceStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {ATTENDANCE_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : editingAttendance ? 'Actualizar' : 'Registrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-slate-600">Cargando asistencia...</p>
        </div>
      ) : filteredAttendance.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-600">No hay registros de asistencia</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sesión</TableHead>
                <TableHead>Parlamentario</TableHead>
                <TableHead>Partido</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registrado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {record.sessions
                      ? `${record.sessions.title || 'Sesión'} — ${record.sessions.session_date}`
                      : record.session_id}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record.parliamentarians?.full_name || record.parliamentarian_id}
                  </TableCell>
                  <TableCell>{record.parliamentarians?.political_party || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(record.status)}>
                      {ATTENDANCE_STATUS_LABELS[record.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(record.created_at).toLocaleString('es-BO')}</TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(record)}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteAttendance(record.id)}>
                      Eliminar
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
