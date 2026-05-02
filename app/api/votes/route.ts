import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CastVoteRequest, ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

// Error code to HTTP status mapping
function getHttpStatusForError(errorCode: string): number {
  const errorStatusMap: Record<string, number> = {
    motion_not_found: 404,
    motion_not_open: 400,
    voting_window_closed: 400,
    parliamentarian_not_found: 404,
    parliamentarian_inactive: 400,
    invalid_vote_type: 400,
    unauthenticated: 401,
    profile_not_found: 404,
    unauthorized: 403,
    unauthorized_parliamentarian: 403,
    duplicate_vote: 409,
  };
  return errorStatusMap[errorCode] || 400;
}

/**
 * Get the authenticated user's linked parliamentarian ID.
 * This derives the identity from auth context - we NEVER trust parliamentarian_id from frontend.
 */
async function getUserParliamentarianId(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Use the RPC function we created to get parliamentarian_id linked to this user
  const { data, error } = await supabase.rpc('get_parliamentarian_id_for_user', {
    p_user_id: user.id,
  });

  if (error || !data) {
    console.error('[v0] Error getting parliamentarian id:', error);
    return null;
  }

  return data;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const motionId = searchParams.get('motion_id');

    let query = supabase
      .from('votes')
      .select('*, parliamentarians(full_name, political_party, photo_url)');

    if (motionId) {
      query = query.eq('motion_id', motionId);
    }

    const { data, error } = await query.order('timestamp', {
      ascending: false,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[v0] Votes GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CastVoteRequest;
    const supabase = await createServerSupabaseClient();

    // Get client IP and user agent for audit
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Verify authentication
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // SECURITY HARDENING: Derive parliamentarian_id from authenticated user context
    // We NEVER trust parliamentarian_id sent by frontend - it can be manipulated!
    const derivedParliamentarianId = await getUserParliamentarianId(supabase);

    if (!derivedParliamentarianId) {
      return NextResponse.json(
        {
          success: false,
          error: 'no_linked_parliamentarian',
          message:
            'No tiene un parlamentario vinculado. Contacte al administrador.',
        },
        { status: 403 }
      );
    }

    // Log if frontend tried to manipulate the ID (for security monitoring)
    if (
      body.parliamentarian_id &&
      body.parliamentarian_id !== derivedParliamentarianId
    ) {
      console.warn(
        '[v0] Security: Frontend attempted to manipulate parliamentarian_id',
        {
          frontend_id: body.parliamentarian_id,
          derived_id: derivedParliamentarianId,
          user_id: userData.user.id,
          motion_id: body.motion_id,
        }
      );
    }

    // Call the RPC function for atomic vote casting
    // This ensures vote + audit log are created in a single transaction
    const { data: rpcData, error: rpcError } = await supabase.rpc('cast_vote', {
      p_motion_id: body.motion_id,
      // Use the derived ID - never the frontend's submitted one
      p_parliamentarian_id: derivedParliamentarianId,
      p_vote_type: body.vote_type,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    });

    if (rpcError) {
      console.error('[v0] RPC cast_vote error:', rpcError);
      return NextResponse.json(
        { success: false, error: 'Failed to process vote' },
        { status: 500 }
      );
    }

    // Parse RPC result
    const result = rpcData as {
      success: boolean;
      error?: string;
      message?: string;
      vote_id?: string;
      vote_type?: string;
      timestamp?: string;
    };

    // Handle RPC-level errors
    if (!result.success) {
      const httpStatus = getHttpStatusForError(result.error || '');
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'vote_failed',
          message: result.message || 'Failed to cast vote',
        },
        { status: httpStatus }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.vote_id,
          motion_id: body.motion_id,
          parliamentarian_id: derivedParliamentarianId,
          vote_type: result.vote_type,
          timestamp: result.timestamp,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v0] Votes POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
