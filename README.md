# Sistema Parlamentario de Votación en Tiempo Real

Brigada Parlamentaria de Cochabamba, Bolivia

## Descripción

Sistema full-stack para votación parlamentaria en tiempo real que incluye:

- **Autenticación segura** con Supabase Auth basada en roles (Admin, Parlamentario, Observador)
- **3 Dashboards separados** optimizados para cada rol
- **Votación nominal pública** con registro inmutable de auditoría
- **Resultados en vivo** con gráficos interactivos
- **API REST** para todas las operaciones CRUD
- **Base de datos PostgreSQL** con RLS (Row Level Security)
- **Interfaz mobile-first** con accesibilidad WCAG AA

## Stack Tecnológico

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + PostgreSQL
- **Base de Datos**: Supabase PostgreSQL
- **Autenticación**: Supabase Auth
- **Visualización**: Recharts
- **Lenguaje**: Español (Bolivia)

## Estructura del Proyecto

```
├── app/
│   ├── auth/           # Autenticación
│   ├── admin/          # Dashboard Administrativo
│   ├── parliamentarian/ # Dashboard de Parlamentarios
│   ├── public/         # Dashboard Público (sin login)
│   └── api/            # Endpoints REST
├── components/
│   ├── auth/           # Componentes de autenticación
│   ├── admin/          # Componentes admin
│   ├── parliamentarian/ # Componentes parlamentario
│   ├── public/         # Componentes públicos
│   └── shared/         # Componentes compartidos
├── lib/
│   ├── supabase/       # Configuración Supabase
│   ├── hooks/          # Custom hooks
│   ├── types.ts        # Tipos TypeScript
│   └── constants.ts    # Constantes
├── scripts/            # Scripts de setup
└── middleware.ts       # Middleware de auth
```

## Instalación y Setup

### 1. Requisitos

- Node.js 18+
- pnpm (recomendado)
- Cuenta Supabase

### 2. Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Instalar Dependencias

```bash
pnpm install
```

### 4. Configurar Base de Datos

Ejecuta los scripts SQL en Supabase:

1. Ve a SQL Editor en tu proyecto Supabase
2. Copia el contenido de `scripts/01_schema.sql` y ejecútalo
3. Copia el contenido de `scripts/02_seed.sql` y ejecútalo

O usa el script TypeScript (si tienes acceso a APIs):

```bash
pnpm run setup-db
```

### 5. Ejecutar en Desarrollo

```bash
pnpm dev
```

La aplicación estará disponible en `http://localhost:3000`

## Credenciales de Prueba

Para pruebas iniciales, utiliza la cuenta admin predeterminada:

- **Email**: admin@diputados.bo (rol: admin)
- **Contraseña**: admin123

Después de iniciar sesión, accede a `/admin/users` para crear otros usuarios.

## Uso

### Dashboard Administrativo (`/admin`)

- **Crear sesiones** parlamentarias
- **Gestionar mociones** y abrir votaciones
- **Agregar/editar parlamentarios**
- **Ver logs de auditoría**
- **Exportar reportes** (en desarrollo)

### Dashboard Parlamentario (`/parliamentarian`)

- **Ver mociones activas** para votación
- **Emitir votos** con confirmación
- **Consultar historial** personal de votos

### Dashboard Público (`/public`)

- **Ver resultados en vivo** sin autenticación
- **Gráficos** de distribución de votos
- **Listado nominal** de parlamentarios y sus votos

## API Endpoints

### Sesiones
- `GET /api/sessions` - Listar sesiones
- `POST /api/sessions` - Crear sesión (admin)

### Mociones
- `GET /api/motions` - Listar mociones
- `POST /api/motions` - Crear moción (admin)

### Votos
- `GET /api/votes` - Listar votos
- `POST /api/votes` - Registrar voto (parlamentario)

### Resultados
- `GET /api/results/[motionId]` - Obtener resultados de moción

### Parlamentarios
- `GET /api/parliamentarians` - Listar parlamentarios
- `POST /api/parliamentarians` - Crear parlamentario (admin)

## Seguridad

- **Autenticación**: Supabase Auth con JWT
- **Autorización**: RBAC a nivel de base de datos (RLS)
- **Validación**: Server-side en todos los endpoints
- **Votos**: Constraint de unicidad a nivel DB
- **Auditoría**: Registro inmutable de todas las acciones
- **CSRF**: Protección built-in de Next.js

## Características Próximas

- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Exportación de reportes en PDF/CSV
- [ ] Gráficos avanzados de estadísticas
- [ ] Rate limiting por IP
- [ ] Integración con sistema de notificaciones
- [ ] Dashboard de análisis por partido político

## Contribución

Este sistema es específico para la Brigada Parlamentaria de Cochabamba. Para cambios o mejoras, contacta al equipo administrativo.

## Soporte

Para reportar problemas o solicitar características, crea un issue en el repositorio.

## Licencia

Propietario - Brigada Parlamentaria de Cochabamba, Bolivia

---

**Última actualización**: Abril 2026

Desarrollado con ❤️ para la democracia parlamentaria
