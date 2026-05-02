// Webhook Utilities
// Utilities for webhook triggering and delivery

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export type WebhookEvent =
  | 'motion_opened'
  | 'vote_cast'
  | 'motion_closed'
  | 'session_finalized';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  institution_id: string;
  data: Record<string, unknown>;
}

export interface WebhookConfig {
  id: string;
  url: string;
  name: string;
  secret: string | null;
  events: WebhookEvent[];
  retryCount: number;
  retryDelaySeconds: number;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
}

// ============================================================================
// WEBHOOK EVENT TRIGGERS
// ============================================================================

/**
 * Trigger webhooks for an event
 * This function is called from the motion/vote handlers
 */
export async function triggerWebhooks(
  institutionId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Get active webhooks for this institution that listen to this event
  const { data: webhooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .contains('events', [event]);

  if (error || !webhooks || webhooks.length === 0) {
    return;
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    institution_id: institutionId,
    data,
  };

  // Trigger each webhook asynchronously (fire and forget)
  // In production, you'd want to use a job queue here
  for (const webhook of webhooks) {
    triggerWebhookDelivery(webhook, payload).catch((err) => {
      console.error('[webhook] Delivery failed:', err);
    });
  }
}

/**
 * Trigger a single webhook delivery
 */
async function triggerWebhookDelivery(
  webhook: WebhookConfig,
  payload: WebhookPayload
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Sign payload if secret is provided
  const payloadString = JSON.stringify(payload);
  const body = webhook.secret
    ? payloadString // In production, add HMAC signature here
    : payloadString;

  let result: WebhookDeliveryResult = {
    success: false,
  };

  // Try delivery up to retryCount times
  for (let attempt = 1; attempt <= webhook.retryCount; attempt++) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': payload.event,
          'X-Webhook-Timestamp': payload.timestamp,
          ...(webhook.secret && {
            'X-Webhook-Signature': `sha256=${webhook.secret}`,
          }),
        },
        body,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      result = {
        success: response.ok,
        statusCode: response.status,
        responseBody: await response.text().catch(() => undefined),
      };

      if (response.ok) {
        break; // Success, no need to retry
      }
    } catch (error) {
      result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Wait before retrying
    if (attempt < webhook.retryCount) {
      await new Promise((resolve) =>
        setTimeout(resolve, webhook.retryDelaySeconds * 1000)
      );
    }
  }

  // Log the delivery attempt
  await logWebhookDelivery(
    webhook.id,
    payload.event,
    payload,
    result
  );

  // Update webhook stats
  await supabase
    .from('webhooks')
    .update({
      last_triggered_at: new Date().toISOString(),
      last_status_code: result.statusCode,
      last_error: result.error,
      failure_count: result.success ? 0 : webhook.retryCount > 0 ? 1 : 0,
    })
    .eq('id', webhook.id);
}

/**
 * Log webhook delivery attempt
 */
async function logWebhookDelivery(
  webhookId: string,
  eventType: WebhookEvent,
  payload: WebhookPayload,
  result: WebhookDeliveryResult
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  await supabase.from('webhook_delivery_logs').insert({
    webhook_id: webhookId,
    event_type: eventType,
    payload: payload as unknown as Record<string, unknown>,
    status_code: result.statusCode,
    response_body: result.responseBody,
    success: result.success,
    error: result.error,
  });
}

// ============================================================================
// SPECIFIC EVENT TRIGGERS
// ============================================================================

/**
 * Trigger motion_opened event
 */
export async function triggerMotionOpened(
  institutionId: string,
  motionId: string,
  motionData: {
    title: string;
    description?: string;
    proposer_name: string;
    voting_end_time?: string;
  }
): Promise<void> {
  await triggerWebhooks(institutionId, 'motion_opened', {
    motion_id: motionId,
    ...motionData,
  });
}

/**
 * Trigger vote_cast event
 */
export async function triggerVoteCast(
  institutionId: string,
  voteData: {
    motion_id: string;
    motion_title: string;
    parliamentarian_id: string;
    parliamentarian_name: string;
    parliamentarian_party: string;
    vote_type: string;
    timestamp: string;
  }
): Promise<void> {
  await triggerWebhooks(institutionId, 'vote_cast', voteData);
}

/**
 * Trigger motion_closed event
 */
export async function triggerMotionClosed(
  institutionId: string,
  motionId: string,
  motionData: {
    title: string;
    status: string;
    results: {
      favor_count: number;
      against_count: number;
      abstention_count: number;
      absent_count: number;
      total_votes: number;
      quorum_met: boolean;
    };
  }
): Promise<void> {
  await triggerWebhooks(institutionId, 'motion_closed', {
    motion_id: motionId,
    ...motionData,
  });
}

