-- Ecosystem & Public API Infrastructure
-- Sistema Parlamentario de Votación - Public API, Webhooks, Rate Limiting

-- ============================================================================
-- SECTION 1: INSTITUTION PUBLIC SETTINGS
-- ============================================================================

-- Add public visibility settings to institutions
ALTER TABLE institutions 
ADD COLUMN IF NOT EXISTS public_visibility BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_description TEXT,
ADD COLUMN IF NOT EXISTS public_contact_email TEXT,
ADD COLUMN IF NOT EXISTS public_api_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT false;

-- Update comments
COMMENT ON COLUMN institutions.public_visibility IS 'Whether institution data is visible to public';
COMMENT ON COLUMN institutions.public_api_enabled IS 'Whether public API is enabled for this institution';
COMMENT ON COLUMN institutions.webhook_enabled IS 'Whether webhooks are enabled for this institution';

-- Enable public data for default institution
UPDATE institutions SET public_visibility = true, public_api_enabled = true WHERE slug = 'cochabamba';

-- ============================================================================
-- SECTION 2: API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for identification
  rate_limit_per_minute INTEGER DEFAULT 60,
  rate_limit_per_day INTEGER DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE api_keys IS 'API keys for external integrations';
COMMENT ON COLUMN api_keys.key_hash IS 'Hashed API key (never stored in plaintext)';
COMMENT ON COLUMN api_keys.key_prefix IS 'First 8 chars for identifying key in logs';

-- RLS for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Only platform admins can view all API keys
CREATE POLICY "Platform admins can view api_keys" ON api_keys
  FOR SELECT USING (is_platform_admin());

