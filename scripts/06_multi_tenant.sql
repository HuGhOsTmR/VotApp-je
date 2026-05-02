-- Multi-Tenant Support Migration
-- Sistema Parlamentario de Votación - Multi-Institution Platform

-- ============================================================================
-- SECTION 1: INSTITUTIONS TABLE
-- ============================================================================

-- Create institutions table
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  configuration JSONB DEFAULT '{}'::jsonb,
  primary_color VARCHAR(7) DEFAULT '#1e40af', -- Default blue (#1e40af)
  secondary_color VARCHAR(7) DEFAULT '#64748b',
  public_title VARCHAR(255),
  public_description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_platform BOOLEAN DEFAULT false, -- Only one platform-level super admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE institutions IS 'Multi-tenant institutions (legislative bodies/customers)';
COMMENT ON COLUMN institutions.slug IS 'URL-friendly identifier for routing (e.g., cochabamba, senate)';
COMMENT ON COLUMN institutions.configuration IS 'JSON configuration for white-label customization';
COMMENT ON COLUMN institutions.is_platform IS 'Platform-level super admin (only one institution can have this)';

-- ============================================================================
-- SECTION 2: ADD INSTITUTION_ID TO EXISTING TABLES
-- ============================================================================

-- Add institution_id to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Add institution_id to parliamentarians
ALTER TABLE parliamentarians 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Add institution_id to sessions
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Add institution_id to motions
ALTER TABLE motions 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Add institution_id to votes
ALTER TABLE votes 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Add institution_id to attendance
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE RESTRICT;

-- Add institution_id to audit_logs
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL;

-- ============================================================================
-- SECTION 3: CREATE DEFAULT INSTITUTION (BACKWARD COMPATIBILITY)
-- ============================================================================

-- Create a default institution for existing data
INSERT INTO institutions (
  id,
  name,
  slug,
  logo_url,
  primary_color,
  public_title,
  public_description,
  is_platform,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'Brigada Parlamentaria de Cochabamba',
  'cochabamba',
  'https://example.com/placeholder-logo.png',
  '#1e40af', -- blue-900
  'Sistema Parlamentario de Votación',
  'Sistema de votación en tiempo real para la Brigada Parlamentaria de Cochabamba',
  true, -- This is the platform-level institution
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM institutions WHERE slug = 'cochabamba');

-- ============================================================================
-- SECTION 4: BACKFILL INSTITUTION_ID (MIGRATE EXISTING DATA)
-- ============================================================================

-- Get the default institution ID
DO $$
DECLARE
  v_institution_id UUID;
BEGIN
  -- Get or create default institution
  SELECT id INTO v_institution_id 
  FROM institutions 
  WHERE slug = 'cochabamba' 
  OR is_platform = true
  LIMIT 1;

  -- If no institution exists, create one
  IF v_institution_id IS NULL THEN
    INSERT INTO institutions (
      name, slug, primary_color, public_title, is_platform
    ) VALUES (
      'Default Institution', 'default', '#1e40af', 'Parliamentary Voting System', true
    )
    RETURNING id INTO v_institution_id;
  END IF;

  -- Backfill user_profiles
  UPDATE user_profiles 
  SET institution_id = v_institution_id 
  WHERE institution_id IS NULL;

  -- Backfill parliamentarians
  UPDATE parliamentarians 
  SET institution_id = v_institution_id 
  WHERE institution_id IS NULL;

  -- Backfill sessions
  UPDATE sessions 
  SET institution_id = v_institution_id 
  WHERE institution_id IS NULL;

  -- Backfill motions (will be updated via sessions cascade or direct)
  UPDATE motions 
  SET institution_id = v_institution_id 
  WHERE institution_id IS NULL;

  -- Backfill votes (will be updated via motions cascade or direct)
  UPDATE votes 
  SET institution_id = v_institution_id 
  WHERE institution_id IS NULL;

  -- Backfill attendance
  UPDATE attendance 
  SET institution_id = v_institution_id 
  WHERE institution_id IS NULL;

  -- Backfill audit_logs
  UPDATE audit_logs 
  SET institution_id = v_institution_id 
  WHERE institution_id IS NULL;

  RAISE NOTICE 'Migration complete. Default institution ID: %', v_institution_id;
END $$;

-- ============================================================================
-- SECTION 5: ADD CONSTRAINTS FOR TENANT ISOLATION
-- ============================================================================

-- Make institution_id NOT NULL (after backfill)
ALTER TABLE user_profiles ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE parliamentarians ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE sessions ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE motions ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE votes ALTER COLUMN institution_id SET NOT NULL;
ALTER TABLE attendance ALTER COLUMN institution_id SET NOT NULL;

-- ============================================================================
-- SECTION 6: UPDATE USER PROFILES ROLES
-- ============================================================================

-- Add platform_admin to role check (existing admin becomes tenant_admin for their institution)
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role IN ('platform_admin', 'tenant_admin', 'parliamentarian', 'observer'));

