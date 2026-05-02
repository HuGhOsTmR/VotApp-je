-- Script de Seed: Datos de Instituciones
-- Sistema Parlamentario de Votación - Multi-Institution Platform

-- ============================================================================
-- SECTION 1: CREATE DEFAULT INSTITUTION (if not exists)
-- ============================================================================

-- Insert default institution (Brigada Parlamentaria de Cochabamba)
INSERT INTO institutions (
  name,
  slug,
  logo_url,
  favicon_url,
  configuration,
  primary_color,
  secondary_color,
  public_title,
  public_description,
  is_active,
  is_platform,
  created_at,
  updated_at
)
SELECT 
  'Brigada Parlamentaria de Cochabamba',
  'cochabamba',
  'https://example.com/cochabamba-logo.png',
  'https://example.com/favicon.ico',
  '{}'::jsonb,
  '#1e40af', -- blue-900
  '#64748b', -- slate-500
  'Sistema Parlamentario de Cochabamba',
  'Sistema de votación en tiempo real para la Brigada Parlamentaria de Cochabamba',
  true,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM institutions WHERE slug = 'cochabamba');

-- ============================================================================
-- SECTION 2: EXAMPLE TENANT INSTITUTIONS (for multi-tenant demo)
-- ============================================================================

-- Insert example institutions for demonstration
INSERT INTO institutions (
  name,
  slug,
  logo_url,
  configuration,
  primary_color,
  secondary_color,
  public_title,
  public_description,
  is_active,
  is_platform,
  created_at,
  updated_at
)
SELECT 
  'Senado Nacional',
  'senado',
  'https://example.com/senado-logo.png',
  '{}'::jsonb,
  '#059669', -- emerald-600
  '#475569', -- slate-600
  'Cámara de Senadores',
  'Sistema de votación para la Cámara de Senadores',
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM institutions WHERE slug = 'senado');

INSERT INTO institutions (
  name,
  slug,
  logo_url,
  configuration,
  primary_color,
  secondary_color,
  public_title,
  public_description,
  is_active,
  is_platform,
  created_at,
  updated_at
)
SELECT 
  'Asamblea Legislative Plurinacional',
  'asamblea',
  'https://example.com/asamblea-logo.png',
  '{}'::jsonb',
  '#7c3aed', -- violet-600
  '#4b5563', -- gray-600
  'Asamblea Legislative',
  'Sistema de votación para la Asamblea Legislative Plurinacional',
  true,
  false,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM institutions WHERE slug = 'asamblea');

-- ============================================================================
-- SECTION 3: UPDATE EXISTING PROFILES WITH INSTITUTION_ID
-- ============================================================================

-- Link existing user profiles to the cochabamba institution
UPDATE user_profiles
SET institution_id = (
  SELECT id FROM institutions WHERE slug = 'cochabamba' LIMIT 1
)
WHERE institution_id IS NULL;

-- Link existing parliamentarians to the cochabamba institution
UPDATE parliamentarians
SET institution_id = (
  SELECT id FROM institutions WHERE slug = 'cochabamba' LIMIT 1
)
WHERE institution_id IS NULL;

-- ============================================================================
-- SECTION 4: EXAMPLE TENANT ADMIN CREATION
-- ============================================================================

-- Note: This section requires existing users in auth.users
-- Uncomment and modify for creating institution admins:

-- Create a platform admin (for the cochabamba institution)
-- UPDATE user_profiles 
-- SET role = 'platform_admin', institution_id = '<institution-id>'
-- WHERE email = 'admin@example.com';

-- Create tenant admins for other institutions:
-- UPDATE user_profiles 
-- SET role = 'tenant_admin', institution_id = '<senado-institution-id>'
-- WHERE email = 'senado-admin@example.com';

-- ============================================================================
-- SECTION 5: QUERY EXAMPLES
-- ============================================================================

-- Get all institutions:
-- SELECT * FROM institutions WHERE is_active = true;

-- Get institution by slug:
-- SELECT * FROM institutions WHERE slug = 'cochabamba';

-- Get users by institution:
-- SELECT up.* FROM user_profiles up 
-- JOIN institutions i ON up.institution_id = i.id 
-- WHERE i.slug = 'cochabamba';

-- ============================================================================
-- END OF SEED SCRIPT
-- ============================================================================
