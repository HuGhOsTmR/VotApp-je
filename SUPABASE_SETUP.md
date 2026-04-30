# Configuración de Supabase - Proyecto Nuevo

## Proyecto Creado ✓

Tu nuevo proyecto Supabase ha sido creado exitosamente:

**Proyecto**: VotApp Cochabamba  
**ID**: owiclogtneltzgarrffl  
**Región**: sa-east-1 (São Paulo, Brasil)  
**URL**: https://owiclogtneltzgarrffl.supabase.co  
**Estado**: ACTIVO

## Paso 1: Obtener Service Role Key

1. Abre: https://app.supabase.com/project/owiclogtneltzgarrffl/settings/api
2. Busca la sección "Project API keys"
3. Copia el valor de **"service_role key"** (es un token largo)
4. Pégalo en el campo que aparece en la pantalla

## Variables de Entorno ya Configuradas

Dos variables ya están configuradas en tu proyecto:

- **NEXT_PUBLIC_SUPABASE_URL**: https://owiclogtneltzgarrffl.supabase.co
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: sb_publishable_mwgWPbPnIXgYVD9ey2b8Og_LIwFC4ny

Solo necesitas agregar:
- **SUPABASE_SERVICE_ROLE_KEY**: [Pega aquí la service_role key]

## Paso 2: Crear Estructura de Base de Datos

Una vez que tengas todas las variables configuradas:

```bash
# Crear tablas y esquema
pnpm db:migrate

# Insertar datos iniciales (parlamentarios de ejemplo)
pnpm db:setup
```

## Paso 3: Crear Usuarios de Demostración

```bash
pnpm db:demo-users
```

## Paso 4: Iniciar Servidor

```bash
pnpm dev
```

Abre: http://localhost:3000/auth/login

## Credenciales para Probar

Después de ejecutar `pnpm db:demo-users`, usa:

| Email | Password | Rol |
|-------|----------|-----|
| admin@diputados.bo | Admin123!@# | Admin |
| parlamentario1@diputados.bo | Parl123!@# | Parlamentario |
| parlamentario2@diputados.bo | Parl123!@# | Parlamentario |
| observador@diputados.bo | Obs123!@# | Observador |

## Verificación

Después de los pasos anteriores:

- ✓ Tablas creadas
- ✓ Usuarios de demostración creados
- ✓ Puedes iniciar sesión
- ✓ Cada rol accede a su dashboard correspondiente

## Problemas?

Si tienes problemas:

1. Verifica que la service_role key se haya configurado correctamente
2. Ejecuta `pnpm build` para verificar que no hay errores
3. Revisa los logs en Supabase Dashboard > Logs

## Dashboard Supabase

Para administrar tu BD:
https://app.supabase.com/project/owiclogtneltzgarrffl

