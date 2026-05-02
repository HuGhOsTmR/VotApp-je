-- Script de Seed: Datos Iniciales
-- Datos de ejemplo para la Brigada Parlamentaria de Cochabamba, Bolivia

-- Insertar parlamentarios de ejemplo
INSERT INTO parliamentarians (full_name, political_party, circumscription, email, phone_number)
VALUES
  ('Javier Fernández López', 'MAS', 'Cochabamba Central', 'javier.fernandez@diputados.bo', '+591-72345678'),
  ('María González Rodríguez', 'UN', 'Cochabamba Rural', 'maria.gonzalez@diputados.bo', '+591-72345679'),
  ('Carlos Montes Quispe', 'MAS', 'Cochabamba Central', 'carlos.montes@diputados.bo', '+591-72345680'),
  ('Patricia Flores Mamani', 'CC', 'Cochabamba Rural', 'patricia.flores@diputados.bo', '+591-72345681'),
  ('Roberto Valdez Gutiérrez', 'MAS', 'Cochabamba Central', 'roberto.valdez@diputados.bo', '+591-72345682'),
  ('Susana Ribera Pérez', 'UN', 'Cochabamba Rural', 'susana.ribera@diputados.bo', '+591-72345683'),
  ('Miguel Suárez Araya', 'MAS', 'Cochabamba Rural', 'miguel.suarez@diputados.bo', '+591-72345684'),
  ('Claudia Herrera López', 'CC', 'Cochabamba Central', 'claudia.herrera@diputados.bo', '+591-72345685'),
  ('Fernando Gómez Quintanilla', 'MAS', 'Cochabamba Central', 'fernando.gomez@diputados.bo', '+591-72345686'),
  ('Daniela Castillo Morales', 'UN', 'Cochabamba Central', 'daniela.castillo@diputados.bo', '+591-72345687'),
  ('Andrés Ramírez Soto', 'MAS', 'Cochabamba Rural', 'andres.ramirez@diputados.bo', '+591-72345688'),
  ('Sandra Córdoba Mendoza', 'CC', 'Cochabamba Rural', 'sandra.cordoba@diputados.bo', '+591-72345689'),
  ('Eduardo Carvajal Vera', 'MAS', 'Cochabamba Central', 'eduardo.carvajal@diputados.bo', '+591-72345690'),
  ('Verónica Salinas Colque', 'UN', 'Cochabamba Central', 'veronica.salinas@diputados.bo', '+591-72345691'),
  ('Gustavo Morales Murillo', 'MAS', 'Cochabamba Rural', 'gustavo.morales@diputados.bo', '+591-72345692'),
  ('Laura Miranda Espinoza', 'CC', 'Cochabamba Central', 'laura.miranda@diputados.bo', '+591-72345693'),
  ('Sergio Pérez Sandoval', 'MAS', 'Cochabamba Rural', 'sergio.perez@diputados.bo', '+591-72345694'),
  ('Ana María Fuentes Rivas', 'UN', 'Cochabamba Central', 'ana.fuentes@diputados.bo', '+591-72345695'),
  ('Diego López Zamora', 'MAS', 'Cochabamba Central', 'diego.lopez@diputados.bo', '+591-72345696'),
  ('Beatriz Aguilar Ponce', 'CC', 'Cochabamba Rural', 'beatriz.aguilar@diputados.bo', '+591-72345697');

-- Insertar una sesión parlamentaria
INSERT INTO sessions (legislature_number, session_date, start_time, status, title, description, quorum_required)
VALUES
  (7, CURRENT_DATE, '09:00:00', 'active', 'Sesión Ordinaria N° 1', 'Primera sesión parlamentaria de la legislatura', 50),
  (7, CURRENT_DATE + INTERVAL '1 day', '14:00:00', 'scheduled', 'Sesión Ordinaria N° 2', 'Segunda sesión parlamentaria de la legislatura', 50);

-- Insertar mociones de ejemplo (obtener IDs de parlamentarios)
WITH para_insertarase AS (
  SELECT id FROM parliamentarians LIMIT 1
)
INSERT INTO motions (session_id, title, description, proposer_id, motion_type, status)
SELECT
  s.id,
  'Resolución para mejora de infraestructura en zonas rurales',
  'Propuesta de asignación de recursos para mejorar la infraestructura en las zonas rurales de Cochabamba',
  p.id,
  'resolution',
  'open'
FROM sessions s, (SELECT id FROM parliamentarians LIMIT 1) p
WHERE s.session_date = CURRENT_DATE
LIMIT 1;

-- Más mociones
INSERT INTO motions (session_id, title, description, proposer_id, motion_type, status)
SELECT
  s.id,
  'Moción para aumento de presupuesto en educación',
  'Propuesta de incremento presupuestario para el sector educativo',
  (SELECT id FROM parliamentarians ORDER BY RANDOM() LIMIT 1),
  'amendment',
  'pending'
FROM sessions s
WHERE s.session_date = CURRENT_DATE
LIMIT 1;

INSERT INTO motions (session_id, title, description, proposer_id, motion_type, status)
SELECT
  s.id,
  'Pregunta al ejecutivo sobre situación de salud',
  'Interpelación sobre las acciones tomadas en materia de salud pública',
  (SELECT id FROM parliamentarians ORDER BY RANDOM() LIMIT 1),
  'question',
  'closed'
FROM sessions s
WHERE s.session_date = CURRENT_DATE
LIMIT 1;

-- Insertar algunos votos de ejemplo para la primera moción
INSERT INTO votes (motion_id, parliamentarian_id, vote_type)
SELECT
  m.id,
  p.id,
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) <= 12 THEN 'favor'
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) <= 18 THEN 'against'
    WHEN ROW_NUMBER() OVER (ORDER BY RANDOM()) <= 19 THEN 'abstention'
    ELSE 'absent'
  END
FROM motions m
CROSS JOIN parliamentarians p
WHERE m.status = 'open'
AND m.motion_type = 'resolution'
LIMIT 20;

-- Vincular el primer parlamentario con un usuario ficticio para pruebas
-- NOTA: En producción, esto debería hacerse a través de la aplicación
-- UPDATE parliamentarians SET user_id = 'user-id-aqui' WHERE id = (SELECT id FROM parliamentarians LIMIT 1);
