// Admin API: API Keys Management
// CRUD endpoints for API key configuration

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY_PREFIX = 'pk_';

// Helper to check admin access
async function checkAdminAccess(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<{ allowed: boolean; institutionId: string | null }> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { allowed: false, institutionId: null };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, institution_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['platform_admin', 'tenant_admin'].includes(profile.role)) {
    return { allowed: false, institutionId: null };
  }

  return { allowed: true, institutionId: profile.institution_id };
}

/**
 * Generate a new API key
 */
function generateApiKey(): { keyValue: string; keyHash: string; keyPrefix: string } {
  const keyBytes = Array.from(crypto.getRandomValues(new Uint8Array(20)));
  const keyValue = API_KEY_PREFIX + keyBytes.map(b => b.toString(16).padStart(2, '0')).join('');
  const keyHash = keyValue.substring(3); // Hash the raw value
  const keyPrefix = keyValue.substring(0, 12);
  return { keyValue, keyHash, keyPrefix };
}

/**
 * List API keys
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { allowed, institutionId } = await checkAdminAccess(supabase);

    if (!allowed || !institutionId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, rate_limit_per_minute, rate_limit_per_day, is_active, expires_at, last_used_at, created_at')
      .eq('institution_id', institutionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[api-keys] GET error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('[api-keys] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create new API key
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { allowed, institutionId } = await checkAdminAccess(supabase);

    if (!allowed || !institutionId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, rateLimitPerMinute, rateLimitPerDay, expiresAt } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Generate new key
    const { keyValue, keyHash, keyPrefix } = generateApiKey();

    // Create API key record
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        institution_id: institutionId,
        name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        rate_limit_per_minute: rateLimitPerMinute || 60,
        rate_limit_per_day: rateLimitPerDay || 10000,
        is_active: true,
        expires_at: expiresAt || null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[api-keys] POST error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create API key' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: data.id,
          key: keyValue, // Only returned once!
          name,
          rateLimitPerMinute: rateLimitPerMinute || 60,
          rateLimitPerDay: rateLimitPerDay || 10000,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[api-keys] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update or delete API key
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { allowed, institutionId } = await checkAdminAccess(supabase);

    if (!allowed || !institutionId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, action, ...data } = body;

    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing id or action' },
        { status: 400 }
      );
    }

    // Verify key belongs to institution
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('institution_id', institutionId)
      .single();

    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'toggle': {
        if (typeof data.isActive !== 'boolean') {
          return NextResponse.json(
            { success: false, error: 'isActive boolean required' },
            { status: 400 }
          );
        }
        const { error: updateError } = await supabase
          .from('api_keys')
          .update({ is_active: data.isActive })
          .eq('id', id);

        if (updateError) {
          return NextResponse.json(
            { success: false, error: 'Failed to update API key' },
            { status: 500 }
          );
        }
        break;
      }

      case 'update': {
        const updates: Record<string, unknown> = {};
        if (data.name) updates.name = data.name;
        if (typeof data.rateLimitPerMinute === 'number') updates.rate_limit_per_minute = data.rateLimitPerMinute;
        if (typeof data.rateLimitPerDay === 'number') updates.rate_limit_per_day = data.rateLimitPerDay;
        if (data.expiresAt !== undefined) updates.expires_at = data.expiresAt;

        if (Object.keys(updates).length === 0) {
          return NextResponse.json(
            { success: false, error: 'No fields to update' },
            { status: 400 }
          );
        }

        const { error: updateError } = await supabase
          .from('api_keys')
          .update(updates)
          .eq('id', id);

        if (updateError) {
          return NextResponse.json(
            { success: false, error: 'Failed to update API key' },
            { status: 500 }
          );
        }
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api-keys] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { allowed, institutionId } = await checkAdminAccess(supabase);

    if (!allowed || !institutionId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'API key id required' },
        { status: 400 }
      );
    }

    // Verify key belongs to institution
    const { data: existingKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', id)
      .eq('institution_id', institutionId)
      .single();

    if (!existingKey) {
      return NextResponse.json(
        { success: false, error: 'API key not found' },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api-keys] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
