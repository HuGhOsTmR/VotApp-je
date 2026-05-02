// Public API Utilities
// Utilities for public API authentication, rate limiting, and data filtering

import { createServerSupabaseClient } from '@/lib/supabase/server';

// ============================================================================
// TYPES
// ============================================================================

export interface PublicApiConfig {
  institutionId: string;
  institutionSlug: string;
  isPublic: boolean;
  apiEnabled: boolean;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  institutionId: string;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
  lastUsedAt: string | null;
}

// ============================================================================
// INSTITUTION RESOLUTION
// ============================================================================

/**
 * Resolve institution from slug parameter
 * Returns institution config if public API is enabled
 */
export async function resolveInstitutionFromSlug(
  slug: string
): Promise<PublicApiConfig | null> {
  const supabase = await createServerSupabaseClient();

  const { data: institution, error } = await supabase
    .from('institutions')
    .select('id, slug, public_visibility, public_api_enabled')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !institution) {
    return null;
  }

  if (!institution.public_visibility || !institution.public_api_enabled) {
    return null;
  }

  return {
    institutionId: institution.id,
    institutionSlug: institution.slug,
    isPublic: institution.public_visibility,
    apiEnabled: institution.public_api_enabled,
  };
}

// ============================================================================
// API KEY AUTHENTICATION
// ============================================================================

const API_KEY_PREFIX = 'pk_';

/**
 * Validate API key from Authorization header
 * Supports: "ApiKey pk_xxxx" or "Bearer pk_xxxx"
 */
export async function validateApiKey(
  apiKey: string | null
): Promise<ApiKeyInfo | null> {
  if (!apiKey) {
    return null;
  }

  // Normalize the key
  const normalizedKey = apiKey.startsWith('ApiKey ')
    ? apiKey.substring(4)
    : apiKey.startsWith('Bearer ')
      ? apiKey.substring(7)
      : apiKey;

  if (!normalizedKey.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const supabase = await createServerSupabaseClient();

  // For rate limiting, we need to find the key by prefix and validate
  const keyPrefix = normalizedKey.substring(0, 12);
  const keyHash = normalizedKey.substring(3); // Remove prefix for lookup

  // Since we only store the hash, we need a different approach
  // In production, use a key-lookup table or store encrypted key
  // For now, we'll do a simple prefix lookup (not secure for production!)
  const { data: apiKeyData, error } = await supabase
    .from('api_keys')
    .select('id, name, institution_id, rate_limit_per_minute, rate_limit_per_day, is_active, expires_at, last_used_at')
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true)
    .single();

  if (error || !apiKeyData) {
    console.warn('[public-api] Invalid API key prefix:', keyPrefix);
    return null;
  }

  // Check expiration
  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    console.warn('[public-api] API key expired');
    return null;
  }

  return {
    id: apiKeyData.id,
    name: apiKeyData.name,
    institutionId: apiKeyData.institution_id,
    rateLimitPerMinute: apiKeyData.rate_limit_per_minute,
    rateLimitPerDay: apiKeyData.rate_limit_per_day,
    lastUsedAt: apiKeyData.last_used_at,
  };
}

/**
 * Record API key usage for rate limiting
 */
export async function recordApiKeyUsage(
  apiKeyId: string,
  endpoint: string,
  statusCode: number
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Insert usage log
  await supabase.from('api_key_usage_logs').insert({
    api_key_id: apiKeyId,
    endpoint,
    status_code: statusCode,
  });

  // Update last_used_at
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKeyId);
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check rate limit for API key
 * Returns remaining requests or null if no API key
 */
