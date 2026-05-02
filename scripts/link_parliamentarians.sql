-- Script para vincular usuarios parlamentarios existentes con parlamentarios
-- Ejecutar después de crear usuarios con rol 'parliamentarian'

-- Vincular usuarios parlamentarios sin parlamentario asignado
UPDATE parliamentarians
SET user_id = (
  SELECT up.id
  FROM user_profiles up
  WHERE up.role = 'parliamentarian'
  AND up.id NOT IN (
    SELECT COALESCE(p.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
    FROM parliamentarians p
    WHERE p.user_id IS NOT NULL
  )
  LIMIT 1
)
WHERE user_id IS NULL
AND id IN (
  SELECT id FROM parliamentarians
  WHERE user_id IS NULL
  ORDER BY created_at
  LIMIT (
    SELECT COUNT(*)
    FROM user_profiles
    WHERE role = 'parliamentarian'
    AND id NOT IN (
      SELECT COALESCE(p.user_id, '00000000-0000-0000-0000-000000000000'::uuid)
      FROM parliamentarians p
      WHERE p.user_id IS NOT NULL
    )
  )
);