-- Identity Linkage and Parliamentarian Assignment Hardening Migration
-- Sistema Parlamentario de Votación en Tiempo Real
-- Brigade Parliamentary Voting System

-- =============================================================================
-- 1. ENFORCE STRICT ONE-TO-ONE LINKAGE
-- =============================================================================
-- Add unique index on user_id to enforce one-to-one relationship
-- This ensures each parliamentarian can only be linked to one user

-- Drop existing index if exists (for idempotency)
DROP INDEX IF EXISTS idx_parliamentarians_user_id_unique;

-- Create unique index (NULLs are allowed but must be unique among non-null values)
CREATE UNIQUE INDEX idx_parliamentarians_user_id_unique 
ON parliamentarians(user_id) 
WHERE user_id IS NOT NULL;

-- =============================================================================
-- 2. HELPER FUNCTIONS FOR ORPHAN/DUPLICATE DETECTION
-- =============================================================================

-- Function to detect parliamentarians without linked users (orphans)
CREATE OR REPLACE FUNCTION get_orphan_parliamentarians()
RETURNS TABLE (
  id UUID,
  full_name VARCHAR(255),
  political_party VARCHAR(255),
  circumscription VARCHAR(255),
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.political_party,
    p.circumscription,
    p.is_active,
    p.created_at
  FROM parliamentarians p
  WHERE p.user_id IS NULL
    AND p.is_active = true
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_orphan_parliamentarians() TO authenticated;

-- Function to detect users with parliamentarian role but no linked parliamentarian
CREATE OR REPLACE FUNCTION get_users_without_linked_parliamentarian()
RETURNS TABLE (
  id UUID,
  email VARCHAR(255),
  full_name VARCHAR(255),
  role VARCHAR(50),
  is_active BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.email,
    up.full_name,
    up.role,
    up.is_active,
    up.created_at
  FROM user_profiles up
  WHERE up.role = 'parliamentarian'
    AND up.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM parliamentarians p 
      WHERE p.user_id = up.id AND p.is_active = true
    )
  ORDER BY up.full_name;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_users_without_linked_parliamentarian() TO authenticated;

-- Function to detect duplicate/misconfigured assignments
-- (users linked to multiple parliamentarians or vice versa)
CREATE OR REPLACE FUNCTION get_linkage_conflicts()
RETURNS TABLE (
  conflict_type VARCHAR(50),
  user_id UUID,
  user_email VARCHAR(255),
  parliamentarian_ids UUID[],
  count INTEGER
) AS $$
BEGIN
  -- Return users linked to multiple parliamentarians
  RETURN QUERY
  SELECT 
    'multiple_parliamentarians'::VARCHAR(50) AS conflict_type,
    up.id AS user_id,
    up.email AS user_email,
    ARRAY_AGG(p.id) AS parliamentarian_ids,
    COUNT(p.id)::INTEGER AS count
  FROM user_profiles up
  JOIN parliamentarians p ON p.user_id = up.id AND p.is_active = true
  GROUP BY up.id, up.email
  HAVING COUNT(p.id) > 1;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_linkage_conflicts() TO authenticated;

-- =============================================================================
-- 3. VALIDATION FUNCTION FOR ADMIN ASSIGNMENT WORKFLOW
-- =============================================================================

-- Function to validate a proposed user-parliamentarian linkage
-- Returns JSON with valid status and reason
CREATE OR REPLACE FUNCTION validate_linkage(
  p_user_id UUID,
  p_parliamentarian_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_user_record RECORD;
  v_parliamentarian_record RECORD;
  v_existing_link RECORD;
  v_result JSONB;
BEGIN
  -- Check if user exists
  SELECT id, email, full_name, role, is_active
  INTO v_user_record
  FROM user_profiles
  WHERE id = p_user_id;

  IF v_user_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'user_not_found',
      'message', 'El usuario no existe'
    );
  END IF;

  -- Check if user has parliamentarian role
  IF v_user_record.role != 'parliamentarian' THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'invalid_user_role',
      'message', 'Solo los usuarios con rol parlamentarian pueden ser vinculados'
    );
  END IF;

  IF NOT v_user_record.is_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'user_inactive',
      'message', 'El usuario no está activo'
    );
  END IF;

  -- Check if parliamentarian exists
  SELECT id, full_name, user_id, is_active
  INTO v_parliamentarian_record
  FROM parliamentarians
  WHERE id = p_parliamentarian_id;

  IF v_parliamentarian_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'parliamentarian_not_found',
      'message', 'El parlamentario no existe'
    );
  END IF;

  IF NOT v_parliamentarian_record.is_active THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'parliamentarian_inactive',
      'message', 'El parlamentario no está activo'
    );
  END IF;

  -- Check if this parliamentarian is already linked to another user
  IF v_parliamentarian_record.user_id IS NOT NULL 
     AND v_parliamentarian_record.user_id != p_user_id THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'parliamentarian_already_linked',
      'message', 'Este parlamentario ya está vinculado a otro usuario'
    );
  END IF;

  -- Check if user is already linked to another parliamentarian
  SELECT id, full_name
  INTO v_existing_link
  FROM parliamentarians
  WHERE user_id = p_user_id
    AND id != p_parliamentarian_id
    AND is_active = true;

  IF v_existing_link.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'reason', 'user_already_linked',
      'message', 'Este usuario ya está vinculado a otro parlamentaria',
      'existing_parliamentarian_id', v_existing_link.id,
      'existing_parliamentarian_name', v_existing_link.full_name
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'valid', true,
    'reason', 'valid',
    'message', 'El enlace es válido'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION validate_linkage(UUID, UUID) TO authenticated;

