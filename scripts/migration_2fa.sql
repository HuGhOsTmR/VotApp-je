-- Migración: Agregar campos de 2FA a user_profiles
-- Fecha: 2026-04-30

-- Agregar columnas para autenticación de dos factores
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

-- Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_user_profiles_two_factor_enabled
ON user_profiles(two_factor_enabled);

-- Actualizar registros existentes para que tengan two_factor_enabled = false
UPDATE user_profiles
SET two_factor_enabled = false
WHERE two_factor_enabled IS NULL;

-- Agregar comentario a las columnas
COMMENT ON COLUMN user_profiles.two_factor_enabled IS 'Indica si el usuario tiene activada la autenticación de dos factores';
COMMENT ON COLUMN user_profiles.two_factor_secret IS 'Secreto TOTP para generar códigos 2FA (solo presente durante configuración)';