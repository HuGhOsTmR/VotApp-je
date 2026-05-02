'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import { UserProfile, UserRole } from '../types';
import { ROLE_PERMISSIONS } from '@/lib/constants';

export interface UseAuthReturn {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  error: Error | null;
  logout: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  hasPermission: (permission: string) => boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (sessionData?.session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }

          if (profileData) {
            setUser(profileData);
          }
        }

        setError(null);
      } catch (err) {
        console.error('[v0] Error loading user:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[v0] Auth state changed:', event);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setUser(profileData);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error('[v0] Logout error:', err);
      throw err;
    }
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const permissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
    return permissions.includes(permission);
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    userRole: user?.role || null,
    error,
    logout,
    hasRole,
    hasPermission,
  };
}

