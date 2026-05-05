import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from '@otplib/preset-default';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verificar autenticación
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Obtener perfil con 2FA
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role, two_factor_secret, two_factor_enabled')
      .eq('id', userData.user.id)
      .single();

    if (!profileData?.two_factor_enabled || !profileData.two_factor_secret) {
      return NextResponse.json(
        { success: false, error: '2FA not enabled' },
        { status: 400 }
      );
    }

    // Verificar token TOTP
    const isValid = authenticator.verify({
      token,
      secret: profileData.two_factor_secret,
    });

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA verification successful',
    });
  } catch (error) {
    console.error('[v0] 2FA verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
