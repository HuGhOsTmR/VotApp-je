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
      // For new parliamentarians, we need to check the user isn't already linked
      const { data: existingUserLink } = await supabase
        .from('parliamentarians')
        .select('id, full_name')
        .eq('user_id', body.user_id)
        .eq('is_active', true)
        .single();

      if (existingUserLink) {
        return NextResponse.json(
          {
            success: false,
            error: 'user_already_linked',
            message: `Este usuario ya está vinculado a ${existingUserLink.full_name}`,
          },
          { status: 400 }
        );
      }

      // Verify user exists and has correct role
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

    // Handle unlinking if user_id is empty string or null explicitly
    const shouldUnlink = body.user_id === '' || body.user_id === null;

    if (!shouldUnlink && body.user_id) {
      // SECURITY: Validate using RPC when linking to a new user
      const { data: validationResult, error: validationError } = await supabase.rpc(
        'validate_linkage',
        {
          p_user_id: body.user_id,
          p_parliamentarian_id: body.id,
        }
      );

      // If validation returns a result, check if it's valid
      if (validationResult && typeof validationResult === 'object') {
        const validation = validationResult as { valid: boolean; reason?: string; message?: string };
        if (!validation.valid) {
          return NextResponse.json(
            {
              success: false,
              error: validation.reason || 'invalid_linkage',
              message: validation.message || 'No se puede realizar el enlace',
            },
            { status: 400 }
          );
        }
      } else if (validationError) {
        // Fallback to manual check if RPC fails
        console.warn('[v0] validate_linkage RPC failed, using manual validation:', validationError);
      }

      // Manual fallback validation
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
          {
            success: false,
            error: 'Solo se puede enlazar un usuario con rol parlamentarian',
          },
          { status: 400 }
        );
      }

      // Check if other parliamentarian is already linked to this user
      const { data: existingLink } = await supabase
        .from('parliamentarians')
        .select('id, full_name')
        .eq('user_id', body.user_id)
        .neq('id', body.id)
        .eq('is_active', true)
        .single();

      if (existingLink) {
        return NextResponse.json(
          {
            success: false,
            error: 'user_already_linked',
            message: `Este usuario ya está vinculado a ${existingLink.full_name}`,
          },
          { status: 400 }
        );
      }

      linkedUserId = body.user_id;
    }

    // Actualizar parlamentario (user_id set to null if unlinking)
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
