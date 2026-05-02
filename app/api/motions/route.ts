import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CreateMotionRequest, ApiResponse } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    let query = supabase.from('motions').select('*');

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query.order('created_at', {
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
    console.error('[v0] Motions GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateMotionRequest;
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

    // Verificar que la sesión existe
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', body.session_id)
      .single();

    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Crear moción
    const { data, error } = await supabase
      .from('motions')
      .insert([
        {
          session_id: body.session_id,
          title: body.title,
          description: body.description,
          proposer_id: body.proposer_id,
          motion_type: body.motion_type,
          status: 'pending',
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
    console.error('[v0] Motions POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
