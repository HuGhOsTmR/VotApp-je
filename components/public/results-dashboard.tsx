'use client';

import { useEffect, useState } from 'react';
import { Motion, MotionResults } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MOTION_STATUS_LABELS, VOTE_LABELS, VOTE_COLORS } from '@/lib/constants';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ResultsDashboardProps {
  motion: Motion;
  results: MotionResults;
  onMotionSelect?: (motionId: string) => void;
}

export function ResultsDashboard({
  motion,
  results,
  onMotionSelect,
}: ResultsDashboardProps) {
  const [chartData, setChartData] = useState<
    { name: string; value: number; fill: string }[]
  >([]);

  useEffect(() => {
    // Preparar datos para los gráficos
    const data = [
      { name: VOTE_LABELS.favor, value: results.favor_count, fill: VOTE_COLORS.favor },
      {
        name: VOTE_LABELS.against,
        value: results.against_count,
        fill: VOTE_COLORS.against,
      },
      {
        name: VOTE_LABELS.abstention,
        value: results.abstention_count,
        fill: VOTE_COLORS.abstention,
      },
    ];
    setChartData(data.filter((d) => d.value > 0));
  }, [results]);

  const approvalPercentage =
    results.total_votes > 0
      ? ((results.favor_count / results.total_votes) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{motion.title}</h2>
            <p className="text-slate-600 mt-2">{motion.description}</p>
          </div>
          <Badge>{MOTION_STATUS_LABELS[motion.status]}</Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {results.favor_count}
            </p>
            <p className="text-sm text-slate-600">A Favor</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-red-600">
              {results.against_count}
            </p>
            <p className="text-sm text-slate-600">En Contra</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {results.abstention_count}
            </p>
            <p className="text-sm text-slate-600">Abstenciones</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-600">
              {results.absent_count}
            </p>
            <p className="text-sm text-slate-600">Ausentes</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-900">
              {results.total_votes}
            </p>
            <p className="text-sm text-slate-600">Total Votos</p>
          </div>
        </div>
      </Card>

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Distribución de Votos
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-white">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Análisis
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600">Aprobación</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-green-600 h-full flex items-center justify-center text-white font-bold text-sm transition-all"
                      style={{ width: `${approvalPercentage}%` }}
                    >
                      {parseFloat(approvalPercentage) > 10
                        ? `${approvalPercentage}%`
                        : ''}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-sm text-slate-600">
                  <strong>Quórum:</strong>{' '}
                  {results.quorum_met ? (
                    <span className="text-green-600">✓ Alcanzado</span>
                  ) : (
                    <span className="text-red-600">✗ No alcanzado</span>
                  )}
                </p>
                <p className="text-sm text-slate-600">
                  <strong>Participación:</strong>{' '}
                  {((results.total_votes / 50) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
