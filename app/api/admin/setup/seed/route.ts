import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Insertar parlamentarios de ejemplo
    const parliamentarians = [
      { full_name: 'Juan Morales', political_party: 'MAS', circumscription: 'Cochabamba' },
      { full_name: 'María García', political_party: 'UN', circumscription: 'Cochabamba' },
      { full_name: 'Carlos López', political_party: 'CC', circumscription: 'Cochabamba' },
      { full_name: 'Ana Rodríguez', political_party: 'MAS', circumscription: 'Cochabamba' },
      { full_name: 'Pedro Fernández', political_party: 'UN', circumscription: 'Cochabamba' },
      { full_name: 'Rosa Martínez', political_party: 'CC', circumscription: 'Cochabamba' },
      { full_name: 'Luis González', political_party: 'MAS', circumscription: 'Cochabamba' },
      { full_name: 'Carmen Díaz', political_party: 'UN', circumscription: 'Cochabamba' },
      { full_name: 'Diego Sánchez', political_party: 'CC', circumscription: 'Cochabamba' },
      { full_name: 'Isabel Torres', political_party: 'MAS', circumscription: 'Cochabamba' },
      { full_name: 'Fernando Ruiz', political_party: 'UN', circumscription: 'Cochabamba' },
      { full_name: 'Gloria Vega', political_party: 'CC', circumscription: 'Cochabamba' },
      { full_name: 'Roberto Flores', political_party: 'MAS', circumscription: 'Cochabamba' },
      { full_name: 'Elena Castro', political_party: 'UN', circumscription: 'Cochabamba' },
      { full_name: 'Javier Mendez', political_party: 'CC', circumscription: 'Cochabamba' },
      { full_name: 'Natalia Reyes', political_party: 'MAS', circumscription: 'Cochabamba' },
      { full_name: 'Guillermo Paz', political_party: 'UN', circumscription: 'Cochabamba' },
      { full_name: 'Sofía Álvarez', political_party: 'CC', circumscription: 'Cochabamba' },
      { full_name: 'Miguel Herrera', political_party: 'MAS', circumscription: 'Cochabamba' },
      { full_name: 'Valentina Acosta', political_party: 'UN', circumscription: 'Cochabamba' },
    ];

    // Insertar parlamentarios
    const { error: parlError } = await supabase
      .from('parliamentarians')
      .insert(parliamentarians)
      .select();

    if (parlError && !parlError.message.includes('duplicate')) {
      console.error('[v0] Seed error:', parlError);
      return NextResponse.json(
        { success: false, error: 'Seed failed: ' + parlError.message },
        { status: 400 }
      );
    }

    // Insertar una sesión de ejemplo
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        legislature_number: 2024,
        session_date: new Date().toISOString().split('T')[0],
        title: 'Sesión Ordinaria',
        description: 'Primera sesión de prueba del sistema de votación',
        status: 'active',
      })
      .select()
      .single();

    if (sessionError && !sessionError.message.includes('duplicate')) {
      console.error('[v0] Session error:', sessionError);
    }

    return NextResponse.json({
      success: true,
      message: `Seed data loaded: ${parliamentarians.length} parliamentarians + 1 session`,
      data: { parliaments_count: parliamentarians.length, session: sessionData },
    });
  } catch (error) {
    console.error('[v0] Seed error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
