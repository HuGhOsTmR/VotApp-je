import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from '@otplib/preset-default';
import * as QRCode from 'qrcode';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
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

    // Verificar si es admin
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role, two_factor_enabled')
      .eq('id', userData.user.id)
      .single();

    if (profileData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    if (profileData.two_factor_enabled) {
      return NextResponse.json(
        { success: false, error: '2FA already enabled' },
        { status: 400 }
      );
    }

    // Generar secreto TOTP
    const secret = authenticator.generateSecret();
    const userEmail = userData.user.email ?? userData.user.id;
    const otpauth = authenticator.keyuri(
      userEmail,
      'Sistema Parlamentario',
      secret
    );

    // Generar QR code
    const qrCodeDataURL = await QRCode.toDataURL(otpauth);

    // Guardar secreto temporalmente (se confirmará después)
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        two_factor_secret: secret,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeDataURL,
        otpauth,
      },
    });
  } catch (error) {
    console.error('[v0] 2FA setup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    // Obtener perfil con secreto temporal
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role, two_factor_secret, two_factor_enabled')
      .eq('id', userData.user.id)
      .single();

    if (profileData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    if (!profileData.two_factor_secret) {
      return NextResponse.json(
        { success: false, error: '2FA not initialized' },
        { status: 400 }
      );
    }

    if (profileData.two_factor_enabled) {
      return NextResponse.json(
        { success: false, error: '2FA already enabled' },
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

    // Activar 2FA
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        two_factor_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    console.error('[v0] 2FA verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // Verificar si es admin
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin only' },
        { status: 403 }
      );
    }

    // Desactivar 2FA
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userData.user.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error) {
    console.error('[v0] 2FA disable error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}