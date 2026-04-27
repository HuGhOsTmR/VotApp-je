'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
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
import { VOTE_LABELS, VOTE_COLORS, MOTION_STATUS_LABELS } from '@/lib/constants';

interface VoteHistory {
  id: string;
  motion_id: string;
  motion_title: string;
  motion_status: string;
  vote_type: string;
  timestamp: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [votes, setVotes] = useState<VoteHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Cargar historial de votos del usuario desde la API
    setIsLoading(false);
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Mi Historial</h1>
        <p className="text-slate-600 mt-2">
          Revisa todos tus votos y decisiones parlamentarias
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Mis Votos</h2>

        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-slate-600">Cargando historial...</p>
          </div>
        ) : votes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-600 text-lg">
              Aún no has emitido ningún voto
            </p>
            <p className="text-slate-500 mt-2">
              Tu historial de votos aparecerá aquí
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Moción</TableHead>
                  <TableHead>Tu Voto</TableHead>
                  <TableHead>Estado de Moción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {votes.map((vote) => (
                  <TableRow key={vote.id}>
                    <TableCell className="text-sm">
                      {new Date(vote.timestamp).toLocaleString('es-BO')}
                    </TableCell>
                    <TableCell className="font-medium max-w-md truncate">
                      {vote.motion_title}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`
                          ${vote.vote_type === 'favor' ? 'bg-green-100 text-green-800' : ''}
                          ${vote.vote_type === 'against' ? 'bg-red-100 text-red-800' : ''}
                          ${vote.vote_type === 'abstention' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${vote.vote_type === 'absent' ? 'bg-gray-100 text-gray-800' : ''}
                        `}
                      >
                        {VOTE_LABELS[vote.vote_type as keyof typeof VOTE_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {MOTION_STATUS_LABELS[vote.motion_status as keyof typeof MOTION_STATUS_LABELS]}
                      </Badge>
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
          Este historial registra todos tus votos en las mociones. Cada voto es
          público y nominal de acuerdo con los reglamentos parlamentarios.
        </p>
      </div>
    </div>
  );
}
