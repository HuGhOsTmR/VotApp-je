import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { motionId: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const motionId = params.motionId;

    // Obtener información de la moción
    const { data: motionData, error: motionError } = await supabase
      .from('motions')
      .select('*, parliamentarians(full_name, political_party)')
      .eq('id', motionId)
      .single();

    if (motionError || !motionData) {
      return NextResponse.json(
        { success: false, error: 'Motion not found' },
        { status: 404 }
      );
    }

    // Obtener votos con detalles
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('*, parliamentarians(full_name, political_party)')
      .eq('motion_id', motionId);

    if (votesError) {
      return NextResponse.json(
        { success: false, error: votesError.message },
        { status: 400 }
      );
    }

    // Calcular resultados agregados
    const results = {
      favor_count: votesData.filter((v) => v.vote_type === 'favor').length,
      against_count: votesData.filter((v) => v.vote_type === 'against').length,
      abstention_count: votesData.filter((v) => v.vote_type === 'abstention')
        .length,
      absent_count: votesData.filter((v) => v.vote_type === 'absent').length,
      total_votes: votesData.length,
      quorum_met: votesData.filter(
        (v) => v.vote_type !== 'absent'
      ).length >= 50,
    };

    return NextResponse.json({
      success: true,
      data: {
        motion: motionData,
        results,
        votes: votesData,
      },
    });
  } catch (error) {
    console.error('[v0] Results GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
