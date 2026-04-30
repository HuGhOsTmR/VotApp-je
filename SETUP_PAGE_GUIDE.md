# Guía de la Página de Setup en v0

## Acceso a la Página de Setup

Una vez que tengas:
1. ✓ Las 3 variables de entorno configuradas en v0
2. ✓ El servidor ejecutándose con `pnpm dev`

Abre en tu navegador:
```
http://localhost:3000/admin/setup
```

**Nota**: Esta página solo es accesible después de hacer login como admin. 
Si no has creado el usuario admin aún, necesitas hacerlo manualmente en Supabase primero.

## Los Tres Pasos

### Paso 1: Crear Base de Datos
**Botón**: "Ejecutar"

Esto crea todas las tablas necesarias:
- user_profiles (perfiles de usuarios)
- parliamentarians (diputados)
- sessions (sesiones parlamentarias)
- motions (mociones/proyectos)
- votes (registro de votos)
- audit_logs (auditoría)
- attendance (asistencia)

**Estado**: 
- Gris (○) = No ejecutado
- Azul (⋯) = Ejecutando...
- Verde (✓) = Exitoso
- Rojo (✗) = Error

### Paso 2: Cargar Datos Iniciales
**Botón**: "Ejecutar" (disponible después de completar Paso 1)

Esto inserta:
- 20 parlamentarios de ejemplo (nombres ficticios de Cochabamba)
- 3 partidos políticos (MAS, UN, CC)
- 1 sesión de prueba

### Paso 3: Crear Usuarios Demo
**Botón**: "Ejecutar" (disponible después de completar Paso 2)

Crea 4 usuarios para probar:

```
Email: admin@diputados.bo
Contraseña: Admin123!@#
Rol: Admin

Email: parlamentario1@diputados.bo
Contraseña: Parl123!@#
Rol: Parlamentario

Email: parlamentario2@diputados.bo
Contraseña: Parl123!@#
Rol: Parlamentario

Email: observador@diputados.bo
Contraseña: Obs123!@#
Rol: Observador
```

## Después de Completar los 3 Pasos

1. Verás un mensaje verde: "✓ Configuración Completada"
2. Puedes ir a: http://localhost:3000/auth/login
3. Ingresa con cualquiera de los 4 usuarios arriba
4. Cada rol accede a su dashboard correspondiente:
   - Admin → /admin
   - Parlamentario → /parliamentarian
   - Observador → /public

## Si Algo Falla

### Error en Paso 1 (Migración)
**Causa Común**: Variables de Supabase no configuradas correctamente
- Verifica que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén en v0 Settings > Vars
- Recarga la página (F5) e intenta de nuevo

### Error en Paso 2 (Seed)
**Causa Común**: Tablas no se crearon en Paso 1
- Verifica que Paso 1 esté en verde (✓)
- Si no, repite Paso 1

### Error en Paso 3 (Demo Users)
**Causa Común**: Problemas con service_role_key
- Verifica que SUPABASE_SERVICE_ROLE_KEY esté configurado
- La clave debe ser un token largo que empieza con `eyJ`

## Solución Nuclear

Si todo falla:
1. Ve a https://supabase.com/dashboard
2. Ve a tu proyecto
3. Settings > Data
4. "Reset Database" - esto borra todo y empieza limpio
5. Vuelve a ejecutar los 3 pasos

## Alternativa: Sin v0

Si prefieres usar la terminal:
```bash
pnpm db:migrate      # Paso 1
pnpm db:setup        # Paso 2
pnpm db:demo-users   # Paso 3
```

Pero con la página de Setup en v0 es más fácil y visual.

