# Sistema Parlamentario de Votación en Tiempo Real

![Estado](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Licencia](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)

## 🏛️ Descripción

Sistema completo de votación parlamentaria en tiempo real para la Brigada Parlamentaria de Cochabamba, Bolivia. Implementa autenticación segura, auditoría inmutable, resultados en vivo y dashboards especializados para diferentes roles.

## ✨ Características Principales

### 📊 Tres Dashboards Especializados
- **Admin Dashboard** (`/admin`) - Gestión completa del sistema
- **Parlamentarian Dashboard** (`/parliamentarian`) - Interfaz de votación mobile-first
- **Public Dashboard** (`/public`) - Resultados en vivo sin autenticación

### 🔐 Seguridad Enterprise
- Autenticación Supabase Auth con RBAC
- Row Level Security en base de datos
- Prevención de votos duplicados
- Auditoría inmutable de todas las acciones
- CSRF protection integrado

### ⚡ Características Técnicas
- Real-time updates cada 5 segundos
- 6 endpoints REST API
- 8 tablas PostgreSQL normalizadas
- Gráficos interactivos (Recharts)
- Listado nominal de votantes
- Exportación de reportes

### 🎯 Funcionalidades
- ✅ Creación y gestión de sesiones parlamentarias
- ✅ Gestión de mociones para votación
- ✅ Sistema de votación nominal (Favor/Contra/Abstención/Ausente)
- ✅ Resultados en tiempo real con indicador de quórum
- ✅ Historial personal de votaciones
- ✅ Logs de auditoría con IP y user agent
- ✅ Reportes exportables (CSV)

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- pnpm / npm / yarn
- Cuenta Supabase

### Instalación (3 pasos)

```bash
# 1. Clonar
git clone https://github.com/HuGhOsTmR/VotApp-je.git
cd VotApp-je

# 2. Instalar dependencias
pnpm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales Supabase
```

### Configurar Base de Datos

```bash
# Ejecutar migraciones
pnpm db:setup

# O manualmente en la Supabase Console ejecutar:
# - scripts/01_schema.sql
# - scripts/02_seed.sql
```

### Ejecutar en Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📚 Documentación

Comienza por estos archivos (en orden):

1. **[INDEX.md](./INDEX.md)** - Overview del proyecto
2. **[V0_SETUP_INSTRUCTIONS.md](./V0_SETUP_INSTRUCTIONS.md)** - Guía paso a paso
3. **[SETUP.md](./SETUP.md)** - Configuración detallada
4. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deploy a Vercel
5. **[COMPLETADO.md](./COMPLETADO.md)** - Resumen técnico
6. **[GITHUB_DEPLOYMENT.md](./GITHUB_DEPLOYMENT.md)** - Info del repositorio

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│     Next.js 16 + React 19           │
│  (Frontend + API Backend)           │
└──────────┬──────────────────────────┘
           │
           ├─► /app/admin           (Admin Dashboard)
           ├─► /app/parliamentarian (Voting Dashboard)
           ├─► /app/public          (Public Results)
           ├─► /app/api             (REST Endpoints)
           └─► /app/auth            (Authentication)
           │
┌──────────┴──────────────────────────┐
│    Supabase PostgreSQL             │
│  - 8 tablas normalizadas           │
│  - RLS policies                    │
│  - Audit logs                      │
│  - Row-level security              │
└────────────────────────────────────┘
```

## 🔐 Usuarios de Prueba

Después de ejecutar `pnpm db:setup`, tienes 20 parlamentarios listos:

| Email | Contraseña | Rol | Partido |
|-------|-----------|-----|---------|
| admin@votapp.bo | password | Administrador | - |
| parlamentario1@votapp.bo | password | Parlamentario | MAS |
| ... | password | Parlamentario | UN, CC |

**Cambiar contraseña en la primera sesión es recomendado.**

## 📁 Estructura del Proyecto

```
VotApp-je/
├── app/
│   ├── admin/                 # Dashboard administrativo
│   ├── parliamentarian/       # Interfaz de votación
│   ├── public/                # Resultados públicos
│   ├── api/                   # REST endpoints
│   └── auth/                  # Autenticación
├── components/
│   ├── admin/                 # Componentes admin
│   ├── parliamentarian/       # Componentes votación
│   ├── public/                # Componentes públicos
│   ├── auth/                  # Componentes auth
│   ├── shared/                # Componentes comunes
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── supabase/              # Clientes Supabase
│   ├── hooks/                 # Custom hooks
│   ├── types.ts               # Tipos TypeScript
│   └── constants.ts           # Constantes
├── scripts/
│   ├── 01_schema.sql          # Schema de BD
│   ├── 02_seed.sql            # Datos de prueba
│   └── *.js                   # Scripts útiles
├── middleware.ts              # Auth middleware
└── package.json               # Dependencias
```

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + Next.js 16 |
| **Styling** | Tailwind CSS v4 |
| **Componentes UI** | shadcn/ui |
| **Gráficos** | Recharts |
| **Backend** | Next.js API Routes |
| **Base de Datos** | PostgreSQL (Supabase) |
| **Autenticación** | Supabase Auth |
| **Validación** | Zod |
| **Lenguaje** | TypeScript |

## 🚀 Deployment

### Vercel (Recomendado)

```bash
# 1. Push a GitHub (ya hecho)
# 2. Ir a https://vercel.com/new
# 3. Importar: HuGhOsTmR/VotApp-je
# 4. Agregar variables de entorno Supabase
# 5. Click "Deploy"
```

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para más detalles.

### Docker

```bash
docker build -t votapp .
docker run -p 3000:3000 votapp
```

## 📋 API Endpoints

```
POST   /api/sessions           - Crear sesión
GET    /api/sessions           - Listar sesiones
PUT    /api/sessions/:id       - Actualizar sesión
DELETE /api/sessions/:id       - Eliminar sesión

POST   /api/motions            - Crear moción
GET    /api/motions            - Listar mociones
PUT    /api/motions/:id        - Actualizar moción
DELETE /api/motions/:id        - Eliminar moción

POST   /api/votes              - Registrar voto
GET    /api/results/:motionId  - Obtener resultados
```

## 🔒 Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Opcional
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Obtén estos valores de: **Supabase Dashboard > Settings > API**

## 🐛 Troubleshooting

### Error: "NEXT_PUBLIC_SUPABASE_URL is not set"
- Verifica que `.env.local` está configurado correctamente
- Reinicia el servidor de desarrollo

### Error: "Unable to establish connection to database"
- Verifica las credenciales de Supabase
- Verifica que las migraciones se ejecutaron: `pnpm db:setup`

### Votos no se guardan
- Verifica que estés autenticado
- Revisa los logs en la Supabase Console
- Verifica RLS policies en la BD

Ver [SETUP.md](./SETUP.md) para más soluciones.

## 📊 Estadísticas del Proyecto

- **Líneas de código**: 3000+
- **Componentes React**: 40+
- **Endpoints API**: 6
- **Tablas de BD**: 8
- **Documentos**: 8
- **Archivos totales**: 113

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit los cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](./LICENSE) para detalles.

## 👨‍💼 Autor

Creado con v0.app para la Brigada Parlamentaria de Cochabamba, Bolivia.

**Contacto**: Para soporte, consulta la documentación o abre un issue en GitHub.

---

**Nota**: Este sistema está diseñado para producción. Se implementaron las mejores prácticas de seguridad, auditoría y escalabilidad.

¿Preguntas? Comienza con [INDEX.md](./INDEX.md) 🚀
