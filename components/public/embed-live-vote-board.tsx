'use client';

import { useEffect, useState } from 'react';
import { Motion, MotionResults, Parliamentarian, Vote } from '@/lib/types';

interface LiveVoteBoardProps {
  institution: string;
  motionId?: string;
  theme?: 'light' | 'dark';
  showTitle?: boolean;
  autoRefresh?: number;
  showVotesList?: boolean;
}

interface VoteWithParliamentarian extends Vote {
  parliamentarians?: Parliamentarian;
}

export function LiveVoteBoard({
  institution,
  motionId,
  theme = 'light',
  showTitle = true,
  autoRefresh = 5,
  showVotesList = false,
}: LiveVoteBoardProps) {
  const [motions, setMotions] = useState<Motion[]>([]);
  const [selectedMotion, setSelectedMotion] = useState<Motion | null>(null);
  const [results, setResults] = useState<MotionResults | null>(null);
  const [votes, setVotes] = useState<VoteWithParliamentarian[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    if (autoRefresh > 0) {
      const interval = setInterval(fetchData, autoRefresh * 1000);
      return () => clearInterval(interval);
    }
  }, [institution, motionId, autoRefresh]);

  const fetchData = async () => {
    try {
      // Fetch motions
      const motionsRes = await fetch(`/api/public/${institution}/motions?status=open&limit=10`);
      const motionsData = await motionsRes.json();

      if (motionsData.success && motionsData.data?.length > 0) {
        const openMotions = motionsData.data;
        setMotions(openMotions);

        // Select motion
        const targetMotion = motionId
          ? openMotions.find((m: Motion) => m.id === motionId)
          : openMotions[0];

        if (targetMotion) {
          setSelectedMotion(targetMotion);
          
          // Fetch results
          const resultsRes = await fetch(
            `/api/public/${institution}/motions/${targetMotion.id}/results`
          );
          const resultsData = await resultsRes.json();
          
          if (resultsData.success) {
            setResults(resultsData.data?.results);
            
            if (showVotesList) {
              setVotes(resultsData.data?.votes || []);
            }
          }
        }
      }
    } catch (error) {
      console.error('[embed] Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const accentColor = isDark ? '#3b82f6' : '#1e40af';

  if (isLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: bgColor, color: textColor }}>
        Cargando...
      </div>
    );
  }

  if (!selectedMotion) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', background: bgColor, color: textColor }}>
        No hay votaciones activas
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '400px',
      background: bgColor,
      color: textColor,
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    }}>
      {showTitle && (
        <div style={{ 
          padding: '12px 16px', 
          background: accentColor, 
          color: 'white',
          fontWeight: 'bold',
        }}>
          Live Vote Board
        </div>
      )}

      <div style={{ padding: '16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: '16px' }}>
          {selectedMotion.title}
        </h3>

        {results && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#22c55e', borderRadius: '4px', color: 'white' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{results.favor_count}</div>
              <div style={{ fontSize: '12px' }}>A Favor</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#ef4444', borderRadius: '4px', color: 'white' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{results.against_count}</div>
              <div style={{ fontSize: '12px' }}>En Contra</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '12px', background: '#f59e0b', borderRadius: '4px', color: 'white' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{results.abstention_count}</div>
              <div style={{ fontSize: '12px' }}>Abstención</div>
            </div>
          </div>
        )}

        {results && (
          <div style={{ fontSize: '14px', color: isDark ? '#94a3b8' : '#64748b' }}>
            <span style={{ fontWeight: 'bold' }}>Total:</span> {results.total_votes} votos
            {' · '}
            <span style={{ 
              color: results.quorum_met ? '#22c55e' : '#ef4444',
              fontWeight: 'bold',
            }}>
              Quórum: {results.quorum_met ? '✓' : '✗'}
            </span>
          </div>
        )}

        {showVotesList && votes.length > 0 && (
          <div style={{ marginTop: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
              Votos Registrados ({votes.length})
            </div>
            {votes.slice(0, 10).map((vote) => (
              <div key={vote.id} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '6px 0',
                borderBottom: '1px solid',
                borderColor: isDark ? '#334155' : '#e2e8f0',
                fontSize: '13px',
              }}>
                <span>{vote.parliamentarians?.full_name}</span>
                <span style={{ 
                  color: vote.vote_type === 'favor' ? '#22c55e' 
                    : vote.vote_type === 'against' ? '#ef4444' 
                    : '#f59e0b',
                  fontWeight: 'bold',
                }}>
                  {vote.vote_type === 'favor' ? 'A Favor' 
                    : vote.vote_type === 'against' ? 'En Contra' 
                    : 'Abstención'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveVoteBoard;
