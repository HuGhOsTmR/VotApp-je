import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const demoUsers = [
  {
    email: 'admin@diputados.bo',
    password: 'Admin123!@#',
    name: 'Administrador del Sistema',
    role: 'admin',
  },
  {
    email: 'parlamentario1@diputados.bo',
    password: 'Parl123!@#',
    name: 'Parlamentario Uno',
    role: 'parliamentarian',
  },
  {
    email: 'parlamentario2@diputados.bo',
    password: 'Parl123!@#',
    name: 'Parlamentario Dos',
    role: 'parliamentarian',
  },
  {
    email: 'observador@diputados.bo',
    password: 'Obs123!@#',
    name: 'Observador del Sistema',
    role: 'observer',
  },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    const createdUsers = [];
    const errors = [];

    for (const user of demoUsers) {
      try {
        // Crear usuario en Auth
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

        if (authError) {
          if (authError.message.includes('already exists')) {
            errors.push(`${user.email}: Already exists (skipped)`);
            continue;
          }
          throw authError;
        }

        // Crear perfil de usuario
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: authUser.user.id,
            email: user.email,
            full_name: user.name,
            role: user.role,
          }, { onConflict: 'id' });

        if (profileError) {
          errors.push(`${user.email}: ${profileError.message}`);
          continue;
        }

        // Si es parlamentario, crear registro
        if (user.role === 'parliamentarian') {
          const parties = ['MAS', 'UN', 'CC'];
          const party = parties[createdUsers.length % parties.length];

          await supabase.from('parliamentarians').insert({
            user_id: authUser.user.id,
            full_name: user.name,
            political_party: party,
            circumscription: 'Cochabamba',
            email: user.email,
            is_active: true,
          });
        }

        createdUsers.push({
          email: user.email,
          role: user.role,
          status: 'created',
        });
      } catch (error) {
        errors.push(`${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdUsers.length}/${demoUsers.length} users`,
      created_users: createdUsers,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[v0] Demo users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
