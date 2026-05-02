-- Role Management and RLS Hardening Migration
-- Sistema Parlamentario de Votación en Tiempo Real
-- Brigade Parliamentary Voting System

-- =============================================================================
-- 1. CREATE get_user_role FUNCTION
-- =============================================================================
-- Centralized function to get user role from database
-- Returns NULL if no profile exists

CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
  user_role VARCHAR(50);
BEGIN
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE id = uid;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- 2. CREATE is_observer FUNCTION
-- =============================================================================
-- Helper function for observer role check

CREATE OR REPLACE FUNCTION is_observer()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'observer'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 3. CREATE USER PROFILE CREATION TRIGGER
-- =============================================================================
-- Automatic profile creation when new auth user registers

-- Function to handle automatic user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_exists BOOLEAN;
  v_full_name TEXT;
BEGIN
  -- Check if profile already exists (idempotent)
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles 
    WHERE id = NEW.id
  ) INTO profile_exists;
  
  -- If profile exists, do nothing (idempotent)
  IF profile_exists THEN
    RETURN NULL;
  END IF;
  
  -- Extract full_name from raw_user_meta_data if available
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    'New User'
  );
  
  -- Insert new profile with default role 'observer'
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role,
    is_active,
    two_factor_enabled,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    'observer',  -- Default role
    true,
    false,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;
  
  -- Log the creation
  RAISE NOTICE 'Created user profile for % with role observer', NEW.email;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
-- Using OR REPLACE for idempotency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- 4. UPDATE EXISTING RLS POLICIES TO USE get_user_role()
-- =============================================================================
-- Refactor is_admin() to optionally use get_user_role for flexibility

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Refactor is_parliamentarian()
CREATE OR REPLACE FUNCTION is_parliamentarian()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'parliamentarian'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. ADDITIONAL HELPER FUNCTIONS FOR FLEXIBLE ROLE CHECKS
-- =============================================================================

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(target_role VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = target_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current user profile
CREATE OR REPLACE FUNCTION get_current_user_profile()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50),
  is_active BOOLEAN,
  two_factor_enabled BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    up.two_factor_enabled,
    up.created_at,
    up.updated_at
  FROM public.user_profiles up
  WHERE up.id = auth.uid();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- 6. GRANT PERMISSIONS FOR NEW FUNCTIONS
-- =============================================================================

-- Grant execute permissions to authenticated role
GRANT EXECUTE ON FUNCTION get_user_role(uid UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION is_parliamentarian() TO authenticated;
GRANT EXECUTE ON FUNCTION is_observer() TO authenticated;
GRANT EXECUTE ON FUNCTION has_role(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_current_user_profile() TO authenticated;

-- =============================================================================
-- 7. DOCUMENTATION COMMENTS
-- =============================================================================

COMMENT ON FUNCTION get_user_role(uid UUID) IS 
'Returns the role from public.user_profiles for the given user id. Returns NULL if no profile exists.';

COMMENT ON FUNCTION handle_new_user() IS 
'Trigger function to automatically create user profile when new auth user is inserted. Idempotent - handles existing records gracefully.';

COMMENT ON FUNCTION has_role(target_role VARCHAR) IS 
'Checks if the current authenticated user has the specified role.';

-- =============================================================================
-- 8. VERIFICATION QUERIES (for testing)
-- =============================================================================

-- Test get_user_role function (will return NULL if no user exists)
-- SELECT get_user_role('00000000-0000-0000-0000-000000000001');

-- List all users and their roles
-- SELECT id, email, role, full_name FROM user_profiles ORDER BY created_at DESC;

-- Check trigger exists
-- SELECT tgname, proname, pronargs FROM pg_trigger t 
-- JOIN pg_proc p ON t.tgfoid = p.oid 
-- WHERE tgname = 'on_auth_user_created';
