'use client';

import { useState } from 'react';
import { Motion, VoteType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { VOTE_LABELS, VOTE_COLORS, MESSAGES } from '@/lib/constants';

interface VotingInterfaceProps {
  motion: Motion;
  parliamentarianId: string;
  onVoteSuccess?: () => void;
}

export function VotingInterface({
  motion,
  parliamentarianId,
  onVoteSuccess,
}: VotingInterfaceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const handleVoteClick = (voteType: VoteType) => {
    setSelectedVote(voteType);
    setShowConfirmation(true);
  };

  const handleConfirmVote = async () => {
    if (!selectedVote) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motion_id: motion.id,
          parliamentarian_id: parliamentarianId,
          vote_type: selectedVote,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Éxito',
          description: MESSAGES.SUCCESS.VOTE_CAST,
        });
        setShowConfirmation(false);
        setSelectedVote(null);
        onVoteSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Error al registrar el voto',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[v0] Voting error:', error);
      toast({
        title: 'Error',
        description: MESSAGES.ERROR.SERVER_ERROR,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const voteButtons: { type: VoteType; label: string; color: string }[] = [
    {
      type: VoteType.FAVOR,
      label: VOTE_LABELS.favor,
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      type: VoteType.AGAINST,
      label: VOTE_LABELS.against,
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      type: VoteType.ABSTENTION,
      label: VOTE_LABELS.abstention,
      color: 'bg-yellow-600 hover:bg-yellow-700',
    },
    {
      type: VoteType.ABSENT,
      label: VOTE_LABELS.absent,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  if (showConfirmation && selectedVote) {
    return (
      <Card className="p-8 bg-white border-2 border-yellow-500">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-slate-900">
            Confirma tu Voto
          </h3>
          <p className="text-lg text-slate-700">
            Estás a punto de votar{' '}
            <span className="font-bold">{VOTE_LABELS[selectedVote]}</span> en
            esta moción.
          </p>
          <p className="text-sm text-slate-600 bg-yellow-50 p-4 rounded">
            ⚠️ Una vez confirmado, no podrás cambiar tu voto.
          </p>

          <div className="flex gap-4 flex-col sm:flex-row">
            <Button
              onClick={handleConfirmVote}
              disabled={isLoading}
              className="flex-1 h-16 sm:h-12 text-lg font-bold bg-green-600 hover:bg-green-700"
            >
              {isLoading ? 'Confirmando...' : 'Confirmar Voto'}
            </Button>
            <Button
              onClick={() => {
                setShowConfirmation(false);
                setSelectedVote(null);
              }}
              disabled={isLoading}
              variant="outline"
              className="flex-1 h-16 sm:h-12 text-lg font-bold"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {motion.title}
          </h3>
          {motion.description && (
            <p className="text-slate-600">{motion.description}</p>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-600 mb-6">
            Selecciona tu voto a continuación:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {voteButtons.map((btn) => (
            <Button
              key={btn.type}
              onClick={() => handleVoteClick(btn.type)}
              disabled={isLoading}
              className={`h-28 sm:h-24 text-lg font-bold text-white transition-all ${btn.color} flex flex-col items-center justify-center gap-2 w-full`}
            >
              <div className="text-3xl sm:text-2xl">
                {btn.type === 'favor'
                  ? '👍'
                  : btn.type === 'against'
                    ? '👎'
                    : btn.type === 'abstention'
                      ? '🤐'
                      : '❌'}
              </div>
              <span className="text-center">{btn.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
}