-- Only tenant admins can manage API keys for their institution
CREATE POLICY "Tenant admins can manage api_keys" ON api_keys
  FOR ALL USING (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- Indices
CREATE INDEX IF NOT EXISTS idx_api_keys_institution ON api_keys(institution_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);

-- ============================================================================
-- SECTION 3: WEBHOOKS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  events VARCHAR(100)[] NOT NULL, -- Array of events to trigger on
  secret VARCHAR(255), -- Secret for signing payloads
  is_active BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  last_status_code INTEGER,
  last_error TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE webhooks IS 'Webhook configurations for event notifications';
COMMENT ON COLUMN webhooks.events IS 'Events: motion_opened, vote_cast, motion_closed, session_finalized';

-- RLS for webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Only tenant admins can manage webhooks
CREATE POLICY "Tenant admins can manage webhooks" ON webhooks
  FOR ALL USING (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- Indices
CREATE INDEX IF NOT EXISTS idx_webhooks_institution ON webhooks(institution_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_active ON webhooks(is_active);

-- ============================================================================
-- SECTION 4: WEBHOOK DELIVERY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  attempt_number INTEGER DEFAULT 1,
  error TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE webhook_delivery_logs IS 'Log of webhook delivery attempts';

-- RLS
ALTER TABLE webhook_delivery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant admins can view webhook logs" ON webhook_delivery_logs
  FOR SELECT USING (
    is_platform_admin() OR (
      is_tenant_admin() AND 
      institution_id = current_user_institution_id()
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_webhook ON webhook_delivery_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_delivered ON webhook_delivery_logs(delivered_at);

-- ============================================================================
-- SECTION 5: RATE LIMITING HELPER FUNCTIONS
-- ============================================================================

-- Function to check API key rate limits
CREATE OR REPLACE FUNCTION check_api_key_rate_limit(
  p_key_id UUID,
  p_per_minute_limit INTEGER,
  p_per_day_limit INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_minute_count BIGINT;
  v_day_count BIGINT;
  v_result BOOLEAN := true;
BEGIN
  -- Check per-minute limit
  SELECT COUNT(*) INTO v_minute_count
  FROM api_key_usage_logs
  WHERE api_key_id = p_key_id
    AND used_at > NOW() - INTERVAL '1 minute';

  IF v_minute_count >= p_per_minute_limit THEN
    v_result := false;
  END IF;

  -- Check per-day limit
  IF v_result THEN
    SELECT COUNT(*) INTO v_day_count
    FROM api_key_usage_logs
    WHERE api_key_id = p_key_id
      AND used_at > NOW() - INTERVAL '24 hours';

    IF v_day_count >= p_per_day_limit THEN
      v_result := false;
    END IF;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record API key usage
CREATE OR REPLACE FUNCTION record_api_key_usage(
  p_api_key_id UUID,
  p_endpoint VARCHAR(255),
  p_status_code INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Create usage log table if it doesn't exist
  CREATE TABLE IF NOT EXISTS api_key_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    status_code INTEGER,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Insert usage record
  INSERT INTO api_key_usage_logs (api_key_id, endpoint, status_code)
  VALUES (p_api_key_id, p_endpoint, p_status_code);

  -- Update last_used_at
  UPDATE api_keys SET last_used_at = NOW() WHERE id = p_api_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 6: PUBLIC DATA HELPERS
-- ============================================================================

-- Function to get public-safe institution data
CREATE OR REPLACE FUNCTION get_public_institution(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  logo_url TEXT,
  primary_color VARCHAR,
  public_title VARCHAR,
  public_description TEXT,
  public_visibility BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id, i.name, i.slug, i.logo_url, 
    i.primary_color, i.public_title, i.public_description, i.public_visibility
  FROM institutions i
  WHERE i.slug = p_slug 
    AND i.is_active = true
    AND i.public_visibility = true;
END;
$$ LANGUAGE plpgsql;

-- Function to check if public API is allowed for institution
CREATE OR REPLACE FUNCTION can_access_public_api(p_institution_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM institutions
    WHERE id = p_institution_id
      AND is_active = true
      AND public_visibility = true
      AND public_api_enabled = true
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 7: DATA EXPORT HELPERS
-- ============================================================================

-- Function to export motions to JSON
CREATE OR REPLACE FUNCTION export_motions_json(
  p_institution_id UUID,
  p_status_filter VARCHAR(50) DEFAULT NULL,
  p_from_date TIMESTAMP DEFAULT NULL,
  p_to_date TIMESTAMP DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', m.id,
      'title', m.title,
      'description', m.description,
      'motion_type', m.motion_type,
      'status', m.status,
      'voting_start_time', m.voting_start_time,
      'voting_end_time', m.voting_end_time,
      'created_at', m.created_at,
      'proposer', jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'political_party', p.political_party
      )
    )
  )::text INTO v_result
  FROM motions m
  LEFT JOIN parliamentarians p ON m.proposer_id = p.id
  WHERE m.institution_id = p_institution_id
    AND (p_status_filter IS NULL OR m.status = p_status_filter)
    AND (p_from_date IS NULL OR m.created_at >= p_from_date)
    AND (p_to_date IS NULL OR m.created_at <= p_to_date);

  RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;

-- Function to export votes to JSON
CREATE OR REPLACE FUNCTION export_votes_json(
  p_motion_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_result TEXT;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'motion_id', v.motion_id,
      'vote_type', v.vote_type,
      'timestamp', v.timestamp,
      'parliamentarian', jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'political_party', p.political_party
      )
    )
  )::text INTO v_result
  FROM votes v
  JOIN parliamentarians p ON v.parliamentarian_id = p.id
  WHERE v.motion_id = p_motion_id;

  RETURN COALESCE(v_result, '[]');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 8: GRANTS
-- ============================================================================

-- Grant access to anon/authenticated roles
GRANT SELECT ON api_keys TO authenticated, anon;
GRANT SELECT ON webhooks TO authenticated, anon;
GRANT SELECT ON webhook_delivery_logs TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION get_public_institution TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_access_public_api TO authenticated, anon;
GRANT EXECUTE ON FUNCTION export_motions_json TO authenticated, anon;
GRANT EXECUTE ON FUNCTION export_votes_json TO authenticated, anon;

-- ============================================================================
-- SECTION 9: INITIAL DATA
-- ============================================================================

-- Create a sample API key for cochabamba (for development testing)
-- Note: In production, generate proper keys using: gen_random_uuid() or external tool
DO $$
DECLARE
  v_institution_id UUID;
  v_key_id UUID;
  v_key_value TEXT;
  v_key_hash TEXT;
  v_key_prefix TEXT;
BEGIN
  -- Get cochabamba institution
  SELECT id INTO v_institution_id FROM institutions WHERE slug = 'cochabamba' LIMIT 1;
  
  IF v_institution_id IS NOT NULL THEN
    -- Generate a sample key (in real use, this would be done via admin UI)
    v_key_value := 'pk_' || encode(gen_random_bytes(16), 'hex');
    v_key_hash := encode(gen_random_bytes(32), 'hex');
    v_key_prefix := SUBSTRING(v_key_value, 1, 12);
    
    -- Insert the key hash (not the actual key value)
    INSERT INTO api_keys (institution_id, name, key_hash, key_prefix, rate_limit_per_minute, rate_limit_per_day)
    VALUES (v_institution_id, 'Desarrollo/Testing', v_key_hash, v_key_prefix, 100, 10000)
    RETURNING id INTO v_key_id;
    
    RAISE NOTICE 'Sample API key created. Key ID: %, Prefix: %', v_key_id, v_key_prefix;
    RAISE NOTICE 'Sample key value (save this!): %', v_key_value;
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
