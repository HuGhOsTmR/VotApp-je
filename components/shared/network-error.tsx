'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

/**
 * Network Error Handler
 * 
 * Provides network error detection and recovery UI.
 * Shows offline state and allows retry.
 */

interface NetworkErrorHandlerProps {
  children: React.ReactNode;
  onRetry?: () => void;
}

export function NetworkErrorHandler({ 
  children, 
  onRetry 
}: NetworkErrorHandlerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleOnline = useCallback(() => {
    logger.info('NETWORK', 'Connection restored');
    setIsOnline(true);
    setLastError(null);
  }, []);

  const handleOffline = useCallback(() => {
    logger.warn('NETWORK', 'Connection lost');
    setIsOnline(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    logger.error('NETWORK', 'Network error', { message: error.message });
    setLastError(error.message);
  }, []);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  if (!isOnline) {
    return (
      <Card className="p-8 m-4 bg-yellow-50 border-yellow-200">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-yellow-900">
            Sin conexión a internet
          </h2>
          <p className="text-yellow-800">
            Por favor, verifica tu conexión a internet e intenta de nuevo.
          </p>
          {onRetry && (
            <Button onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (lastError) {
    return (
      <Card className="p-8 m-4 bg-red-50 border-red-200">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-900">
            Error de conexión
          </h2>
          <p className="text-red-800">
            {lastError}
          </p>
          {onRetry && (
            <Button onClick={() => {
              setLastError(null);
              onRetry();
            }}>
              Reintentar
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}

/**
 * Network status badge for showing connection state
 */
export function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
      Sin conexión
    </Badge>
  );
}

/**
 * Hook for network-aware fetch with auto-retry
 */
export function useNetworkFetch<T>(fetcher: () => Promise<T>, deps: React.DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!navigator.onLine) {
      const offlineError = new Error('Sin conexión a internet');
      setError(offlineError);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcher();
      setData(result);
    } catch (err) {
      logger.error('NETWORK_FETCH', 'Fetch failed', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    fetch();
  }, deps);

  return { data, error, isLoading, refetch: fetch };
}
