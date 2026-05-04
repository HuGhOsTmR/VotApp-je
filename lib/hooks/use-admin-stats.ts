'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';

export interface AdminStats {
  activeSessions: number;
  openMotions: number;
  totalParliamentarians: number;
  totalUsers: number;
}

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>({
    activeSessions: 0,
    openMotions: 0,
    totalParliamentarians: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const { count: sessions } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });
        const { count: motions } = await supabase
          .from('motions')
          .select('*', { count: 'exact', head: true });
        const { count: parliamentarians } = await supabase
          .from('parliamentarians')
          .select('*', { count: 'exact', head: true });
        const { count: users } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        setStats({
          activeSessions: sessions || 0,
          openMotions: motions || 0,
          totalParliamentarians: parliamentarians || 0,
          totalUsers: users || 0,
        });
      } catch (error) {
        console.error('[admin-stats] Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}
