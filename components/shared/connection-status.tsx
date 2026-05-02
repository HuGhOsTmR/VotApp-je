'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Connection Status Indicator
 * 
 * Shows realtime connection status with Supabase.
 * - Green: Connected
 * - Yellow: Reconnecting
 * - Red: Disconnected
 */

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

interface ConnectionStatusProps {
  showLabel?: boolean;
  className?: string;
}

export function ConnectionStatus({ 
  showLabel = true, 
  className = '' 
}: ConnectionStatusProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  const handleConnectionStateChange = useCallback((state: 'connected' | 'disconnected' | 'reconnecting') => {
    console.log('[CONNECTION] State changed:', state);
    setConnectionState(state);
    if (state === 'connected') {
      setLastSeen(new Date());
    }
  }, []);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('sessions').select('id').limit(1);
        
        if (error) {
          console.warn('[CONNECTION] Initial check failed:', error.message);
          handleConnectionStateChange('disconnected');
        } else {
          handleConnectionStateChange('connected');
        }
      } catch (error) {
        console.error('[CONNECTION] Check error:', error);
        handleConnectionStateChange('disconnected');
      }
    };

    checkConnection();

    const heartbeatInterval = setInterval(async () => {
      try {
        const { error } = await supabase.from('sessions').select('id').limit(1);
        
        if (error) {
          handleConnectionStateChange('disconnected');
        } else if (connectionState === 'disconnected') {
          handleConnectionStateChange('reconnecting');
          setTimeout(() => handleConnectionStateChange('connected'), 1000);
        }
      } catch {
        handleConnectionStateChange('disconnected');
      }
    }, 30000);

    const { data: authSubscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        handleConnectionStateChange('disconnected');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        handleConnectionStateChange('connected');
      }
    });

    return () => {
      clearInterval(heartbeatInterval);
      if (authSubscription?.subscription) {
        authSubscription.subscription.unsubscribe();
      }
    };
  }, [handleConnectionStateChange, connectionState]);

  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connected':
        return {
          color: 'bg-green-500',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          label: 'Conectado',
          tooltip: 'Conexión activa con el servidor',
        };
      case 'reconnecting':
        return {
          color: 'bg-yellow-500',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          label: 'Reconectando',
          tooltip: 'Intentando reconectar...',
        };
      case 'disconnected':
        return {
          color: 'bg-red-500',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          label: 'Sin conexión',
          tooltip: 'Sin conexión al servidor. Por favor, verifica tu conexión a internet.',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const isPulsing = connectionState === 'reconnecting';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center gap-2 cursor-help ${className}`}>
            <span
              className={`relative flex h-3 w-3 ${statusInfo.bgColor} rounded-full`}
            >
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  isPulsing ? 'animate-ping opacity-75' : ''
                } ${statusInfo.color}`}
              />
              <span
                className={`relative inline-flex h-3 w-3 rounded-full ${statusInfo.color}`}
              />
            </span>
            {showLabel && (
              <span className={`text-sm font-medium ${statusInfo.textColor}`}>
                {statusInfo.label}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusInfo.tooltip}</p>
          {lastSeen && connectionState === 'connected' && (
            <p className="text-xs text-muted-foreground mt-1">
              Última actividad: {lastSeen.toLocaleTimeString('es-BO')}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function NavbarConnectionStatus() {
  return (
    <div className="flex items-center gap-2">
      <ConnectionStatus showLabel={false} />
    </div>
  );
}
