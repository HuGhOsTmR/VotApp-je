import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const motionId = searchParams.get('motion_id');

    if (!motionId) {
      return NextResponse.json(
        { success: false, error: 'motion_id parameter is required' },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener el parlamentario del usuario autenticado
    const { data: parliamentarianData } = await supabase
      .from('parliamentarians')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (!parliamentarianData) {
      return NextResponse.json({
        success: true,
        hasVoted: false,
        vote: null,
      });
    }

    // Verificar si el usuario ha votado en esta moción
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id, vote_type, timestamp')
      .eq('motion_id', motionId)
      .eq('parliamentarian_id', parliamentarianData.id)
      .single();

    return NextResponse.json({
      success: true,
      hasVoted: !!existingVote,
      vote: existingVote || null,
    });
  } catch (error) {
    console.error('[v0] Check vote GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