/**
 * Trigger session_finalized event
 */
export async function triggerSessionFinalized(
  institutionId: string,
  sessionId: string,
  sessionData: {
    title: string;
    session_date: string;
    motions_count: number;
    approved_count: number;
    rejected_count: number;
  }
): Promise<void> {
  await triggerWebhooks(institutionId, 'session_finalized', {
    session_id: sessionId,
    ...sessionData,
  });
}

// ============================================================================
// WEBHOOK MANAGEMENT (ADMIN)
// ============================================================================

/**
 * Create a new webhook
 */
export async function createWebhook(
  institutionId: string,
  config: {
    url: string;
    name: string;
    events: WebhookEvent[];
    secret?: string;
    retryCount?: number;
    retryDelaySeconds?: number;
  }
): Promise<{ id: string } | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      institution_id: institutionId,
      url: config.url,
      name: config.name,
      events: config.events,
      secret: config.secret || null,
      retry_count: config.retryCount || 3,
      retry_delay_seconds: config.retryDelaySeconds || 60,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[webhook] Failed to create webhook:', error);
    return null;
  }

  return { id: data.id };
}

/**
 * Test webhook delivery
 */
export async function testWebhook(
  webhookId: string
): Promise<WebhookDeliveryResult> {
  const supabase = await createServerSupabaseClient();

  // Get webhook config
  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', webhookId)
    .single();

  if (error || !webhook) {
    return {
      success: false,
      error: 'Webhook not found',
    };
  }

  // Send test payload
  const testPayload: WebhookPayload = {
    event: 'motion_opened', // Test event
    timestamp: new Date().toISOString(),
    institution_id: webhook.institution_id,
    data: {
      test: true,
      message: 'This is a test webhook delivery',
      webhook_id: webhookId,
    },
  };

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'test',
        'X-Webhook-Timestamp': testPayload.timestamp,
      },
      body: JSON.stringify(testPayload),
      signal: AbortSignal.timeout(10000),
    });

    const responseBody = await response.text().catch(() => undefined);

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get webhooks for an institution
 */
export async function getWebhooks(
  institutionId: string
): Promise<WebhookConfig[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('institution_id', institutionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[webhook] Failed to fetch webhooks:', error);
    return [];
  }

  return data || [];
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', webhookId);

  if (error) {
    console.error('[webhook] Failed to delete webhook:', error);
    return false;
  }

  return true;
}

/**
 * Toggle webhook active status
 */
export async function toggleWebhook(
  webhookId: string,
  isActive: boolean
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('webhooks')
    .update({ is_active: isActive })
    .eq('id', webhookId);

  if (error) {
    console.error('[webhook] Failed to toggle webhook:', error);
    return false;
  }

  return true;
}

// ============================================================================
// EVENT DEFINITIONS
// ============================================================================

export const WEBHOOK_EVENTS = {
  motion_opened: {
    description: 'Triggered when a motion voting is opened',
    example_payload: {
      event: 'motion_opened',
      timestamp: '2024-01-15T10:30:00Z',
      institution_id: 'uuid',
      data: {
        motion_id: 'uuid',
        title: 'Resolution to approve budget',
        proposer_name: 'John Doe',
        voting_end_time: '2024-01-15T12:30:00Z',
      },
    },
  },
  vote_cast: {
    description: 'Triggered when a vote is cast',
    example_payload: {
      event: 'vote_cast',
      timestamp: '2024-01-15T10:35:00Z',
      institution_id: 'uuid',
      data: {
        motion_id: 'uuid',
        motion_title: 'Resolution to approve budget',
        parliamentarian_id: 'uuid',
        parliamentarian_name: 'Jane Smith',
        parliamentarian_party: 'MAS',
        vote_type: 'favor',
        timestamp: '2024-01-15T10:35:00Z',
      },
    },
  },
  motion_closed: {
    description: 'Triggered when a motion voting is closed',
    example_payload: {
      event: 'motion_closed',
      timestamp: '2024-01-15T12:30:00Z',
      institution_id: 'uuid',
      data: {
        motion_id: 'uuid',
        title: 'Resolution to approve budget',
        status: 'approved',
        results: {
          favor_count: 45,
          against_count: 5,
          abstention_count: 2,
          absent_count: 3,
          total_votes: 55,
          quorum_met: true,
        },
      },
    },
  },
  session_finalized: {
    description: 'Triggered when a parliamentary session is finalized',
    example_payload: {
      event: 'session_finalized',
      timestamp: '2024-01-15T14:00:00Z',
      institution_id: 'uuid',
      data: {
        session_id: 'uuid',
        title: 'Session 15/2024',
        session_date: '2024-01-15',
        motions_count: 5,
        approved_count: 4,
        rejected_count: 1,
      },
    },
  },
} as const;
