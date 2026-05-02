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

    // Obtener perfil del usuario
    const { data: profileData, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error || !profileData) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: profileData });
  } catch (error) {
    console.error('[v0] Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}