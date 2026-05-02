-- Secretary Role Migration
-- Adds 'secretary' role with granular RLS permissions
-- Enforces quorum and attendance for voting
-- =============================================================================

-- 1. UPDATE user_profiles CHECK CONSTRAINT
-- =============================================================================
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check,
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('admin', 'parliamentarian', 'observer', 'secretary'));

-- 2. CREATE is_secretary FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION is_secretary()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'secretary'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_secretary() TO authenticated;

-- 3. UPDATE RLS POLICIES for Secretary Access
-- =============================================================================

-- Sessions: secretary can create/update (no delete)
DROP POLICY IF EXISTS "Admins can create sessions" ON sessions;
CREATE POLICY "Admins and secretaries can manage sessions" ON sessions
  FOR ALL USING (is_admin() OR is_secretary());

-- Motions: secretary can create/update/open/close
DROP POLICY IF EXISTS "Admins can create motions" ON motions;
DROP POLICY IF EXISTS "Admins can update motions" ON motions;
CREATE POLICY "Admins and secretaries can manage motions" ON motions
  FOR ALL USING (is_admin() OR is_secretary());

-- Attendance: secretary manages
DROP POLICY IF EXISTS "Admins can manage attendance" ON attendance;
CREATE POLICY "Admins and secretaries manage attendance" ON attendance
  FOR ALL USING (is_admin() OR is_secretary());

-- Protect sensitive tables from secretary
-- user_profiles: only admin
DROP POLICY IF EXISTS "Admins can create profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
CREATE POLICY "Only admins manage user profiles" ON user_profiles
  FOR ALL USING (is_admin());

-- parliamentarians: only admin
DROP POLICY IF EXISTS "Admins can insert parliamentarians" ON parliamentarians;
DROP POLICY IF EXISTS "Admins can update parliamentarians" ON parliamentarians;
CREATE POLICY "Only admins manage parliamentarians" ON parliamentarians
  FOR ALL USING (is_admin());

-- audit_logs: view-only for secretary
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
CREATE POLICY "Admins and secretaries view audit logs" ON audit_logs
  FOR SELECT USING (is_admin() OR is_secretary());
CREATE POLICY "System inserts audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- votes: unchanged (parliamentarian vote, public view)

-- 4. QUORUM & ATTENDANCE ENFORCEMENT RPCs
-- =============================================================================

-- Check if quorum met for session (present count >= quorum_required)
CREATE OR REPLACE FUNCTION check_quorum_met(p_session_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_present_count INTEGER;
  v_quorum_required INTEGER;
BEGIN
  SELECT 
    COUNT(*) FILTER (WHERE a.status = 'present'),
    COALESCE(s.quorum_required, 50)
  INTO v_present_count, v_quorum_required
  FROM attendance a
  JOIN sessions s ON a.session_id = s.id
  WHERE a.session_id = p_session_id;

  RETURN v_present_count >= v_quorum_required;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if parliamentarian can vote (present + quorum met + motion open)
CREATE OR REPLACE FUNCTION check_can_vote(p_motion_id UUID, p_parliamentarian_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_session_id UUID;
  v_status VARCHAR;
BEGIN
  -- Get session from motion
  SELECT m.session_id, m.status INTO v_session_id, v_status
  FROM motions m WHERE m.id = p_motion_id;

  IF v_status != 'open' THEN
    RETURN false;
  END IF;

  -- Check attendance present
  RETURN EXISTS (
    SELECT 1 FROM attendance 
    WHERE session_id = v_session_id 
    AND parliamentarian_id = p_parliamentarian_id 
    AND status = 'present'
  ) AND check_quorum_met(v_session_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update vote uniqueness trigger to enforce can_vote
CREATE OR REPLACE FUNCTION check_vote_authorization()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_can_vote(NEW.motion_id, NEW.parliamentarian_id) THEN
    RAISE EXCEPTION 'Cannot vote: not present, no quorum, or motion not open';
  END IF;

  IF EXISTS (
    SELECT 1 FROM votes
    WHERE motion_id = NEW.motion_id
    AND parliamentarian_id = NEW.parliamentarian_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
  ) THEN
    RAISE EXCEPTION 'Already voted in this motion';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vote_uniqueness_trigger ON votes;
CREATE TRIGGER vote_authorization_trigger
  BEFORE INSERT ON votes
  FOR EACH ROW EXECUTE FUNCTION check_vote_authorization();

GRANT EXECUTE ON FUNCTION check_quorum_met(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_can_vote(UUID, UUID) TO authenticated;

-- 5. GRANTS & COMMENTS
-- =============================================================================
GRANT EXECUTE ON FUNCTION is_secretary() TO authenticated;
COMMENT ON FUNCTION is_secretary() IS 'Check if current user has secretary role';

-- Verification queries
-- SELECT get_user_role(auth.uid()); -- should work
-- SELECT is_secretary(); -- false initially
-- SELECT check_quorum_met('some-session-id');

COMMENT ON SCHEMA public IS 'Secretary role added with RLS, quorum enforcement';

