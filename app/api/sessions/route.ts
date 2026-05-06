import { createServerSupabaseClient } from '@/lib/supabase/server';
import { CreateSessionRequest, SessionStatus } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

async function ensureSessionManager(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { userId: null, error: 'Unauthorized', status: 401 };
  }

  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || !profileData || !['admin', 'secretary'].includes(profileData.role)) {
    return { userId: userData.user.id, error: 'Forbidden - Requires admin or secretary role', status: 403 };
  }

  return { userId: userData.user.id, error: null, status: 200 };
}

const isValidSessionStatus = (status: unknown): status is SessionStatus =>
  ['scheduled', 'active', 'closed', 'cancelled'].includes(String(status));

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

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

    const authCheck = await ensureSessionManager(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    if (!body.legislature_number || !body.session_date) {
      return NextResponse.json(
        { success: false, error: 'Legislatura y fecha son obligatorias' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          legislature_number: body.legislature_number,
          session_date: body.session_date,
          start_time: body.start_time || null,
          end_time: body.end_time || null,
          title: body.title || null,
          description: body.description || null,
          quorum_required: body.quorum_required ?? 50,
          status: SessionStatus.SCHEDULED,
          created_by: authCheck.userId,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServerSupabaseClient();

    const authCheck = await ensureSessionManager(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'El id de la sesión es obligatorio' },
        { status: 400 }
      );
    }

    if (body.status && !isValidSessionStatus(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Estado de sesión inválido' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of [
      'legislature_number',
      'session_date',
      'start_time',
      'end_time',
      'title',
      'description',
      'quorum_required',
      'status',
    ]) {
      if (field in body) {
        updateData[field] = body[field] || null;
      }
    }

    if ('quorum_required' in body) {
      updateData.quorum_required = Number(body.quorum_required);
    }

    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', body.id)
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
    console.error('[v0] Sessions PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'El id de la sesión es obligatorio' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const authCheck = await ensureSessionManager(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { data, error } = await supabase
      .from('sessions')
      .update({ status: SessionStatus.CANCELLED, updated_at: new Date().toISOString() })
      .eq('id', id)
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
    console.error('[v0] Sessions DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
