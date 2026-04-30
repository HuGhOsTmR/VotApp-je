-- Script para crear usuarios demo en la base de datos
-- Ejecutar en Supabase SQL Editor

-- NOTA: Los UUIDs son fijos para poder referenciarlos después
-- En producción, dejar que Supabase genere los UUIDs automáticamente

-- Primero, insertar en user_profiles (sin referencia a auth.users si no existen)
-- Estos son usuarios que se crearán manualmente en Supabase Auth

INSERT INTO user_profiles (id, email, full_name, role, is_active, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@diputados.bo', 'Administrador Sistema', 'admin', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'parlamentario1@diputados.bo', 'Juan Quispe Morales', 'parliamentarian', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'parlamentario2@diputados.bo', 'María García López', 'parliamentarian', true, NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'observador@diputados.bo', 'Observador Público', 'observer', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insertar parlamentarios (para que puedan votar)
INSERT INTO parliamentarians (id, user_id, full_name, political_party, circumscription, email, is_active, created_at, updated_at)
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Juan Quispe Morales', 'MAS', 'Cochabamba', 'parlamentario1@diputados.bo', true, NOW(), NOW()),
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'María García López', 'UN', 'Cochabamba', 'parlamentario2@diputados.bo', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Crear 18 parlamentarios de prueba adicionales (para llenar la cámara)
INSERT INTO parliamentarians (id, full_name, political_party, circumscription, email, is_active, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Carlos Mendoza Flores', 'MAS', 'Cochabamba', 'carlos.mendoza@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Gabriela López Sánchez', 'UN', 'Cochabamba', 'gabriela.lopez@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Roberto Gutiérrez Rojas', 'CC', 'Cochabamba', 'roberto.gutierrez@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Verónica Torres Estrada', 'MAS', 'Cochabamba', 'veronica.torres@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Miguel Ángel Riva', 'UN', 'Cochabamba', 'miguel.riva@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Sofía Ruiz Castro', 'CC', 'Cochabamba', 'sofia.ruiz@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Fernando Delgado Campos', 'MAS', 'Cochabamba', 'fernando.delgado@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Daniela Morales Vera', 'UN', 'Cochabamba', 'daniela.morales@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Diego Reyes Pinto', 'CC', 'Cochabamba', 'diego.reyes@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Pamela Quispe Arana', 'MAS', 'Cochabamba', 'pamela.quispe@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Ricardo López Araya', 'UN', 'Cochabamba', 'ricardo.lopez@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Cristina Alvarez Romo', 'CC', 'Cochabamba', 'cristina.alvarez@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Andrés Moreno Castro', 'MAS', 'Cochabamba', 'andres.moreno@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Isabella Flores Gutierrez', 'UN', 'Cochabamba', 'isabella.flores@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Patricio Soto Miranda', 'CC', 'Cochabamba', 'patricio.soto@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Alejandra Vega Lemus', 'MAS', 'Cochabamba', 'alejandra.vega@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Héctor Campos Rodríguez', 'UN', 'Cochabamba', 'hector.campos@diputados.bo', true, NOW(), NOW()),
  (gen_random_uuid(), 'Natalia Ortiz Salazar', 'CC', 'Cochabamba', 'natalia.ortiz@diputados.bo', true, NOW(), NOW())
ON CONFLICT DO NOTHING;
