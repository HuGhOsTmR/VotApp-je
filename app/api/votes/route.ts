import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CastVoteRequest, ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const motionId = searchParams.get('motion_id');

    let query = supabase
      .from('votes')
      .select('*, parliamentarians(full_name, political_party)');

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

    // Verificar autenticación
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar que la moción existe y está abierta
    const { data: motionData } = await supabase
      .from('motions')
      .select('status')
      .eq('id', body.motion_id)
      .single();

    if (!motionData) {
      return NextResponse.json(
        { success: false, error: 'Motion not found' },
        { status: 404 }
      );
    }

    if (motionData.status !== 'open') {
      return NextResponse.json(
        { success: false, error: 'Motion is not open for voting' },
        { status: 400 }
      );
    }

    // Verificar que el parlamentario existe
    const { data: parliamentarianData } = await supabase
      .from('parliamentarians')
      .select('id')
      .eq('id', body.parliamentarian_id)
      .single();

    if (!parliamentarianData) {
      return NextResponse.json(
        { success: false, error: 'Parliamentarian not found' },
        { status: 404 }
      );
    }

    // Verificar que no haya voto previo
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('motion_id', body.motion_id)
      .eq('parliamentarian_id', body.parliamentarian_id)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { success: false, error: 'You have already voted in this motion' },
        { status: 400 }
      );
    }

    // Registrar el voto
    const { data, error } = await supabase
      .from('votes')
      .insert([
        {
          motion_id: body.motion_id,
          parliamentarian_id: body.parliamentarian_id,
          vote_type: body.vote_type,
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('[v0] Votes POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
