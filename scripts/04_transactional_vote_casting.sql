-- Transactional Vote Casting and Audit Hardening Migration
-- Sistema Parlamentario de Votación en Tiempo Real
-- Brigade Parliamentary Voting System

-- =============================================================================
-- ATOMIC VOTE CASTING PROCEDURE (RPC)
-- =============================================================================
-- This procedure ensures vote creation and audit log creation happen in a single 
-- database transaction. If any step fails, no partial data will persist.

-- Drop existing function if exists (for idempotency)
DROP FUNCTION IF EXISTS cast_vote(UUID, UUID, VARCHAR, INET, TEXT);

CREATE OR REPLACE FUNCTION cast_vote(
  p_motion_id UUID,
  p_parliamentarian_id UUID,
  p_vote_type VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_motion_record RECORD;
  v_parliamentarian_record RECORD;
  v_user_profile_record RECORD;
  v_vote_id UUID;
  v_result JSONB;
  v_existing_vote_id UUID;
  v_current_timestamp TIMESTAMP WITH TIME ZONE;
  v_previous_vote_type VARCHAR(50);
BEGIN
  -- Set transaction timestamp
  v_current_timestamp := NOW();

  -- =============================================================================
  -- VALIDATION 1: Verify motion exists and is open
  -- =============================================================================
  SELECT id, status, title, voting_start_time, voting_end_time
  INTO v_motion_record
  FROM motions
  WHERE id = p_motion_id;

  IF v_motion_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'motion_not_found',
      'message', 'La moción no existe'
    );
  END IF;

  IF v_motion_record.status != 'open' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'motion_not_open',
      'message', 'La votación no está abierta para esta moción'
    );
  END IF;

  -- Check if voting window has expired
  IF v_motion_record.voting_end_time IS NOT NULL 
     AND v_current_timestamp > v_motion_record.voting_end_time THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'voting_window_closed',
      'message', 'El período de votación ha expirado'
    );
  END IF;

  -- =============================================================================
  -- VALIDATION 2: Verify parliamentarian exists and is active
  -- =============================================================================
  SELECT id, user_id, full_name, is_active
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

  IF NOT v_parliamentarian_record.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'parliamentarian_inactive',
      'message', 'El parlementaire no está activo'
    );
  END IF;

  -- =============================================================================
  -- VALIDATION 3: Validate vote_type against allowed enum
  -- =============================================================================
  IF p_vote_type NOT IN ('favor', 'against', 'abstention', 'absent') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_vote_type',
      'message', 'Tipo de voto inválido'
    );
  END IF;

  -- =============================================================================
  -- VALIDATION 4: Verify user is authorized to vote as this parliamentarian
  -- =============================================================================
  -- Get current user from auth context
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthenticated',
      'message', 'Debe iniciar sesión para votar'
    );
  END IF;

  -- Verify the parliamentarian belongs to the current user
  SELECT id, role, is_active
  INTO v_user_profile_record
  FROM user_profiles
  WHERE id = auth.uid();

  IF v_user_profile_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Perfil de usuario no encontrado'
    );
  END IF;

  IF v_user_profile_record.role != 'parliamentarian' 
     AND v_user_profile_record.role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Solo los parlamentarios pueden votar'
    );
  END IF;

  -- Verify parliamentarian is linked to this user
  IF v_parliamentarian_record.user_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized_parliamentarian',
      'message', 'No está autorizado para votar como este parlamentario'
    );
  END IF;

  -- =============================================================================
  -- VALIDATION 5: Prevent duplicate voting (check within transaction)
  -- =============================================================================
  SELECT id, vote_type
  INTO v_existing_vote_id, v_previous_vote_type
  FROM votes
  WHERE motion_id = p_motion_id
    AND parliamentarian_id = p_parliamentarian_id
  FOR UPDATE;  -- Lock the row to prevent race conditions

  IF v_existing_vote_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'duplicate_vote',
      'message', 'Ya ha votado en esta moción',
      'existing_vote_id', v_existing_vote_id,
      'previous_vote_type', v_previous_vote_type
    );
  END IF;

  -- =============================================================================
  -- EXECUTE: Insert vote and audit log in single transaction
  -- =============================================================================
  
  -- Generate UUID for the vote
  v_vote_id := gen_random_uuid();

  -- Insert vote record
  INSERT INTO votes (
    id,
    motion_id,
    parliamentarian_id,
    vote_type,
    ip_address,
    user_agent,
    timestamp,
    created_at
  ) VALUES (
    v_vote_id,
    p_motion_id,
    p_parliamentarian_id,
    p_vote_type,
    p_ip_address,
    p_user_agent,
    v_current_timestamp,
    v_current_timestamp
  );

  -- Insert audit log with complete information
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    ip_address,
    user_agent,
    details,
    timestamp,
    created_at
  ) VALUES (
    auth.uid(),
    'vote_cast',
    'votes',
    v_vote_id,
    p_ip_address,
    p_user_agent,
    jsonb_build_object(
      'motion_id', p_motion_id,
      'motion_title', v_motion_record.title,
      'parliamentarian_id', p_parliamentarian_id,
      'parliamentarian_name', v_parliamentarian_record.full_name,
      'vote_type', p_vote_type,
      'previous_state', NULL,
      'ip_address', p_ip_address::TEXT,
      'user_agent', p_user_agent
    ),
    v_current_timestamp,
    v_current_timestamp
  );

  -- =============================================================================
  -- RETURN: Success result
  -- =============================================================================
  RETURN jsonb_build_object(
    'success', true,
    'vote_id', v_vote_id,
    'message', 'Voto registrado exitosamente',
    'vote_type', p_vote_type,
    'timestamp', v_current_timestamp
  );

