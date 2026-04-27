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
import { SESSION_STATUS_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export function SessionsTable() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          description: 'No se pudieron cargar las sesiones',
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
        <Button>Crear Sesión</Button>
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
                  <TableCell className="font-medium">
                    {session.legislature_number}
                  </TableCell>
                  <TableCell>{session.session_date}</TableCell>
                  <TableCell>{session.start_time || '-'}</TableCell>
                  <TableCell>{session.title || '-'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(session.status)}>
                      {SESSION_STATUS_LABELS[session.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>{session.quorum_required}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Editar
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