-- ============================================================================
-- SECTION 7: HELPER FUNCTIONS FOR TENANT ISOLATION
-- ============================================================================

-- Function to get current user's institution_id
CREATE OR REPLACE FUNCTION current_user_institution_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT institution_id 
    FROM user_profiles 
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is platform admin
CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'platform_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is tenant admin
CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('platform_admin', 'tenant_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user belongs to institution (for tenant admin)
CREATE OR REPLACE FUNCTION user_belongs_to_institution(p_institution_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND institution_id = p_institution_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 8: UPDATE RLS POLICIES FOR TENANT ISOLATION
-- ============================================================================

-- Drop existing policies and recreate with tenant isolation
-- For user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;

-- Platform admin can view all profiles
CREATE POLICY "Platform admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    is_platform_admin() OR 
    institution_id = current_user_institution_id()
  );

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Tenant admins can create profiles within their institution
CREATE POLICY "Tenant admins can create profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- Tenant admins can update profiles within their institution
CREATE POLICY "Tenant admins can update profiles" ON user_profiles
  FOR UPDATE USING (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- For parliamentarians
DROP POLICY IF EXISTS "Anyone can view parliamentarians" ON parliamentarians;
DROP POLICY IF EXISTS "Admins can insert parliamentarians" ON parliamentarians;
DROP POLICY IF EXISTS "Admins can update parliamentarians" ON parliamentarians;

-- Anyone can view parliamentarians within their institution (or public)
CREATE POLICY "View parliamentarians by institution" ON parliamentarians
  FOR SELECT USING (
    institution_id = current_user_institution_id()
  );

-- Tenant admins can insert parliamentarians
CREATE POLICY "Tenant admins can insert parliamentarians" ON parliamentarians
  FOR INSERT WITH CHECK (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- Tenant admins can update parliamentarians
CREATE POLICY "Tenant admins can update parliamentarians" ON parliamentarians
  FOR UPDATE USING (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- For sessions
DROP POLICY IF EXISTS "Anyone can view sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can create sessions" ON sessions;
DROP POLICY IF EXISTS "Admins can update sessions" ON sessions;

-- View sessions within institution
CREATE POLICY "View sessions by institution" ON sessions
  FOR SELECT USING (
    is_platform_admin() OR 
    institution_id = current_user_institution_id()
  );

-- Tenant admins can create sessions
CREATE POLICY "Tenant admins can create sessions" ON sessions
  FOR INSERT WITH CHECK (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- Tenant admins can update sessions
CREATE POLICY "Tenant admins can update sessions" ON sessions
  FOR UPDATE USING (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- For motions
DROP POLICY IF EXISTS "Anyone can view motions" ON motions;
DROP POLICY IF EXISTS "Admins can create motions" ON motions;
DROP POLICY IF EXISTS "Admins can update motions" ON motions;

-- View motions within institution
CREATE POLICY "View motions by institution" ON motions
  FOR SELECT USING (
    is_platform_admin() OR 
    institution_id = current_user_institution_id()
  );

-- Tenant admins can create motions
CREATE POLICY "Tenant admins can create motions" ON motions
  FOR INSERT WITH CHECK (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- Tenant admins can update motions
CREATE POLICY "Tenant admins can update motions" ON motions
  FOR UPDATE USING (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- For votes (always public within institution)
DROP POLICY IF EXISTS "Anyone can view votes" ON votes;
DROP POLICY IF EXISTS "Parliamentarians can insert votes" ON votes;
DROP POLICY IF EXISTS "No one can update votes" ON votes;

-- View votes within institution (public display)
CREATE POLICY "View votes by institution" ON votes
  FOR SELECT USING (
    institution_id = current_user_institution_id()
  );

-- Parliamentarians can insert votes within their institution
CREATE POLICY "Insert votes by institution" ON votes
  FOR INSERT WITH CHECK (
    is_platform_admin() OR (
      is_parliamentarian() AND 
      institution_id = current_user_institution_id()
    )
  );

-- No update allowed
CREATE POLICY "No vote updates" ON votes
  FOR UPDATE USING (false);

-- For audit_logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;

-- View audit logs within institution
CREATE POLICY "View audit logs by institution" ON audit_logs
  FOR SELECT USING (
    is_platform_admin() OR 
    institution_id = current_user_institution_id()
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- For attendance
DROP POLICY IF EXISTS "Anyone can view attendance" ON attendance;
DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;

-- View attendance within institution
CREATE POLICY "View attendance by institution" ON attendance
  FOR SELECT USING (
    is_platform_admin() OR 
    institution_id = current_user_institution_id()
  );

-- Tenant admins can manage attendance
CREATE POLICY "Manage attendance by institution" ON attendance
  FOR ALL USING (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- ============================================================================
-- SECTION 9: ADDITIONAL INDICES FOR TENANT QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_institution ON user_profiles(institution_id);
CREATE INDEX IF NOT EXISTS idx_parliamentarians_institution ON parliamentarians(institution_id);
CREATE INDEX IF NOT EXISTS idx_sessions_institution ON sessions(institution_id);
CREATE INDEX IF NOT EXISTS idx_motions_institution ON motions(institution_id);
CREATE INDEX IF NOT EXISTS idx_votes_institution ON votes(institution_id);
CREATE INDEX IF NOT EXISTS idx_attendance_institution ON attendance(institution_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_institution ON audit_logs(institution_id);
CREATE INDEX IF NOT EXISTS idx_institutions_slug ON institutions(slug);

-- ============================================================================
-- SECTION 10: UPDATE TRIGGERS FOR INSTITUTION INHERITANCE
-- ============================================================================

-- Function to inherit institution_id to child records
CREATE OR REPLACE FUNCTION set_institution_id()
RETURNS TRIGGER AS $$
DECLARE
  v_institution_id UUID;
BEGIN
  -- Determine institution_id based on table
  IF TG_TABLE_NAME = 'sessions' THEN
    IF NEW.institution_id IS NULL THEN
      SELECT institution_id INTO v_institution_id
      FROM user_profiles WHERE id = auth.uid()
      LIMIT 1;
      NEW.institution_id := v_institution_id;
    END IF;
  ELSIF TG_TABLE_NAME = 'motions' THEN
    SELECT institution_id INTO v_institution_id
    FROM sessions WHERE id = NEW.session_id
    LIMIT 1;
    NEW.institution_id := COALESCE(NEW.institution_id, v_institution_id);
  ELSIF TG_TABLE_NAME = 'votes' THEN
    SELECT institution_id INTO v_institution_id
    FROM motions WHERE id = NEW.motion_id
    LIMIT 1;
    NEW.institution_id := COALESCE(NEW.institution_id, v_institution_id);
  ELSIF TG_TABLE_NAME = 'attendance' THEN
    SELECT institution_id INTO v_institution_id
    FROM sessions WHERE id = NEW.session_id
    LIMIT 1;
    NEW.institution_id := COALESCE(NEW.institution_id, v_institution_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to auto-set institution_id for new records (optional, can be disabled if application handles it)
-- Note: These are commented out because application should handle this
-- Uncomment if you want database-level enforcement

-- CREATE TRIGGER set_session_institution
-- BEFORE INSERT ON sessions
-- FOR EACH ROW EXECUTE FUNCTION set_institution_id();

-- ============================================================================
-- SECTION 11: PLATFORM UTILITY FUNCTIONS
-- ============================================================================

-- Function to get institution by slug
CREATE OR REPLACE FUNCTION get_institution_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  logo_url TEXT,
  primary_color VARCHAR,
  public_title VARCHAR,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id, i.name, i.slug, i.logo_url, 
    i.primary_color, i.public_title, i.is_active
  FROM institutions i
  WHERE i.slug = p_slug AND i.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to check user can access institution
CREATE OR REPLACE FUNCTION can_access_institution(p_institution_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_platform_admin() OR user_belongs_to_institution(p_institution_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 12: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions for RLS (already done via policies, but ensure)
GRANT SELECT ON institutions TO authenticated;
GRANT SELECT ON institutions TO anon;

-- ============================================================================
-- FINAL NOTES
-- ============================================================================
-- 
-- To add a new institution (for demo or additional customers):
-- INSERT INTO institutions (name, slug, primary_color, public_title) 
-- VALUES ('Senate', 'senate', '#059669', 'Senate Voting System');
--
-- To make a user a tenant_admin:
-- UPDATE user_profiles SET role = 'tenant_admin', institution_id = '<institution-id>'
-- WHERE id = '<user-id>';
--
-- To make a user a platform_admin:
-- UPDATE user_profiles SET role = 'platform_admin', institution_id = '<institution-id>'
-- WHERE id = '<user-id>';
--
-- ============================================================================
