import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/lib/types';

const isValidRole = (role: string): role is UserRole =>
  ['admin', 'parliamentarian', 'observer'].includes(role);

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id,email,full_name,role,is_active,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[v0] Users GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, role } = body;

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    if (!isValidRole(role)) {
      return NextResponse.json(
        { success: false, error: 'Rol inválido' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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

    // Verificar si el email ya existe en auth usando admin API
    let userExists = false;
    try {
      const { data: authData } = await supabase.auth.admin.listUsers();
      userExists = authData?.users?.some((u: any) => u.email === email) ?? false;
    } catch (err) {
      // Si listUsers falla, intentar crear de todas formas
      // y dejar que el error de auth.admin.createUser nos lo indique
    }

    if (userExists) {
      return NextResponse.json(
        { success: false, error: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createError) {
      return NextResponse.json(
        { success: false, error: createError.message },
        { status: 400 }
      );
    }

    const userId = createData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'No se pudo crear el usuario' },
        { status: 500 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          email,
          full_name,
          role,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 400 }
      );
    }

    // Si el rol es parlamentarian, crear automáticamente un parlamentario vinculado
    if (role === 'parliamentarian') {
      // Buscar un parlamentario sin user_id asignado
      const { data: availableParliamentarian } = await supabase
        .from('parliamentarians')
        .select('id')
        .is('user_id', null)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (availableParliamentarian) {
        // Vincular el parlamentario al usuario
        const { error: linkError } = await supabase
          .from('parliamentarians')
          .update({ user_id: userId })
          .eq('id', availableParliamentarian.id);

        if (linkError) {
          console.error('[v0] Error linking parliamentarian:', linkError);
          // No fallar la creación del usuario por esto, solo loggear
        }
      } else {
        // Si no hay parlamentarios disponibles, crear uno básico
        const { error: parliamentarianError } = await supabase
          .from('parliamentarians')
          .insert([
            {
              user_id: userId,
              full_name,
              political_party: 'Sin asignar',
              circumscription: 'Sin asignar',
              email,
            },
          ]);

        if (parliamentarianError) {
          console.error('[v0] Error creating parliamentarian:', parliamentarianError);
          // No fallar la creación del usuario por esto, solo loggear
        }
      }
    }

    return NextResponse.json({ success: true, data: profile }, { status: 201 });
  } catch (error) {
    console.error('[v0] Users POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function ensureAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const supabaseClient = await supabase;
  const { data: userData } = await supabaseClient.auth.getUser();
  if (!userData.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: profileData, error: profileError } = await supabaseClient
    .from('user_profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();

  if (profileError || profileData?.role !== 'admin') {
    return { error: 'Forbidden', status: 403 };
  }

  return { error: null, status: 200 };
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, full_name, role, is_active, password } = body;

    if (!id || !full_name || !role || typeof is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const authCheck = await ensureAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    if (!isValidRole(role)) {
      return NextResponse.json(
        { success: false, error: 'Rol inválido' },
        { status: 400 }
      );
    }

    if (password) {
      const { error: passwordError } = await supabase.auth.admin.updateUserById(id, {
        password,
      });
      if (passwordError) {
        return NextResponse.json(
          { success: false, error: passwordError.message },
          { status: 400 }
        );
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .update({ full_name, role, is_active })
      .eq('id', id)
      .select()
      .single();

    if (profileError) {
      return NextResponse.json(
        { success: false, error: profileError.message },
        { status: 400 }
      );
    }

    // Si el rol cambió a parlamentarian, crear/vincular parlamentario
    if (role === 'parliamentarian') {
      // Verificar si ya tiene un parlamentario vinculado
      const { data: existingParliamentarian } = await supabase
        .from('parliamentarians')
        .select('id')
        .eq('user_id', id)
        .single();

      if (!existingParliamentarian) {
        // Buscar un parlamentario sin user_id asignado
        const { data: availableParliamentarian } = await supabase
          .from('parliamentarians')
          .select('id')
          .is('user_id', null)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (availableParliamentarian) {
          // Vincular el parlamentario al usuario
          const { error: linkError } = await supabase
            .from('parliamentarians')
            .update({ user_id: id })
            .eq('id', availableParliamentarian.id);

          if (linkError) {
            console.error('[v0] Error linking parliamentarian:', linkError);
          }
        } else {
          // Si no hay parlamentarios disponibles, crear uno básico
          const { error: parliamentarianError } = await supabase
            .from('parliamentarians')
            .insert([
              {
                user_id: id,
                full_name: profile.full_name,
                political_party: 'Sin asignar',
                circumscription: 'Sin asignar',
                email: profile.email,
              },
            ]);

          if (parliamentarianError) {
            console.error('[v0] Error creating parliamentarian:', parliamentarianError);
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error('[v0] Users PATCH error:', error);
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
        { success: false, error: 'El id es obligatorio' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const authCheck = await ensureAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: authCheck.status }
      );
    }

    const { error: deleteError } = await supabase.auth.admin.deleteUser(id);
    if (deleteError) {
      return NextResponse.json(
        { success: false, error: deleteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[v0] Users DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
