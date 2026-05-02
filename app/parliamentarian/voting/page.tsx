'use client';

import { useEffect, useState } from 'react';
import { Motion } from '@/lib/types';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { VotingInterface } from '@/components/parliamentarian/voting-interface';
import { Spinner } from '@/components/ui/spinner';
import { ConnectionStatus } from '@/components/shared/connection-status';
import { logger } from '@/lib/logger';

export default function VotingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [motions, setMotions] = useState<Motion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [parliamentarianId, setParliamentarianId] = useState<string | null>(null);
  const [parliamentarianLoading, setParliamentarianLoading] = useState(true);
  const [selectedMotionIndex, setSelectedMotionIndex] = useState(0);

  useEffect(() => {
    fetchOpenMotions();
  }, []);

  useEffect(() => {
    const fetchParliamentarian = async () => {
      if (!user?.id || user.role !== 'parliamentarian') {
        setParliamentarianId(null);
        setParliamentarianLoading(false);
        return;
      }

      try {
        setParliamentarianLoading(true);
        const response = await fetch('/api/votes/user');
        const result = await response.json();

        if (result.success && result.data) {
          setParliamentarianId(result.data.id);
        } else {
          setParliamentarianId(null);
          logger.error('VOTING_PAGE', 'Parliamentarian lookup failed', result.error);
        }
      } catch (error) {
        logger.error('VOTING_PAGE', 'Error fetching parliamentarian', error);
        setParliamentarianId(null);
      } finally {
        setParliamentarianLoading(false);
      }
    };

    fetchParliamentarian();
  }, [user]);

  const fetchOpenMotions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/motions');
      const result = await response.json();

      if (result.success) {
        const openMotions = (result.data || []).filter(
          (m: Motion) => m.status === 'open'
        );
        setMotions(openMotions);
      }
    } catch (error) {
      logger.error('VOTING_PAGE', 'Error fetching motions', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading || parliamentarianLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner className="w-12 h-12 mb-4" />
          <p className="text-slate-600">Cargando información de votación...</p>
        </div>
      </div>
    );
  }

  if (!parliamentarianId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Votaciones</h1>
          <p className="text-slate-600 mt-2">
            Emite tus votos en las mociones abiertas
          </p>
        </div>

        <Card className="p-12 text-center bg-yellow-50 border-yellow-200">
          <h2 className="text-2xl font-bold text-yellow-900 mb-2">
            No estás registrado como parlamentario
          </h2>
          <p className="text-yellow-800">
            Tu cuenta no está vinculada a ningún parlamentario activo. Contacta al
            administrador para registrar tu perfil y poder votar.
          </p>
        </Card>
      </div>
    );
  }

  if (motions.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Votaciones</h1>
          <p className="text-slate-600 mt-2">
            Emite tus votos en las mociones abiertas
          </p>
        </div>

        <Card className="p-12 text-center bg-blue-50 border-blue-200">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            No hay mociones abiertas
          </h2>
          <p className="text-blue-800">
            Actualmente no hay mociones abiertas para votación. Espera a que el
            administrador abra una nueva votación.
          </p>
        </Card>
      </div>
    );
  }

  const currentMotion = motions[selectedMotionIndex];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Votaciones</h1>
          <p className="text-slate-600 mt-2">
            Mociones abiertas para votación: {motions.length}
          </p>
        </div>
        {/* Connection Status for Mobile */}
        <div className="sm:hidden">
          <ConnectionStatus showLabel={true} />
        </div>
      </div>

      {motions.length > 1 && (
        <Card className="p-4 bg-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Moción {selectedMotionIndex + 1} de {motions.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSelectedMotionIndex(
                    Math.max(0, selectedMotionIndex - 1)
                  )
                }
                disabled={selectedMotionIndex === 0}
                className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                ← Anterior
              </button>
              <button
                onClick={() =>
                  setSelectedMotionIndex(
                    Math.min(motions.length - 1, selectedMotionIndex + 1)
                  )
                }
                disabled={selectedMotionIndex === motions.length - 1}
                className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </Card>
      )}

      <VotingInterface
        motion={currentMotion}
        parliamentarianId={parliamentarianId}
        onVoteSuccess={() => {
          fetchOpenMotions();
          if (selectedMotionIndex < motions.length - 1) {
            setSelectedMotionIndex(selectedMotionIndex + 1);
          }
        }}
      />
    </div>
  );
}
