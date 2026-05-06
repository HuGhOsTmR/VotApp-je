import { createServerSupabaseClient } from '@/lib/supabase/server';
import { MotionStatus } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

interface UpdateMotionRequest {
  session_id?: string;
  title?: string;
  description?: string;
  proposer_id?: string;
  motion_type?: string;
  status?: MotionStatus;
  voting_start_time?: string;
  voting_end_time?: string;
}

async function ensureMotionManager(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profileData || !['admin', 'secretary'].includes(profileData.role)) {
    return { error: 'Forbidden - Requires admin or secretary role', status: 403 };
  }

  return { error: null, status: 200 };
}

const isValidMotionStatus = (status: unknown): status is MotionStatus =>
  ['pending', 'open', 'closed', 'approved', 'rejected'].includes(String(status));

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ motionId: string }> }
) {
  try {
    const { motionId } = await context.params;
    const body = (await request.json()) as UpdateMotionRequest;
    const supabase = await createServerSupabaseClient();

    const authCheck = await ensureMotionManager(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    if (body.status && !isValidMotionStatus(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Estado de moción inválido' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of [
      'session_id',
      'title',
      'description',
      'proposer_id',
      'motion_type',
      'status',
      'voting_start_time',
      'voting_end_time',
    ]) {
      if (field in body) {
        updateData[field] = body[field as keyof UpdateMotionRequest] || null;
      }
    }

    if (body.status === MotionStatus.OPEN) {
      updateData.voting_start_time = new Date().toISOString();
      updateData.voting_end_time = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    }

    if (body.status === MotionStatus.CLOSED) {
      updateData.voting_end_time = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('motions')
      .update(updateData)
      .eq('id', motionId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[v0] Motion PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ motionId: string }> }
) {
  try {
    const { motionId } = await context.params;
    const supabase = await createServerSupabaseClient();

    const { data: motion, error: motionError } = await supabase
      .from('motions')
      .select('*, parliamentarians(*)')
      .eq('id', motionId)
      .single();

    if (motionError || !motion) {
      return NextResponse.json(
        { success: false, error: 'Motion not found' },
        { status: 404 }
      );
    }

    const { data: voteResults } = await supabase
      .from('votes')
      .select('vote_type')
      .eq('motion_id', motionId);

    const voteCounts = {
      favor: 0,
      against: 0,
      abstention: 0,
      absent: 0,
    };

    voteResults?.forEach((v: { vote_type: string }) => {
      const type = v.vote_type as keyof typeof voteCounts;
      if (type in voteCounts) {
        voteCounts[type]++;
      }
    });

    const totalVotes = Object.values(voteCounts).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      data: {
        motion,
        votes: voteResults || [],
        voteCounts,
        totalVotes,
        resultType:
          voteCounts.favor > totalVotes / 2
            ? 'approved'
            : voteCounts.against > 0
              ? 'rejected'
              : 'pending',
      },
    });
  } catch (error) {
    console.error('[v0] Motion GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ motionId: string }> }
) {
  try {
    const { motionId } = await context.params;
    const supabase = await createServerSupabaseClient();

    const authCheck = await ensureMotionManager(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { data: motion } = await supabase
      .from('motions')
      .select('status')
      .eq('id', motionId)
      .single();

    if (!motion) {
      return NextResponse.json(
        { success: false, error: 'Motion not found' },
        { status: 404 }
      );
    }

    if (motion.status !== MotionStatus.PENDING) {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden eliminar mociones pendientes' },
        { status: 400 }
      );
    }

    const { count, error: countError } = await supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
      .eq('motion_id', motionId);

    if (countError) {
      return NextResponse.json(
        { success: false, error: countError.message },
        { status: 400 }
      );
    }

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'No se puede eliminar una moción con votos registrados' },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('motions').delete().eq('id', motionId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Motion DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
