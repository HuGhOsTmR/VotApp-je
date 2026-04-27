'use client';

import { Vote, Parliamentarian } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VOTE_LABELS, VOTE_COLORS } from '@/lib/constants';

interface NominalListProps {
  votes: (Vote & { parliamentarians?: Parliamentarian })[];
}

export function NominalList({ votes }: NominalListProps) {
  // Agrupar votos por partido político
  const votesByParty = votes.reduce(
    (acc, vote) => {
      const party = vote.parliamentarians?.political_party || 'Independiente';
      if (!acc[party]) {
        acc[party] = [];
      }
      acc[party].push(vote);
      return acc;
    },
    {} as Record<string, typeof votes>
  );

  return (
    <Card className="p-6 bg-white">
      <h3 className="text-lg font-bold text-slate-900 mb-6">
        Listado Nominal de Votos
      </h3>

      <div className="space-y-8">
        {Object.entries(votesByParty).map(([party, partyVotes]) => {
          const favorCount = partyVotes.filter(
            (v) => v.vote_type === 'favor'
          ).length;
          const againstCount = partyVotes.filter(
            (v) => v.vote_type === 'against'
          ).length;
          const abstentionCount = partyVotes.filter(
            (v) => v.vote_type === 'abstention'
          ).length;
          const absentCount = partyVotes.filter(
            (v) => v.vote_type === 'absent'
          ).length;

          return (
            <div key={party}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b-2">
                <h4 className="font-bold text-slate-900 text-lg">{party}</h4>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-semibold">
                    ✓ {favorCount}
                  </span>
                  <span className="text-red-600 font-semibold">
                    ✗ {againstCount}
                  </span>
                  <span className="text-yellow-600 font-semibold">
                    ≈ {abstentionCount}
                  </span>
                  <span className="text-gray-600 font-semibold">
                    — {absentCount}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {partyVotes.map((vote) => (
                  <div
                    key={vote.id}
                    className={`p-3 rounded-lg border-2 ${
                      vote.vote_type === 'favor'
                        ? 'border-green-200 bg-green-50'
                        : vote.vote_type === 'against'
                          ? 'border-red-200 bg-red-50'
                          : vote.vote_type === 'abstention'
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">
                      {vote.parliamentarians?.full_name || 'Parlamentario'}
                    </p>
                    <Badge
                      className={`mt-2 ${
                        vote.vote_type === 'favor'
                          ? 'bg-green-100 text-green-800'
                          : vote.vote_type === 'against'
                            ? 'bg-red-100 text-red-800'
                            : vote.vote_type === 'abstention'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {VOTE_LABELS[vote.vote_type]}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {votes.length === 0 && (
        <div className="text-center py-8 text-slate-600">
          <p>No hay votos registrados aún para esta moción</p>
        </div>
      )}
    </Card>
  );
}
