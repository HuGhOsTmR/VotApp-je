// Admin API: Webhooks Management
// CRUD endpoints for webhook configuration

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { createWebhook, getWebhooks, deleteWebhook, toggleWebhook, testWebhook, WebhookEvent } from '@/lib/webhook-utils';

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

    const webhooks = await getWebhooks(institutionId);

    return NextResponse.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    console.error('[webhooks] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { url, name, events, secret, retryCount, retryDelaySeconds } = body;

    // Validate required fields
    if (!url || !name || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: url, name, events' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate events
    const validEvents: WebhookEvent[] = ['motion_opened', 'vote_cast', 'motion_closed', 'session_finalized'];
    for (const event of events) {
      if (!validEvents.includes(event)) {
        return NextResponse.json(
          { success: false, error: `Invalid event: ${event}. Valid events: ${validEvents.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Create webhook
    const result = await createWebhook(institutionId, {
      url,
      name,
      events: events as WebhookEvent[],
      secret,
      retryCount,
      retryDelaySeconds,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to create webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, data: { id: result.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error('[webhooks] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Verify webhook belongs to institution
    const { data: webhook } = await supabase
      .from('webhooks')
      .select('id')
      .eq('id', id)
      .eq('institution_id', institutionId)
      .single();

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    let result = false;

    switch (action) {
      case 'toggle':
        if (typeof data.isActive !== 'boolean') {
          return NextResponse.json(
            { success: false, error: 'isActive boolean required' },
            { status: 400 }
          );
        }
        result = await toggleWebhook(id, data.isActive);
        break;

      case 'test':
        const testResult = await testWebhook(id);
        return NextResponse.json({
          success: true,
          data: testResult,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Action failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[webhooks] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
        { success: false, error: 'Webhook id required' },
        { status: 400 }
      );
    }

    // Verify webhook belongs to institution
    const { data: webhook } = await supabase
      .from('webhooks')
      .select('id')
      .eq('id', id)
      .eq('institution_id', institutionId)
      .single();

    if (!webhook) {
      return NextResponse.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const result = await deleteWebhook(id);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[webhooks] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
