import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

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
      return NextResponse.json({ success: true, data: [] });
    }

    // Obtener votos del parlamentario con detalles de la moción
    const { data: votesData, error } = await supabase
      .from('votes')
      .select(
        `
        id,
        motion_id,
        vote_type,
        timestamp,
        motions(id, title, status)
      `
      )
      .eq('parliamentarian_id', parliamentarianData.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('[v0] Error fetching user votes:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    // Transformar datos al formato esperado
    const formattedVotes = (votesData || []).map((vote: any) => ({
      id: vote.id,
      motion_id: vote.motion_id,
      motion_title: vote.motions?.title || 'Sin título',
      motion_status: vote.motions?.status || 'unknown',
      vote_type: vote.vote_type,
      timestamp: vote.timestamp,
    }));

    return NextResponse.json({ success: true, data: formattedVotes });
  } catch (error) {
    console.error('[v0] User votes GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
