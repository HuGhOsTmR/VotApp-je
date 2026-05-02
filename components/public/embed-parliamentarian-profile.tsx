'use client';

import { useEffect, useState } from 'react';
import { Parliamentarian, Motion, Vote } from '@/lib/types';

interface ParliamentarianProfileWidgetProps {
  institution: string;
  parliamentarianId: string;
  theme?: 'light' | 'dark';
  showStats?: boolean;
  showVotingHistory?: boolean;
}

interface VoteRecord {
  motion: Motion;
  vote: Vote;
}

export function ParliamentarianProfileWidget({
  institution,
  parliamentarianId,
  theme = 'light',
  showStats = true,
  showVotingHistory = true,
}: ParliamentarianProfileWidgetProps) {
  const [parliamentarian, setParliamentarian] = useState<Parliamentarian | null>(null);
  const [stats, setStats] = useState<{ favor: number; against: number; abstention: number; total: number } | null>(null);
  const [votingHistory, setVotingHistory] = useState<VoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [institution, parliamentarianId]);

  const fetchData = async () => {
    try {
      // Fetch parliamentarian profile
      const parliamentariansRes = await fetch(
        `/api/public/${institution}/parliamentarians?limit=1`
      );
      const parliamentariansData = await parliamentariansRes.json();

      const found = parliamentariansData.data?.find(
        (p: Parliamentarian) => p.id === parliamentarianId
      );

      if (found) {
        setParliamentarian(found);

        // Fetch voting history
        const votesRes = await fetch(
          `/api/public/${institution}/motions?limit=100`
        );
        const votesData = await votesRes.json();

        if (votesData.success && votesData.data?.length > 0) {
          // Filter to get votes for this parliamentarian
          // This is a simplified version - in production you'd have a dedicated endpoint
          const history: VoteRecord[] = [];
          
          for (const motion of votesData.data) {
            if (motion.results?.votes) {
              const vote = motion.results.votes.find(
                (v: Vote & { parliamentarians?: Parliamentarian }) => 
                  v.parliamentarian_id === parliamentarianId ||
                  v.parliamentarians?.id === parliamentarianId
              );
              
              if (vote) {
                history.push({
                  motion: {
                    id: motion.id,
                    title: motion.title,
                    status: motion.status,
                    created_at: motion.created_at,
                  } as Motion,
                  vote: {
                    id: vote.id,
                    motion_id: vote.motion_id,
                    vote_type: vote.vote_type,
                    timestamp: vote.timestamp,
                  } as Vote,
                });
              }
            }
          }

          // Calculate stats
          const favorCount = history.filter(h => h.vote.vote_type === 'favor').length;
          const againstCount = history.filter(h => h.vote.vote_type === 'against').length;
          const abstentionCount = history.filter(h => h.vote.vote_type === 'abstention').length;

          setStats({
            favor: favorCount,
            against: againstCount,
            abstention: abstentionCount,
            total: history.length,
          });

          setVotingHistory(history.slice(0, 5));
        }
      } else {
        setError('Parliamentarian not found');
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  if (isLoading) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        background: bgColor, 
        color: textColor,
        borderRadius: '8px',
      }}>
        Cargando...
      </div>
    );
  }

  if (error || !parliamentarian) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        background: bgColor, 
        color: textColor,
        borderRadius: '8px',
      }}>
        {error || 'Parlamentario no encontrado'}
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '320px',
      background: bgColor,
      color: textColor,
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      {/* Header with photo and name */}
      <div style={{ padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {parliamentarian.photo_url ? (
            <img 
              src={parliamentarian.photo_url} 
              alt={parliamentarian.full_name}
              style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{ 
              width: '48px', 
              height: '48px', 
              borderRadius: '50%',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px',
            }}>
              {parliamentarian.full_name.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
              {parliamentarian.full_name}
            </div>
            <div style={{ fontSize: '13px', color: subTextColor }}>
              {parliamentarian.political_party} · {parliamentarian.circumscription}
            </div>
          </div>
        </div>
      </div>

      {/* Voting statistics */}
      {showStats && stats && stats.total > 0 && (
        <div style={{ padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: subTextColor }}>
            ESTADÍSTICAS DE VOTACIÓN
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e' }}>
                {stats.favor}
              </div>
              <div style={{ fontSize: '11px', color: subTextColor }}>A Favor</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
                {stats.against}
              </div>
              <div style={{ fontSize: '11px', color: subTextColor }}>En Contra</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
                {stats.abstention}
              </div>
              <div style={{ fontSize: '11px', color: subTextColor }}>Abstención</div>
            </div>
          </div>
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: subTextColor,
            textAlign: 'center',
          }}>
            {stats.total} votaciones registradas
          </div>
        </div>
      )}

      {/* Voting history */}
      {showVotingHistory && votingHistory.length > 0 && (
        <div style={{ padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: subTextColor }}>
            ÚLTIMOS VOTOS
          </div>
          {votingHistory.map((record) => (
            <div key={record.vote.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: `1px solid ${borderColor}`,
              fontSize: '12px',
            }}>
              <span style={{ flex: 1, marginRight: '8px' }}>
                {record.motion.title.substring(0, 30)}
                {record.motion.title.length > 30 ? '...' : ''}
              </span>
              <span style={{ 
                fontWeight: 'bold',
                color: record.vote.vote_type === 'favor' ? '#22c55e' 
                  : record.vote.vote_type === 'against' ? '#ef4444' 
                  : '#f59e0b',
              }}>
                {record.vote.vote_type === 'favor' ? '✓' 
                  : record.vote.vote_type === 'against' ? '✗' 
                  : '○'}
              </span>
            </div>
          ))}
        </div>
      )}

      {(!showStats || stats?.total === 0) && (
        <div style={{ padding: '16px', textAlign: 'center', color: subTextColor, fontSize: '13px' }}>
          Sin historial de votaciones
        </div>
      )}
    </div>
  );
}

export default ParliamentarianProfileWidget;
