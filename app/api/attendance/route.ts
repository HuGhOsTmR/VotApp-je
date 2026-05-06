import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AttendanceStatus } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

interface AttendancePayload {
  id?: string;
  session_id?: string;
  parliamentarian_id?: string;
  status?: AttendanceStatus;
}

async function ensureAttendanceManager(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
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

const isValidAttendanceStatus = (status: unknown): status is AttendanceStatus =>
  ['present', 'absent', 'excused'].includes(String(status));

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const parliamentarianId = searchParams.get('parliamentarian_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('attendance')
      .select('*, sessions(id, title, session_date), parliamentarians(id, full_name, political_party)')
      .order('created_at', { ascending: false });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (parliamentarianId) {
      query = query.eq('parliamentarian_id', parliamentarianId);
    }

    if (status) {
      if (!isValidAttendanceStatus(status)) {
        return NextResponse.json(
          { success: false, error: 'Estado de asistencia inválido' },
          { status: 400 }
        );
      }
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[v0] Attendance GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AttendancePayload;
    const supabase = await createServerSupabaseClient();

    const authCheck = await ensureAttendanceManager(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    if (!body.session_id || !body.parliamentarian_id || !body.status) {
      return NextResponse.json(
        { success: false, error: 'Sesión, parlamentario y estado son obligatorios' },
        { status: 400 }
      );
    }

    if (!isValidAttendanceStatus(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Estado de asistencia inválido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          session_id: body.session_id,
          parliamentarian_id: body.parliamentarian_id,
          status: body.status,
        },
      ])
      .select('*, sessions(id, title, session_date), parliamentarians(id, full_name, political_party)')
      .single();

    if (error) {
      const isDuplicate = error.code === '23505';
      return NextResponse.json(
        {
          success: false,
          error: isDuplicate
            ? 'Ya existe un registro de asistencia para este parlamentario en la sesión'
            : error.message,
        },
        { status: isDuplicate ? 409 : 400 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('[v0] Attendance POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as AttendancePayload;
    const supabase = await createServerSupabaseClient();

    const authCheck = await ensureAttendanceManager(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    if (!body.id || !body.status) {
      return NextResponse.json(
        { success: false, error: 'Id y estado son obligatorios' },
        { status: 400 }
      );
    }

    if (!isValidAttendanceStatus(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Estado de asistencia inválido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({ status: body.status })
      .eq('id', body.id)
      .select('*, sessions(id, title, session_date), parliamentarians(id, full_name, political_party)')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[v0] Attendance PATCH error:', error);
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
        { success: false, error: 'El id del registro de asistencia es obligatorio' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const authCheck = await ensureAttendanceManager(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { error } = await supabase.from('attendance').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Attendance DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
