# Guía Rápida de Inicio

## Paso 1: Preparar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ve a **Settings > API** y copia:
   - `URL` (NEXT_PUBLIC_SUPABASE_URL)
   - `anon public key` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - `service_role key` (SUPABASE_SERVICE_ROLE_KEY)

## Paso 2: Configurar Variables de Entorno

1. Copia `.env.example` a `.env.local`
2. Pega las 3 claves de Supabase que copiaste en el paso anterior

```bash
cp .env.example .env.local
# Abre .env.local y pega tus claves de Supabase
```

## Paso 3: Crear Base de Datos

### Opción A: SQL Manual (Recomendado)

1. Ve a tu proyecto Supabase > **SQL Editor**
2. Copia todo el contenido de `scripts/01_schema.sql`
3. Pégalo en el SQL Editor y ejecútalo
4. Copia el contenido de `scripts/02_seed.sql` y ejecútalo

### Opción B: Script Automático (si está disponible)

```bash
npm run setup-db
# o
pnpm setup-db
```

## Paso 4: Instalar y Ejecutar

```bash
# Instalar dependencias
pnpm install

# Ejecutar en desarrollo
pnpm dev

# Acceder a http://localhost:3000
```

## Usuarios de Prueba

Después de ejecutar el seed data, tienes estos parlamentarios disponibles (20 total):

| Nombre | Partido | Circunscripción |
|--------|---------|-----------------|
| Javier Fernández López | MAS | Cochabamba Central |
| María González Rodríguez | UN | Cochabamba Rural |
| Carlos Montes Quispe | MAS | Cochabamba Central |
| Patricia Flores Mamani | CC | Cochabamba Rural |
| ... y 16 más | | |

## Crear Usuarios de Prueba

En Supabase, ve a **Authentication > Users** y crea:

1. **Admin**
   - Email: `admin@test.bo`
   - Password: (cualquiera)

2. **Parlamentario**
   - Email: `parlamentario@test.bo`
   - Password: (cualquiera)

3. **Observador**
   - Email: `observador@test.bo`
   - Password: (cualquiera)

Luego, en la tabla `user_profiles` de Supabase, asigna los roles:

```sql
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@test.bo';
UPDATE user_profiles SET role = 'parliamentarian' WHERE email = 'parlamentario@test.bo';
UPDATE user_profiles SET role = 'observer' WHERE email = 'observador@test.bo';
```

## URLs de la Aplicación

- **Admin Dashboard**: http://localhost:3000/admin
- **Parliamentarian Dashboard**: http://localhost:3000/parliamentarian
- **Public Results**: http://localhost:3000/public
- **Login**: http://localhost:3000/auth/login

## Crear una Sesión y Moción de Prueba

1. **Login como Admin**
2. Ve a `/admin/sessions`
3. Haz click en "Crear Sesión"
4. Completa el formulario y guarda
5. Ve a `/admin/motions`
6. Crea una nueva moción
7. Abre la moción para votación desde `/admin/motions`

## Votar como Parlamentario

1. **Logout** del admin
2. **Login como parlamentario**
3. Ve a `/parliamentarian/voting`
4. Selecciona una moción abierta
5. Haz click en tu voto (Favor, Contra, Abstención, Ausente)
6. Confirma tu voto

## Ver Resultados en Vivo

1. Ve a `/public` (sin necesidad de login)
2. Los resultados se actualizan cada 5 segundos
3. Verás:
   - Gráficos de distribución
   - Conteo por tipo de voto
   - Listado nominal de votantes

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Verifica que `.env.local` tenga las 3 variables correctas
- Recarga el servidor dev (`Ctrl+C` y `pnpm dev`)

### Error: "Connection refused"
- Verifica tu NEXT_PUBLIC_SUPABASE_URL es correcto
- Asegúrate que tu proyecto Supabase está activo

### Error: "User not authenticated"
- Verifica que la tabla `user_profiles` tiene el usuario
- Comprueba que has asignado correctamente el rol

### Las mociones no cargan
- Verifica que ejecutaste los scripts SQL correctamente
- Comprueba en Supabase que la tabla `motions` tiene datos

## Próximos Pasos

1. Personaliza los estilos (colores, logos) en `components/shared/navbar.tsx`
2. Añade tu logo en `public/images/`
3. Modifica textos y mensajes en `lib/constants.ts`
4. Implementa WebSockets para actualizaciones en tiempo real
5. Genera reportes en PDF/CSV

## Documentación

- [README.md](./README.md) - Documentación completa
- [/v0_plans/visionary-draft.md](/v0_plans/visionary-draft.md) - Plan arquitectónico
- [Supabase Docs](https://supabase.com/docs) - Documentación Supabase
- [Next.js Docs](https://nextjs.org/docs) - Documentación Next.js

---

¿Preguntas? Revisa la documentación o contacta al equipo de desarrollo.
