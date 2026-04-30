import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// SQL para crear las tablas
const SCHEMA_SQL = `
-- Tabla de perfiles de usuario
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'parliamentarian', 'observer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de parlamentarios
CREATE TABLE IF NOT EXISTS parliamentarians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  political_party VARCHAR(255) NOT NULL,
  circumscription VARCHAR(255) NOT NULL,
  photo_url TEXT,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email) WHERE email IS NOT NULL
);

-- Tabla de sesiones parlamentarias
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legislature_number INTEGER NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('scheduled', 'active', 'closed', 'cancelled')),
  title VARCHAR(255),
  description TEXT,
  quorum_required INTEGER DEFAULT 50,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de mociones
CREATE TABLE IF NOT EXISTS motions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  proposer_id UUID NOT NULL REFERENCES parliamentarians(id) ON DELETE RESTRICT,
  motion_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'closed', 'rejected', 'approved')),
  voting_start_time TIMESTAMP WITH TIME ZONE,
  voting_end_time TIMESTAMP WITH TIME ZONE,
  minimum_votes_required INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de votos
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motion_id UUID NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
  parliamentarian_id UUID NOT NULL REFERENCES parliamentarians(id) ON DELETE RESTRICT,
  vote_type VARCHAR(50) NOT NULL CHECK (vote_type IN ('favor', 'against', 'abstention', 'absent')),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(motion_id, parliamentarian_id)
);

-- Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asistencia
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  parliamentarian_id UUID NOT NULL REFERENCES parliamentarians(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'excused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Ejecutar el SQL
    const { error } = await supabase.rpc('execute_sql', {
      sql: SCHEMA_SQL,
    }).catch(() => {
      // Si rpc no existe, usar query directa
      return supabase.from('_sql').insert({ query: SCHEMA_SQL });
    });

    if (error && !error.message.includes('already exists')) {
      console.error('[v0] Migration error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Migration failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
    });
  } catch (error) {
    console.error('[v0] Migration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
