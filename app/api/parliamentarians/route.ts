import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    let query = supabase
      .from('parliamentarians')
      .select('*')
      .eq('is_active', true);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('full_name', {
      ascending: true,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[v0] Parliamentarians GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    // Validar enlace de usuario si se proporciona
    let linkedUserId: string | null = null;

    if (body.user_id) {
      const { data: linkedUser, error: linkedUserError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', body.user_id)
        .single();

      if (linkedUserError || !linkedUser) {
        return NextResponse.json(
          { success: false, error: 'Usuario vinculado no encontrado' },
          { status: 400 }
        );
      }

      if (linkedUser.role !== 'parliamentarian') {
        return NextResponse.json(
          { success: false, error: 'Solo se puede enlazar un usuario con rol parlamentarian' },
          { status: 400 }
        );
      }

      linkedUserId = body.user_id;

      const { data: existingLink } = await supabase
        .from('parliamentarians')
        .select('id')
        .eq('user_id', linkedUserId)
        .single();

      if (existingLink) {
        return NextResponse.json(
          { success: false, error: 'Este usuario ya está vinculado a otro parlamentario' },
          { status: 400 }
        );
      }
    }

    // Crear parlamentario
    const { data, error } = await supabase
      .from('parliamentarians')
      .insert([
        {
          full_name: body.full_name,
          political_party: body.political_party,
          circumscription: body.circumscription,
          email: body.email,
          phone_number: body.phone_number,
          photo_url: body.photo_url,
          user_id: linkedUserId,
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
    console.error('[v0] Parliamentarians POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Parliamentarian id is required' },
        { status: 400 }
      );
    }
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

    let linkedUserId: string | null = null;

    if (body.user_id) {
      const { data: linkedUser, error: linkedUserError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', body.user_id)
        .single();

      if (linkedUserError || !linkedUser) {
        return NextResponse.json(
          { success: false, error: 'Usuario vinculado no encontrado' },
          { status: 400 }
        );
      }

      if (linkedUser.role !== 'parliamentarian') {
        return NextResponse.json(
          { success: false, error: 'Solo se puede enlazar un usuario con rol parlamentarian' },
          { status: 400 }
        );
      }

      linkedUserId = body.user_id;

      const { data: existingLink } = await supabase
        .from('parliamentarians')
        .select('id')
        .eq('user_id', linkedUserId)
        .neq('id', body.id)
        .single();

      if (existingLink) {
        return NextResponse.json(
          { success: false, error: 'Este usuario ya está vinculado a otro parlamentario' },
          { status: 400 }
        );
      }
    }

    // Actualizar parlamentario
    const { data, error } = await supabase
      .from('parliamentarians')
      .update({
        full_name: body.full_name,
        political_party: body.political_party,
        circumscription: body.circumscription,
        email: body.email,
        phone_number: body.phone_number,
        photo_url: body.photo_url,
        user_id: linkedUserId,
      })
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
    console.error('[v0] Parliamentarians PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