-- =============================================================================
-- 4. FUNCTION TO GET CURRENT USER'S LINKED PARLIAMENTARIAN
-- =============================================================================

-- Function to get the parliamentarian linked to the current authenticated user
CREATE OR REPLACE FUNCTION get_current_user_parliamentarian()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name VARCHAR(255),
  political_party VARCHAR(255),
  circumscription VARCHAR(255),
  email VARCHAR(255),
  phone_number VARCHAR(20),
  photo_url TEXT,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.full_name,
    p.political_party,
    p.circumscription,
    p.email,
    p.phone_number,
    p.photo_url,
    p.is_active
  FROM parliamentarians p
  WHERE p.user_id = auth.uid()
    AND p.is_active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_current_user_parliamentarian() TO authenticated;

-- =============================================================================
-- 5. SAFE REASSIGNMENT FUNCTION
-- =============================================================================

-- Function to safely reassign parliamentarian-user link (admin only)
CREATE OR REPLACE FUNCTION reassign_parliamentarian_link(
  p_parliamentarian_id UUID,
  p_new_user_id UUID,
  p_unlink_only BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parliamentarian_record RECORD;
  v_validation_result JSONB;
  v_old_user_id UUID;
BEGIN
  -- Check admin privileges
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Solo los administradores pueden realizar esta operación'
    );
  END IF;

  -- Get current parliamentarian state
  SELECT id, user_id, full_name
  INTO v_parliamentarian_record
  FROM parliamentarians
  WHERE id = p_parliamentarian_id;

  IF v_parliamentarian_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'parliamentarian_not_found',
      'message', 'El parlamentario no existe'
    );
  END IF;

  v_old_user_id := v_parliamentarian_record.user_id;

  -- If unlink only, just set user_id to NULL
  IF p_unlink_only THEN
    UPDATE parliamentarians
    SET user_id = NULL, updated_at = NOW()
    WHERE id = p_parliamentarian_id;

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Usuario desvinculado exitosamente',
      'parliamentarian_id', p_parliamentarian_id,
      'previous_user_id', v_old_user_id
    );
  END IF;

  -- Validate the new linkage
  v_validation_result := validate_linkage(p_new_user_id, p_parliamentarian_id);

  IF NOT (v_validation_result->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', v_validation_result->>'reason',
      'message', v_validation_result->>'message'
    );
  END IF;

  -- Perform the reassignment
  UPDATE parliamentarians
  SET user_id = p_new_user_id, updated_at = NOW()
  WHERE id = p_parliamentarian_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Usuario vinculado exitosamente',
    'parliamentarian_id', p_parliamentarian_id,
    'new_user_id', p_new_user_id,
    'previous_user_id', v_old_user_id
  );

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'duplicate_link',
      'message', 'El parlamentario ya está vinculado a otro usuario'
    );
  WHEN OTHERS THEN
    RAISE;
