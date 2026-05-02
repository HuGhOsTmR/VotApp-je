'use client';

import { useEffect, useState } from 'react';
import { Motion, MotionResults } from '@/lib/types';

interface MotionResultsCardProps {
  institution: string;
  motionId: string;
  theme?: 'light' | 'dark';
  showTitle?: boolean;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function MotionResultsCard({
  institution,
  motionId,
  theme = 'light',
  showTitle = true,
  showProgress = true,
  size = 'md',
}: MotionResultsCardProps) {
  const [motion, setMotion] = useState<Motion | null>(null);
  const [results, setResults] = useState<MotionResults | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [institution, motionId]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/public/${institution}/motions/${motionId}/results`);
      const data = await response.json();

      if (data.success) {
        setMotion(data.data?.motion);
        setResults(data.data?.results);
      } else {
        setError(data.error || 'Failed to load results');
      }
    } catch (err) {
      setError('Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#1e293b' : '#ffffff';
  const textColor = isDark ? '#f1f5f9' : '#1e293b';
  const subTextColor = isDark ? '#94a3b8' : '#64748b';
  const borderColor = isDark ? '#334155' : '#e2e8f0';

  const sizes = {
    sm: { title: '14px', count: '20px', label: '11px' },
    md: { title: '16px', count: '28px', label: '12px' },
    lg: { title: '18px', count: '36px', label: '14px' },
  };

  const s = sizes[size];

  if (isLoading) {
    return (
      <div style={{ 
        padding: '16px', 
        textAlign: 'center', 
        background: bgColor, 
        color: textColor,
        borderRadius: '8px',
      }}>
        Cargando...
      </div>
    );
  }

  if (error || !motion || !results) {
    return (
      <div style={{ 
        padding: '16px', 
        textAlign: 'center', 
        background: bgColor, 
        color: textColor,
        borderRadius: '8px',
      }}>
        {error || 'Moción no encontrada'}
      </div>
    );
  }

  const approvalPercent = results.total_votes > 0
    ? ((results.favor_count / results.total_votes) * 100).toFixed(1)
    : '0';

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '300px',
      background: bgColor,
      color: textColor,
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      {showTitle && (
        <div style={{ 
          padding: '12px 16px', 
          borderBottom: `1px solid ${borderColor}`,
        }}>
          <div style={{ fontSize: s.title, fontWeight: 'bold' }}>
            {motion.title}
          </div>
          {motion.description && (
            <div style={{ fontSize: '12px', color: subTextColor, marginTop: '4px' }}>
              {motion.description.substring(0, 80)}
              {motion.description.length > 80 ? '...' : ''}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {/* Vote counts */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: s.count, fontWeight: 'bold', color: '#22c55e' }}>
              {results.favor_count}
            </div>
            <div style={{ fontSize: s.label, color: subTextColor }}>A Favor</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: s.count, fontWeight: 'bold', color: '#ef4444' }}>
              {results.against_count}
            </div>
            <div style={{ fontSize: s.label, color: subTextColor }}>En Contra</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: s.count, fontWeight: 'bold', color: '#f59e0b' }}>
              {results.abstention_count}
            </div>
            <div style={{ fontSize: s.label, color: subTextColor }}>Abstención</div>
          </div>
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ 
              display: 'flex', 
              height: '8px', 
              borderRadius: '4px', 
              overflow: 'hidden',
              background: borderColor,
            }}>
              {results.total_votes > 0 && (
                <>
                  <div style={{ 
                    width: `${(results.favor_count / results.total_votes) * 100}%`,
                    background: '#22c55e',
                  }} />
                  <div style={{ 
                    width: `${(results.against_count / results.total_votes) * 100}%`,
                    background: '#ef4444',
                  }} />
                  <div style={{ 
                    width: `${(results.abstention_count / results.total_votes) * 100}%`,
                    background: '#f59e0b',
                  }} />
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ fontSize: '12px', color: subTextColor }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Total:</span>
            <span>{results.total_votes} votos</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Aprobación:</span>
            <span style={{ fontWeight: 'bold', color: parseFloat(approvalPercent) >= 50 ? '#22c55e' : '#ef4444' }}>
              {approvalPercent}%
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Quórum:</span>
            <span style={{ fontWeight: 'bold', color: results.quorum_met ? '#22c55e' : '#ef4444' }}>
              {results.quorum_met ? '✓ Alcanzado' : '✗ No alcanzado'}
            </span>
          </div>
        </div>

        {/* Status badge */}
        <div style={{ 
          marginTop: '12px', 
          padding: '4px 8px', 
          borderRadius: '4px',
          background: motion.status === 'approved' || motion.status === 'closed' && parseFloat(approvalPercent) >= 50 ? '#22c55e20' : '#ef444420',
          color: motion.status === 'approved' || motion.status === 'closed' && parseFloat(approvalPercent) >= 50 ? '#22c55e' : '#ef4444',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
        }}>
          {motion.status === 'approved' || (motion.status === 'closed' && parseFloat(approvalPercent) >= 50) 
            ? 'APROBADA' 
            : motion.status === 'rejected' || (motion.status === 'closed' && parseFloat(approvalPercent) < 50)
              ? 'RECHAZADA'
              : motion.status === 'open' ? 'EN VOTACIÓN' : motion.status.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

export default MotionResultsCard;
