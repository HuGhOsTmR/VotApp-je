'use client';

import { useEffect, useState } from 'react';
import { Motion, MotionStatus } from '@/lib/types';
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
import { MOTION_STATUS_LABELS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export function MotionsTable() {
  const [motions, setMotions] = useState<Motion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMotions();
  }, []);

  const fetchMotions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/motions');
      const result = await response.json();

      if (result.success) {
        setMotions(result.data || []);
      } else {
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las mociones',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Error fetching motions:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar las mociones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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

  const handleOpenMotion = async (motionId: string) => {
    try {
      // TODO: Implementar endpoint para abrir moción
      toast({
        title: 'Info',
        description: 'Función en desarrollo',
      });
    } catch (error) {
      console.error('[v0] Error opening motion:', error);
      toast({
        title: 'Error',
        description: 'Error al abrir la moción',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mociones</h2>
        <Button>Crear Moción</Button>
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
                <TableHead>Propositor</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {motions.map((motion) => (
                <TableRow key={motion.id}>
                  <TableCell className="font-medium max-w-md truncate">
                    {motion.title}
                  </TableCell>
                  <TableCell>{motion.motion_type}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(motion.status)}>
                      {MOTION_STATUS_LABELS[motion.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {motion.proposer_id ? 'Parlamentario' : '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(motion.created_at).toLocaleDateString('es-BO')}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {motion.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenMotion(motion.id)}
                      >
                        Abrir Votación
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">
                      Ver
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
