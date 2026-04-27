# Guía de Setup - Sistema Parlamentario de Votación

## Estado Actual

✅ **Completado:**
- Código fuente compilado
- Dependencias instaladas
- Base de datos schema listos
- Componentes UI listos
- API routes listos

⏳ **Pendiente:**
- Configuración de variables de entorno Supabase
- Ejecución de scripts SQL de schema
- Inserción de datos de ejemplo

## Paso 1: Obtener Credenciales de Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. En el menú lateral, haz clic en **Settings**
3. Selecciona la pestaña **API**
4. Copia los siguientes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service role key** → `SUPABASE_SERVICE_ROLE_KEY`

## Paso 2: Configurar en v0

1. Haz clic en el botón **Settings** (⚙️) en la esquina superior derecha
2. Ve a la sección **Vars**
3. Añade las 3 variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Tu Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Tu anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Tu service role key

4. Haz clic en **Save**

## Paso 3: Crear Base de Datos

Una vez que las variables estén configuradas:

```bash
# Opción A: Ejecución automática (recomendado)
pnpm db:setup

# Opción B: Ejecución manual desde Supabase
# 1. Ve a tu proyecto Supabase
# 2. Abre SQL Editor
# 3. Copia y pega el contenido de scripts/01_schema.sql
# 4. Ejecuta
# 5. Copia y pega el contenido de scripts/02_seed.sql
# 6. Ejecuta
```

## Paso 4: Correr en Desarrollo

```bash
pnpm dev
```

Abre http://localhost:3000 en tu navegador.

## Paso 5: Acceder al Sistema

### Usuarios de Prueba

Después de ejecutar el seed, tendrás acceso a:

**Admin (Para crear tu cuenta):**
- Ve a /auth/login
- Haz clic en "¿No tienes cuenta? Regístrate"
- Crea una cuenta con email y contraseña
- Se creará automáticamente con rol de admin (primera cuenta)

**Parlamentarios de Ejemplo:**
- Email: `parlamentario1@cochabamba.bo` (contraseña: password123)
- Email: `parlamentario2@cochabamba.bo` (contraseña: password123)
- ... (20 parlamentarios en total)

**Observador Público:**
- Ve a `/public` (sin login requerido)

## Dashboard Urls

- **Admin**: http://localhost:3000/admin
- **Parlamentario**: http://localhost:3000/parliamentarian
- **Público**: http://localhost:3000/public
- **Login**: http://localhost:3000/auth/login

## Troubleshooting

### Error: "Missing environment variables"

**Solución**: Verifica que en Settings > Vars tengas todas las 3 variables correctamente configuradas.

### Error: "Connection refused"

**Solución**: Asegúrate que:
1. Tu proyecto Supabase está activo
2. Las URLs de Supabase son correctas
3. Las claves no tienen espacios adicionales

### Las tablas no se crean

**Solución**: Ejecuta manualmente desde Supabase SQL Editor:
1. Copia `scripts/01_schema.sql`
2. Pégalo en el SQL Editor de Supabase
3. Ejecuta

### No veo datos de ejemplo

**Solución**: Ejecuta desde Supabase SQL Editor:
1. Copia `scripts/02_seed.sql`
2. Pégalo en el SQL Editor
3. Ejecuta

## Estructura de Carpetas

```
/app
  /admin              # Dashboard administrativo
  /parliamentarian    # Dashboard de parlamentarios
  /public             # Dashboard público (sin auth)
  /auth               # Páginas de autenticación
  /api                # API REST endpoints

/components
  /admin              # Componentes del admin
  /parliamentarian    # Componentes de parlamentarios
  /public             # Componentes públicos
  /shared             # Componentes compartidos
  /auth               # Componentes de auth

/lib
  /hooks              # React hooks personalizados
  /supabase           # Clientes de Supabase
  types.ts            # Tipos TypeScript
  constants.ts        # Constantes

/scripts
  01_schema.sql       # Schema de base de datos
  02_seed.sql         # Datos de ejemplo
  setup-db.js         # Script de setup
  diagnose.js         # Script de diagnóstico
```

## Características Principales

✨ **Sistema de Votación en Tiempo Real**
- Mociones abiertas/cerradas
- Votación nominal por parlamentario
- Prevención de votos duplicados
- Interfaz mobile-first para parlamentarios

📊 **Dashboards**
- Admin: gestión completa
- Parlamentario: interfaz de votación
- Público: resultados en vivo

📋 **Auditoría y Reportes**
- Log de todas las acciones
- Exportación a CSV/PDF
- Historial de votaciones

🔐 **Seguridad**
- Autenticación con Supabase Auth
- RBAC (3 roles)
- Row Level Security en BD
- Validaciones server-side

## Documentación Adicional

- Ver `README.md` para descripción técnica completa
- Ver `QUICKSTART.md` para guía rápida
- Ver `DEPLOYMENT.md` para deploy a Vercel

## Soporte

Si tienes problemas:

1. Revisa el archivo de diagnóstico: `node scripts/diagnose.js`
2. Verifica las variables de entorno
3. Consulta los logs del servidor (`pnpm dev`)
4. Abre un issue en GitHub (si aplica)