END;
$$;

GRANT EXECUTE ON FUNCTION reassign_parliamentarian_link(UUID, UUID, BOOLEAN) TO authenticated;

-- =============================================================================
-- 6. GET PARLIAMENTARIAN ID FROM AUTH (for vote casting)
-- =============================================================================

-- Function to get parliamentarian_id for current user (used in vote API)
CREATE OR REPLACE FUNCTION get_parliamentarian_id_for_user(p_user_id UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_parliamentarian_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT p.id INTO v_parliamentarian_id
  FROM parliamentarians p
  WHERE p.user_id = v_user_id
    AND p.is_active = true
  LIMIT 1;

  RETURN v_parliamentarian_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_parliamentarian_id_for_user(UUID) TO authenticated;

-- =============================================================================
-- 7. DIAGNOSTIC VIEW
-- =============================================================================

-- Create a view showing all linkage status
CREATE OR REPLACE VIEW v_parliamentarian_linkage_status AS
SELECT 
  p.id AS parliamentarian_id,
  p.full_name AS parliamentarian_name,
  p.political_party,
  p.is_active AS parliamentarian_active,
  p.user_id,
  up.email AS user_email,
  up.full_name AS user_name,
  up.role AS user_role,
  up.is_active AS user_active,
  CASE 
    WHEN p.user_id IS NULL THEN 'orphan'
    WHEN up.id IS NULL THEN 'orphaned_user'
    WHEN p.is_active = true AND up.is_active = true THEN 'linked'
    WHEN p.is_active = false THEN 'parliamentarian_inactive'
    WHEN up.is_active = false THEN 'user_inactive'
    ELSE 'unknown'
  END AS linkage_status
FROM parliamentarians p
LEFT JOIN user_profiles up ON up.id = p.user_id;

GRANT SELECT ON v_parliamentarian_linkage_status TO authenticated;

-- =============================================================================
-- 8. DOCUMENTATION COMMENTS
-- =============================================================================

COMMENT ON UNIQUE INDEX idx_parliamentarians_user_id_unique IS 
'Ensures one-to-one relationship: each parliamentarian can link to only one user';

COMMENT ON FUNCTION get_orphan_parliamentarians() IS 
'Returns parliamentarians without a linked user account';

COMMENT ON FUNCTION get_users_without_linked_parliamentarian() IS 
'Returns users with parliamentarian role but no linked parliamentarian';

COMMENT ON FUNCTION get_linkage_conflicts() IS 
'Returns users linked to multiple parliamentarians (should not happen)';

COMMENT ON FUNCTION validate_linkage(UUID, UUID) IS 
'Validates if a user-parliamentarian linkage can be created. Returns JSON with valid status and reason.';

COMMENT ON FUNCTION get_current_user_parliamentarian() IS 
'Returns the parliamentarian linked to the current authenticated user';

COMMENT ON FUNCTION reassign_parliamentarian_link(UUID, UUID, BOOLEAN) IS 
'Safely reassigns/unlinks parliamentarian-user link. Admin only. Returns JSON result.';

COMMENT ON FUNCTION get_parliamentarian_id_for_user(UUID) IS 
'Returns the parliamentarian_id linked to a user. Uses auth.uid() if no user_id provided.';

COMMENT ON VIEW v_parliamentarian_linkage_status IS 
'Diagnostic view showing status of all parliamentarian-user linkages';

-- =============================================================================
-- 9. VERIFICATION QUERIES
-- =============================================================================

-- Check for orphans
-- SELECT * FROM get_orphan_parliamentarians();

-- Check for users without parliamentarian
-- SELECT * FROM get_users_without_linked_parliamentarian();

-- Check for conflicts
-- SELECT * FROM get_linkage_conflicts();

-- Check linkage status
-- SELECT * FROM v_parliamentarian_linkage_status;

-- Validate a linkage
-- SELECT validate_linkage('user-uuid', 'parliamentarian-uuid');

-- Get current user's parliamentarian
-- SELECT * FROM get_current_user_parliamentarian();
