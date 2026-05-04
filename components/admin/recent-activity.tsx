'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const RECENT_ACTIVITIES = [
  {
    event: 'Nueva sesión creada',
    time: 'Hace 2 horas',
    status: 'activa' as const,
  },
  {
    event: 'Moción #5 cerrada',
    time: 'Hace 4 horas',
    status: 'finalizada' as const,
  },
  {
    event: 'Parlamentario Juan Pérez agregado',
    time: 'Ayer',
    status: 'nueva' as const,
  },
  {
    event: 'Usuario administrador registrado',
    time: '2 días',
    status: 'activa' as const,
  },
];

const statusStyles = {
  activa: 'bg-green-100 text-green-800',
  finalizada: 'bg-blue-100 text-blue-800',
  nueva: 'bg-gray-100 text-gray-800',
} as const;

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead className="w-32 text-right">Fecha</TableHead>
              <TableHead className="w-24 text-right">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {RECENT_ACTIVITIES.map((activity, index) => (
              <TableRow key={index} className="hover:bg-slate-50/50">
                <TableCell>{activity.event}</TableCell>
                <TableCell className="text-right font-medium">{activity.time}</TableCell>
                <TableCell>
                  <Badge className={statusStyles[activity.status]}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
