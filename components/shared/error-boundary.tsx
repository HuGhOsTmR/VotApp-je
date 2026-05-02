'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors and displays user-friendly fallback UI.
 * Logs errors for debugging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error('ERROR_BOUNDARY', 'Uncaught error caught by boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-8 m-4 bg-red-50 border-red-200">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-red-900">
              Algo salió mal
            </h2>
            <p className="text-red-800">
              Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left text-xs bg-red-100 p-4 rounded overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={this.handleRetry}>
                Intentar de nuevo
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Recargar página
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Async error boundary wrapper for data fetching
 */
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function AsyncErrorBoundary({
  children,
  isLoading,
  error,
  onRetry,
}: AsyncErrorBoundaryProps) {
  if (error) {
    return (
      <Card className="p-8 m-4 bg-red-50 border-red-200">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-900">
            Error al cargar datos
          </h2>
          <p className="text-red-800">
            {error.message || 'No se pudieron cargar los datos. Por favor, intenta de nuevo.'}
          </p>
          {onRetry && (
            <Button onClick={onRetry}>
              Intentar de nuevo
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-8 m-4 bg-slate-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900 mx-auto" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