export async function checkRateLimit(
  apiKey: ApiKeyInfo | null
): Promise<RateLimitInfo | null> {
  if (!apiKey) {
    return null; // No rate limiting for unauthenticated requests
  }

  const supabase = await createServerSupabaseClient();
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get current usage counts
  const [minuteResult, dayResult] = await Promise.all([
    supabase
      .from('api_key_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKey.id)
      .gte('used_at', oneMinuteAgo),
    supabase
      .from('api_key_usage_logs')
      .select('id', { count: 'exact', head: true })
      .eq('api_key_id', apiKey.id)
      .gte('used_at', oneDayAgo),
  ]);

  const minuteCount = minuteResult.count || 0;
  const dayCount = dayResult.count || 0;

  return {
    limit: apiKey.rateLimitPerMinute,
    remaining: Math.max(0, apiKey.rateLimitPerMinute - minuteCount),
    resetAt: new Date(Date.now() + 60 * 1000),
  };
}

// ============================================================================
// PUBLIC DATA FILTERING
// ============================================================================

/**
 * Filter object to only include public-safe fields
 * Used to prevent internal/admin fields from leaking
 */
export function filterPublicFields<T extends Record<string, unknown>>(
  data: T,
  publicFields: (keyof T)[]
): Partial<T> {
  const filtered: Partial<T> = {};

  for (const field of publicFields) {
    if (data[field] !== undefined) {
      filtered[field] = data[field];
    }
  }
  return filtered;
}

/**
 * Public-safe field definitions for each entity type
 */
export const PUBLIC_FIELDS = {
  parliamentarian: [
    'id',
    'full_name',
    'political_party',
    'circumscription',
    'photo_url',
    'is_active',
  ] as const,
  session: [
    'id',
    'legislature_number',
    'session_date',
    'start_time',
    'end_time',
    'status',
    'title',
    'description',
    'quorum_required',
  ] as const,
  motion: [
    'id',
    'session_id',
    'title',
    'description',
    'motion_type',
    'status',
    'voting_start_time',
    'voting_end_time',
    'minimum_votes_required',
    'created_at',
    'updated_at',
  ] as const,
  vote: [
    'id',
    'motion_id',
    'parliamentarian_id',
    'vote_type',
    'timestamp',
  ] as const,
  user_profile: [
    'id',
    'full_name',
    'role',
    'is_active',
  ] as const,
};

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

/**
 * Create standard public API response
 */
export function createPublicResponse<T>(
  data: T,
  options?: {
    institution?: string;
    rateLimit?: RateLimitInfo;
  }
) {
  const response: Record<string, unknown> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (options?.institution) {
    response.institution = options.institution;
  }

  if (options?.rateLimit) {
    response.rate_limit = {
      limit: options.rateLimit.limit,
      remaining: options.rateLimit.remaining,
      reset_in_seconds: Math.max(
        0,
        Math.floor(
          (options.rateLimit.resetAt.getTime() - Date.now()) / 1000
        )
      ),
    };
  }

  return response;
}

/**
 * Create error response
 */
export function createErrorResponse(
  error: string,
  statusCode: number = 400,
  details?: string
) {
  return {
    success: false,
    error,
    message: details,
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Convert array to CSV string
 */
export function arrayToCsv<T extends Record<string, unknown>>(
  data: T[],
  fields: (keyof T)[]
): string {
  if (data.length === 0) {
    return '';
  }

  const header = fields.join(',');
  const rows = data.map((row) =>
    fields
      .map((field) => {
        const value = row[field];
        if (value === null || value === undefined) {
          return '';
        }
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      })
      .join(',')
  );

  return [header, ...rows].join('\n');
}

/**
 * Convert query params to filter options
 */
export function parseExportParams(searchParams: URLSearchParams): {
  format: 'json' | 'csv';
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
} {
  const format = (searchParams.get('format') as 'json' | 'csv') || 'json';
  const status = searchParams.get('status') || undefined;
  const fromDate = searchParams.get('from_date') || undefined;
  const toDate = searchParams.get('to_date') || undefined;
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  return {
    format,
    status,
    fromDate,
    toDate,
    limit: isNaN(limit) ? 100 : limit,
    offset: isNaN(offset) ? 0 : offset,
  };
}
