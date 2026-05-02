import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * 
 * Provides application health status for monitoring and readiness checks.
 * Verifies Supabase connectivity and environment readiness.
 */

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    supabase: {
      status: 'ok' | 'error';
      latency_ms?: number;
      error?: string;
    };
    environment: {
      status: 'ok' | 'error';
      variables: string[];
      missing?: string[];
    };
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      supabase: {
        status: 'ok',
      },
      environment: {
        status: 'ok',
        variables: [],
      },
    },
  };

  // Check environment variables
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingVars: string[] = [];
  for (const varName of requiredEnvVars) {
    if (process.env[varName]) {
      health.checks.environment.variables.push(varName);
    } else {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    health.checks.environment.status = 'error';
    health.checks.environment.missing = missingVars;
    health.status = 'unhealthy';
  }

  // Check Supabase connectivity
  try {
    const supabase = await createServerSupabaseClient();
    const queryStart = Date.now();
    
    // Simple connectivity test - try to get auth config
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    health.checks.supabase.latency_ms = Date.now() - queryStart;

    if (authError) {
      console.error('[HEALTH] Supabase auth check failed:', authError);
      health.checks.supabase.status = 'error';
      health.checks.supabase.error = authError.message;
      health.status = 'degraded';
    }
  } catch (error) {
    console.error('[HEALTH] Supabase connection error:', error);
    health.checks.supabase.status = 'error';
    health.checks.supabase.error = error instanceof Error ? error.message : 'Unknown error';
    health.status = 'unhealthy';
  }

  // Log health check
  console.log(`[HEALTH] Status: ${health.status}, Latency: ${health.checks.supabase.latency_ms}ms`);

  // Return appropriate status code
  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
