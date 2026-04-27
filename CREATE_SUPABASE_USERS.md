# Crear Usuarios Demo en Supabase

Debido a que Supabase Auth tiene restricciones de seguridad, necesitas crear los usuarios manualmente o usar la API de Admin de Supabase.

## Opción 1: Crear Usuarios Vía Supabase Dashboard (Recomendado para pruebas)

### Pasos:

1. **Abre tu proyecto Supabase**
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Ve a Authentication > Users**
   - Click en el botón "Add user"
   - Completa con:
     - Email: `admin@diputados.bo`
     - Password: `Admin123!@#`
     - Auto confirm user: ✓ (marca esta opción)
   - Click "Save"

3. **Repite para los otros usuarios:**

   **Usuario 2:**
   - Email: `parlamentario1@diputados.bo`
   - Password: `Parl123!@#`

   **Usuario 3:**
   - Email: `parlamentario2@diputados.bo`
   - Password: `Parl123!@#`

   **Usuario 4:**
   - Email: `observador@diputados.bo`
   - Password: `Obs123!@#`

## Opción 2: Crear Usuarios Vía SQL (Para producción)

1. **En Supabase, ve a SQL Editor**

2. **Ejecuta este comando para crear un usuario con Supabase Auth:**

```sql
-- Este es un ejemplo - Supabase no permite crear usuarios directamente vía SQL
-- Necesitas usar la API de Admin

-- Primero, inserta en user_profiles (después de crear el usuario en Auth)
INSERT INTO user_profiles (id, email, full_name, role, is_active)
VALUES (
  'uuid-del-usuario-creado-en-auth',
  'admin@diputados.bo',
  'Administrador Sistema',
  'admin',
  true
);
```

## Opción 3: Script de Node.js (Automatizado)

Ejecuta en tu terminal después de tener Supabase configurado:

```bash
pnpm db:demo-users
```

Este script crea automáticamente los usuarios usando la API de Admin de Supabase.

## Verificar que se Crearon

Después de crear los usuarios:

1. **Ve a Supabase Dashboard > Authentication > Users**
   - Deberías ver los 4 usuarios listados

2. **Ejecuta en SQL Editor para verificar user_profiles:**

```sql
SELECT email, role, is_active FROM user_profiles;
```

Deberías ver:
```
admin@diputados.bo          | admin          | true
parlamentario1@diputados.bo | parliamentarian | true
parlamentario2@diputados.bo | parliamentarian | true
observador@diputados.bo     | observer       | true
```

## Ahora Prueba el Login

1. Abre http://localhost:3000/auth/login
2. Ingresa email y contraseña
3. Deberías entrar al dashboard según tu rol

## Problemas Comunes

### "Invalid login credentials"
- Verifica que el usuario esté marcado como "confirmed" en Supabase Auth
- Revisa que escribiste el email y contraseña correcta

### No aparece en user_profiles
- Necesitas ejecutar también el script SQL `03_create_demo_users.sql` en Supabase SQL Editor
- O ejecutar `pnpm db:demo-users` para que lo haga automáticamente

### No se redirige al dashboard correcto
- Verifica que el rol en user_profiles es correcto: `admin`, `parliamentarian`, `observer`
- Revisa los logs en la consola del navegador (F12 > Console)
