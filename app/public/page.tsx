'use client';

import { useEffect, useState } from 'react';
import { Motion, MotionResults, Vote, Parliamentarian } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResultsDashboard } from '@/components/public/results-dashboard';
import { NominalList } from '@/components/public/nominal-list';
import { Spinner } from '@/components/ui/spinner';

interface MotionWithData extends Motion {
  results?: MotionResults;
  votes?: (Vote & { parliamentarians?: Parliamentarian })[];
}

export default function PublicDashboard() {
  const [motions, setMotions] = useState<MotionWithData[]>([]);
  const [selectedMotionIndex, setSelectedMotionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMotions();
    // Recargar resultados cada 5 segundos
    const interval = setInterval(fetchMotions, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchMotions = async () => {
    try {
      const response = await fetch('/api/motions');
      const result = await response.json();

      if (result.success) {
        const openMotions = (result.data || []).filter(
          (m: Motion) => m.status === 'open' || m.status === 'closed'
        );

        // Cargar resultados para cada moción
        const motionsWithResults = await Promise.all(
          openMotions.map(async (motion: Motion) => {
            const resultsResponse = await fetch(
              `/api/results/${motion.id}`
            );
            const resultsData = await resultsResponse.json();
            return {
              ...motion,
              results: resultsData.data?.results,
              votes: resultsData.data?.votes,
            };
          })
        );

        setMotions(motionsWithResults);
      }
    } catch (error) {
      console.error('[v0] Error fetching motions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && motions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Spinner className="w-12 h-12 mb-4 mx-auto" />
            <p className="text-slate-600">Cargando mociones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Resultados en Vivo
        </h1>
        <p className="text-slate-600 text-lg">
          Brigada Parlamentaria de Cochabamba, Bolivia
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Actualización automática cada 5 segundos
        </p>
      </div>

      {motions.length === 0 ? (
        <Card className="p-12 text-center bg-blue-50 border-blue-200">
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            Sin votaciones activas
          </h2>
          <p className="text-blue-800">
            Actualmente no hay mociones abiertas o cerradas. Espera a que se
            inicie una nueva votación.
          </p>
        </Card>
      ) : (
        <>
          {motions.length > 1 && (
            <Card className="p-4 bg-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium text-slate-700">
                  Moción {selectedMotionIndex + 1} de {motions.length}
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      setSelectedMotionIndex(
                        Math.max(0, selectedMotionIndex - 1)
                      )
                    }
                    disabled={selectedMotionIndex === 0}
                    variant="outline"
                    size="sm"
                  >
                    ← Anterior
                  </Button>
                  <Button
                    onClick={() =>
                      setSelectedMotionIndex(
                        Math.min(motions.length - 1, selectedMotionIndex + 1)
                      )
                    }
                    disabled={selectedMotionIndex === motions.length - 1}
                    variant="outline"
                    size="sm"
                  >
                    Siguiente →
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {motions[selectedMotionIndex] && (
            <>
              <ResultsDashboard
                motion={motions[selectedMotionIndex]}
                results={
                  motions[selectedMotionIndex].results || {
                    favor_count: 0,
                    against_count: 0,
                    abstention_count: 0,
                    absent_count: 0,
                    total_votes: 0,
                    quorum_met: false,
                  }
                }
              />

              {motions[selectedMotionIndex].votes && (
                <NominalList votes={motions[selectedMotionIndex].votes || []} />
              )}
            </>
          )}
        </>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          Transparencia Parlamentaria
        </h3>
        <p className="text-blue-800">
          Este dashboard es de acceso público. Todos los votos son nominales y
          están disponibles para consulta ciudadana. Los datos se actualizan en
          tiempo real durante las sesiones parlamentarias.
        </p>
      </div>
    </div>
  );
}
