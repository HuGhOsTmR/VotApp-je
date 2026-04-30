# Credenciales de Prueba

## Sobre las Credenciales

Después de ejecutar `pnpm db:demo-users`, tendrás acceso a 4 cuentas de prueba con diferentes roles:

## Cuentas Disponibles

### 1. Administrador
- **Email**: `admin@diputados.bo`
- **Contraseña**: `Admin123!@#`
- **Rol**: Administrador
- **Acceso**: Dashboard administrativo completo
- **Funciones**: Gestionar sesiones, mociones, parlamentarios, reportes, auditoría

### 2. Parlamentario 1
- **Email**: `parlamentario1@diputados.bo`
- **Contraseña**: `Parl123!@#`
- **Rol**: Parlamentario
- **Acceso**: Dashboard de votación
- **Funciones**: Votar en mociones, ver historial de votos

### 3. Parlamentario 2
- **Email**: `parlamentario2@diputados.bo`
- **Contraseña**: `Parl123!@#`
- **Rol**: Parlamentario
- **Acceso**: Dashboard de votación
- **Funciones**: Votar en mociones, ver historial de votos

### 4. Observador
- **Email**: `observador@diputados.bo`
- **Contraseña**: `Obs123!@#`
- **Rol**: Observador
- **Acceso**: Dashboard público sin autenticación
- **Funciones**: Ver resultados en vivo, listado nominal de votos

## Cómo Crear las Cuentas de Prueba

### Opción 1: Script Automático (Recomendado)

```bash
pnpm db:demo-users
```

Este script:
1. Crea usuarios en Supabase Auth
2. Crea sus perfiles en la base de datos
3. Muestra las credenciales en consola

### Opción 2: Manualmente en Supabase

1. Abre tu proyecto en Supabase
2. Ve a Authentication > Users
3. Click en "Add user"
4. Crea cada usuario con sus credenciales
5. Luego ejecuta: `pnpm db:setup`

## Login Rápido en la UI

Desde la página de login (`/auth/login`):

1. Haz click en uno de los botones de prueba:
   - "Admin" - Carga `admin@diputados.bo`
   - "Parlamentario" - Carga `parlamentario1@diputados.bo`
   - "Observador" - Carga `observador@diputados.bo`

2. Las credenciales se cargarán automáticamente
3. Solo presiona "Iniciar Sesión"

## Solución de Problemas

### "Error: Usuario no encontrado"
- Asegúrate de haber ejecutado `pnpm db:demo-users`
- Verifica que Supabase esté configurado correctamente

### "Error: Contraseña incorrecta"
- Usa exactamente las contraseñas mostradas arriba
- Son sensibles a mayúsculas/minúsculas

### "Error: Verifica que Supabase esté configurado"
- Configura las variables de entorno:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Cambiar Contraseñas

Para cambiar una contraseña:

1. En Supabase, ve a Authentication > Users
2. Busca el usuario
3. Click en el menú (...) > "Reset password"
4. O usa la opción de editar directamente

## Crear Usuarios Adicionales

Puedes crear más usuarios de prueba:

1. Opción A: Manualmente en Supabase UI
2. Opción B: Modificar `scripts/create-demo-users.js` y re-ejecutar
3. Opción C: Usar la API de Supabase directamente

## Roles y Permisos

| Rol | Puede Votar | Ver Admin | Ver Reportes | Ver Auditoría | Ver Público |
|-----|------------|-----------|--------------|---------------|-------------|
| Admin | Sí | Sí | Sí | Sí | Sí |
| Parlamentario | Sí | No | No | No | Sí |
| Observador | No | No | No | No | Sí |

## Datos de Prueba

Además de los usuarios, se cargan automáticamente:
- 20 parlamentarios de Cochabamba
- Partidos políticos: MAS, UN, CC
- Datos de ejemplo para demostraciones

## Notas de Seguridad

⚠️ **Importante**: Las credenciales de prueba **NO deben usarse en producción**.

Para producción:
1. Crea usuarios reales en Supabase
2. Cambia las contraseñas
3. Implementa autenticación segura
4. Usa HTTPS obligatoriamente
5. Configura Rate Limiting
6. Habilita 2FA si es posible