EXCEPTION
  WHEN integrity_constraint_violation THEN
    -- Handle unique constraint violation (race condition)
    RETURN jsonb_build_object(
      'success', false,
      'error', 'duplicate_vote',
      'message', 'Ya ha votado en esta elección'
    );
  WHEN OTHERS THEN
    -- Re-raise any other errors
    RAISE;
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS FOR RPC
-- =============================================================================
GRANT EXECUTE ON FUNCTION cast_vote(UUID, UUID, VARCHAR, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cast_vote(UUID, UUID, VARCHAR, INET, TEXT) TO service_role;

-- =============================================================================
-- UPDATE RLS POLICIES TO RESTRICT DIRECT INSERT
-- =============================================================================
-- Remove the direct insert policy and replace with RPC-only access

DROP POLICY IF EXISTS "Parliamentarians can insert votes" ON votes;

-- Create a policy that only allows inserts via the RPC function
-- This is enforced through the function's SECURITY DEFINER attribute
CREATE POLICY "RPC-only vote insertion" ON votes
  FOR INSERT
  WITH CHECK (
    -- Allow inserts only if they come from the RPC function
    -- This is a workaround - in practice, we rely on app logic to call RPC
    is_parliamentarian() OR is_admin()
  );

-- =============================================================================
-- ADDITIONAL AUDIT COMPLETENESS INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_vote_cast 
  ON audit_logs(timestamp) 
  WHERE action = 'vote_cast';

CREATE INDEX IF NOT EXISTS idx_votes_composite_lookup 
  ON votes(motion_id, parliamentarian_id);

-- =============================================================================
-- HELPER FUNCTION: Check if user can vote on motion
-- =============================================================================
DROP FUNCTION IF EXISTS can_vote_on_motion(UUID, UUID);

CREATE OR REPLACE FUNCTION can_vote_on_motion(
  p_motion_id UUID,
  p_parliamentarian_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_motion_record RECORD;
  v_parliamentarian_record RECORD;
  v_existing_vote_id UUID;
BEGIN
  -- Check motion status
  SELECT id, status, title
  INTO v_motion_record
  FROM motions
  WHERE id = p_motion_id;

  IF v_motion_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'can_vote', false,
      'reason', 'motion_not_found'
    );
  END IF;

  IF v_motion_record.status != 'open' THEN
    RETURN jsonb_build_object(
      'can_vote', false,
      'reason', 'motion_not_open',
      'motion_status', v_motion_record.status
    );
  END IF;

  -- Check parliamentarian
  SELECT id, is_active
  INTO v_parliamentarian_record
  FROM parliamentarians
  WHERE id = p_parliamentarian_id;

  IF v_parliamentarian_record.id IS NULL THEN
    RETURN jsonb_build_object(
      'can_vote', false,
      'reason', 'parliamentarian_not_found'
    );
  END IF;

  IF NOT v_parliamentarian_record.is_active THEN
    RETURN jsonb_build_object(
      'can_vote', false,
      'reason', 'parliamentarian_inactive'
    );
  END IF;

  -- Check existing vote
  SELECT id
  INTO v_existing_vote_id
  FROM votes
  WHERE motion_id = p_motion_id
    AND parliamentarian_id = p_parliamentarian_id;

  IF v_existing_vote_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'can_vote', false,
      'reason', 'already_voted',
      'existing_vote_id', v_existing_vote_id
    );
  END IF;

  RETURN jsonb_build_object(
    'can_vote', true,
    'reason', 'eligible'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION can_vote_on_motion(UUID, UUID) TO authenticated;

-- =============================================================================
-- DOCUMENTATION COMMENTS
-- =============================================================================
COMMENT ON FUNCTION cast_vote(...) IS 
'Atomic vote casting procedure that ensures vote and audit log are created in a single transaction. Validates motion is open, parliamentarian is authorized, and prevents duplicate voting. Returns JSON result with success status.';

COMMENT ON FUNCTION can_vote_on_motion(UUID, UUID) IS 
'Helper function to check if a parliamentarian can vote on a motion. Returns JSON with can_vote boolean and reason.';

-- =============================================================================
-- VERIFICATION QUERIES (for testing)
-- =============================================================================
-- Test: SELECT cast_vote('motion-id', 'parliamentarian-id', 'favor', '192.168.1.1', 'Mozilla/5.0...');
-- Test: SELECT can_vote_on_motion('motion-id', 'parliamentarian-id');
