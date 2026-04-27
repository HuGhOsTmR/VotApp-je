-- Sistema Parlamentario de Votación en Tiempo Real
-- Schema de Base de Datos PostgreSQL
-- Brigada Parlamentaria de Cochabamba, Bolivia

-- Tabla de perfiles de usuario (extendida desde Supabase Auth)
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

-- Tabla de mociones (proyectos de resolución)
CREATE TABLE IF NOT EXISTS motions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  proposer_id UUID NOT NULL REFERENCES parliamentarians(id) ON DELETE RESTRICT,
  motion_type VARCHAR(100) NOT NULL, -- e.g., 'resolution', 'amendment', 'question'
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'open', 'closed', 'rejected', 'approved')),
  voting_start_time TIMESTAMP WITH TIME ZONE,
  voting_end_time TIMESTAMP WITH TIME ZONE,
  minimum_votes_required INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (proposer_id) REFERENCES parliamentarians(id) ON DELETE RESTRICT
);

-- Tabla de votos (auditoría nominal)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motion_id UUID NOT NULL REFERENCES motions(id) ON DELETE CASCADE,
  parliamentarian_id UUID NOT NULL REFERENCES parliamentarians(id) ON DELETE RESTRICT,
  vote_type VARCHAR(50) NOT NULL CHECK (vote_type IN ('favor', 'against', 'abstention', 'absent')),
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(motion_id, parliamentarian_id), -- Un voto por parlamentario por moción
  FOREIGN KEY (motion_id) REFERENCES motions(id) ON DELETE CASCADE,
  FOREIGN KEY (parliamentarian_id) REFERENCES parliamentarians(id) ON DELETE RESTRICT
);

-- Tabla de logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- e.g., 'session_created', 'motion_opened', 'vote_cast', 'vote_closed'
  entity_type VARCHAR(50) NOT NULL, -- 'session', 'motion', 'vote', 'user', 'parliamentarian'
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, parliamentarian_id)
);

-- INDICES para optimizar queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_parliamentarians_party ON parliamentarians(political_party);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_motions_session_id ON motions(session_id);
CREATE INDEX IF NOT EXISTS idx_motions_status ON motions(status);
CREATE INDEX IF NOT EXISTS idx_votes_motion_id ON votes(motion_id);
CREATE INDEX IF NOT EXISTS idx_votes_parliamentarian_id ON votes(parliamentarian_id);
CREATE INDEX IF NOT EXISTS idx_votes_timestamp ON votes(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parliamentarians ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE motions ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- POLICIES para user_profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can create profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update profiles" ON user_profiles
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- POLICIES para parliamentarians (visible a todos)
CREATE POLICY "Anyone can view parliamentarians" ON parliamentarians
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert parliamentarians" ON parliamentarians
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update parliamentarians" ON parliamentarians
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- POLICIES para sessions
CREATE POLICY "Anyone can view sessions" ON sessions
  FOR SELECT USING (true);

CREATE POLICY "Admins can create sessions" ON sessions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update sessions" ON sessions
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- POLICIES para motions
CREATE POLICY "Anyone can view motions" ON motions
  FOR SELECT USING (true);

CREATE POLICY "Admins can create motions" ON motions
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update motions" ON motions
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- POLICIES para votes (nominales y públicas)
CREATE POLICY "Anyone can view votes" ON votes
  FOR SELECT USING (true);

CREATE POLICY "Parliamentarians can insert votes" ON votes
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'parliamentarian' OR auth.jwt() ->> 'role' = 'admin'
  );

-- Prevenir cambio de voto (no permitir UPDATE)
CREATE POLICY "No one can update votes" ON votes
  FOR UPDATE USING (false);

-- POLICIES para audit_logs (solo admins)
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- POLICIES para attendance
CREATE POLICY "Anyone can view attendance" ON attendance
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage attendance" ON attendance
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- TRIGGERS para auditoría automática
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    COALESCE(auth.uid(), NULL),
    TG_ARGV[0],
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', row_to_json(OLD),
      'new', row_to_json(NEW)
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para votos
CREATE TRIGGER vote_audit_trigger
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION log_audit('vote_cast');

-- Trigger para mociones
CREATE TRIGGER motion_audit_trigger
AFTER INSERT OR UPDATE ON motions
FOR EACH ROW
EXECUTE FUNCTION log_audit(
  CASE WHEN TG_OP = 'INSERT' THEN 'motion_created' ELSE 'motion_updated' END
);

-- Trigger para sesiones
CREATE TRIGGER session_audit_trigger
AFTER INSERT OR UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION log_audit(
  CASE WHEN TG_OP = 'INSERT' THEN 'session_created' ELSE 'session_updated' END
);

-- FUNCIÓN para obtener resultados agregados de una moción
CREATE OR REPLACE FUNCTION get_motion_results(p_motion_id UUID)
RETURNS TABLE (
  favor_count BIGINT,
  against_count BIGINT,
  abstention_count BIGINT,
  absent_count BIGINT,
  total_votes BIGINT,
  quorum_met BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE vote_type = 'favor') as favor_count,
    COUNT(*) FILTER (WHERE vote_type = 'against') as against_count,
    COUNT(*) FILTER (WHERE vote_type = 'abstention') as abstention_count,
    COUNT(*) FILTER (WHERE vote_type = 'absent') as absent_count,
    COUNT(*) as total_votes,
    (COUNT(*) FILTER (WHERE vote_type IN ('favor', 'against', 'abstention'))) >= 50 as quorum_met
  FROM votes
  WHERE motion_id = p_motion_id;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN para prevenir votos duplicados (constraint a nivel aplicación)
CREATE OR REPLACE FUNCTION check_vote_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM votes
    WHERE motion_id = NEW.motion_id
    AND parliamentarian_id = NEW.parliamentarian_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'Este parlamentario ya ha votado en esta moción';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vote_uniqueness_trigger
BEFORE INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION check_vote_uniqueness();

-- COMENTARIOS de documentación
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario con rol asignado';
COMMENT ON TABLE parliamentarians IS 'Lista de parlamentarios y sus datos';
COMMENT ON TABLE sessions IS 'Sesiones parlamentarias';
COMMENT ON TABLE motions IS 'Mociones/resoluciones sometidas a votación';
COMMENT ON TABLE votes IS 'Registro nominal de votos (público y auditable)';
COMMENT ON TABLE audit_logs IS 'Log inmutable de todas las acciones del sistema';
COMMENT ON TABLE attendance IS 'Asistencia de parlamentarios a sesiones';
