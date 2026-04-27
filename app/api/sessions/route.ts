import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CreateSessionRequest, ApiResponse, Session } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Obtener sesiones
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('session_date', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[v0] Sessions GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateSessionRequest;
    const supabase = await createServerSupabaseClient();

    // Verificar autenticación y rol
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verificar si es admin
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

    // Crear sesión
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          legislature_number: body.legislature_number,
          session_date: body.session_date,
          start_time: body.start_time,
          end_time: body.end_time,
          title: body.title,
          description: body.description,
          quorum_required: body.quorum_required ?? 50,
          created_by: userData.user.id,
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
    console.error('[v0] Sessions POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
