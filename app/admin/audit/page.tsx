'use client';

import { useEffect, useState } from 'react';
import { AuditLog } from '@/lib/types';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Cargar logs de auditoría del servidor
    setIsLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Auditoría</h1>
        <p className="text-slate-600 mt-2">
          Registro inmutable de todas las acciones del sistema
        </p>
      </div>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Logs de Auditoría</h2>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-slate-600">Cargando logs...</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">No hay registros de auditoría</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Tipo de Entidad</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {new Date(log.timestamp).toLocaleString('es-BO')}
                    </TableCell>
                    <TableCell>--</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.action}</Badge>
                    </TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell className="text-sm font-mono">
                      {log.ip_address || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.details
                        ? JSON.stringify(log.details).substring(0, 50) + '...'
                        : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Información</h3>
        <p className="text-blue-800">
          El log de auditoría registra automáticamente todas las acciones del
          sistema, incluyendo creación de sesiones, mociones, votos y cambios
          administrativos. Los registros son inmutables para garantizar
          integridad.
        </p>
      </div>
    </div>
  );
}
