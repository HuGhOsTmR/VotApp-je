import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

interface UpdateMotionRequest {
  status?: 'pending' | 'open' | 'closed' | 'approved' | 'rejected';
  voting_start_time?: string;
  voting_end_time?: string;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ motionId: string }> }
) {
  try {
    const { motionId } = await context.params;
    const body = (await request.json()) as UpdateMotionRequest;
    const supabase = await createServerSupabaseClient();

    // Verificar autenticación
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar rol admin
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Actualizar moción
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
      ...body,
    };

    // Si abre la votación, establecer tiempos
    if (body.status === 'open') {
      updateData.voting_start_time = new Date().toISOString();
      // Votación de 5 minutos por defecto
      updateData.voting_end_time = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    }

    // Si cierra la votación, calcular resultado
    if (body.status === 'closed') {
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

    // Obtener moción con detalles
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

    // Obtener votos contados por tipo
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
