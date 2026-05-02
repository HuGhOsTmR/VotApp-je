# 📋 Sistema Parlamentario de Votación - Guía Rápida

## 🎯 ¿Qué es este sistema?

Una plataforma digital para votaciones parlamentarias transparentes, seguras y en tiempo real, desarrollada para la Brigada Parlamentaria de Cochabamba.

## 👥 Roles de Usuario

| Rol | Permisos | Acceso |
|-----|----------|--------|
| **Admin** | Gestiona todo el sistema, usuarios, sesiones | Panel completo + 2FA opcional |
| **Parlamentario** | Vota en mociones activas | Interfaz de votación |
| **Público** | Ve resultados en tiempo real | Dashboard público |

## 🚀 Flujo Básico de Uso

### 1. **Configuración Inicial**
```bash
pnpm install
# Configurar .env.local
# Ejecutar scripts SQL en Supabase
```

### 2. **Primer Uso**
- **Admin**: Login con `admin@diputados.bo` / `admin123`
- **Parlamentarios**: Usuarios creados por admin
- **Público**: Acceso sin login

### 3. **Sesión Parlamentaria Típica**
```
Admin crea sesión → Admin abre moción → Parlamentarios votan → Resultados públicos → Admin cierra votación
```

## 🔑 Características Principales

### ✅ Seguridad
- Autenticación Supabase con JWT
- 2FA opcional para administradores
- Auditoría completa de todas las acciones
- Votos no modificables

### ✅ Transparencia
- Resultados en tiempo real (actualización cada 5s)
- Listado nominal público
- Exportación CSV de resultados
- Dashboard público sin login requerido

### ✅ Usabilidad
- Interfaz responsive (móvil, tablet, desktop)
- Confirmación de votos para evitar errores
- Indicadores visuales claros
- Notificaciones toast

### ✅ Automatización
- Cálculo automático de quórum (50% + 1)
- Validación en tiempo real
- Actualización automática de resultados
- Auditoría automática

## 📱 Interfaces Principales

### Panel de Administración (`/admin`)
- Gestión de usuarios, sesiones, mociones
- Reportes y auditoría
- Configuración de perfil y 2FA

### Interfaz de Votación (`/parliamentarian`)
- Lista de mociones activas
- Botones grandes para votar
- Confirmación obligatoria
- Historial personal

### Dashboard Público (`/public`)
- Resultados en tiempo real
- Gráficos interactivos
- Listado nominal por partido
- Exportación de datos

## 🔧 Tecnologías

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth + 2FA (otplib)
- **UI**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts

## 📊 Base de Datos

### Tablas Principales
- `user_profiles` - Usuarios del sistema
- `parliamentarians` - Parlamentarios registrados
- `sessions` - Sesiones parlamentarias
- `motions` - Mociones/proyectos de resolución
- `votes` - Votos registrados
- `audit_logs` - Registro de auditoría

## 🔄 API Endpoints

### Autenticación
- `POST /api/auth/two-factor` - Configurar 2FA
- `POST /api/auth/verify-2fa` - Verificar código 2FA

### Gestión
- `GET/POST /api/users` - CRUD usuarios
- `GET/POST /api/motions` - CRUD mociones
- `GET/POST /api/votes` - Registrar votos
- `GET /api/results/[id]` - Obtener resultados

## 🚀 Despliegue

```bash
# Build
pnpm build

# Variables de entorno requeridas
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Deploy en Vercel/Netlify
```

## 📈 Métricas de Éxito

- ✅ **Transparencia**: Resultados públicos en tiempo real
- ✅ **Seguridad**: 2FA para admins, auditoría completa
- ✅ **Usabilidad**: Interfaz responsive y intuitiva
- ✅ **Eficiencia**: Automatización de quórum y cálculos
- ✅ **Escalabilidad**: Arquitectura preparada para crecimiento

---

**Estado**: ✅ **Listo para producción**

**Próximos pasos**: Monitoreo, feedback de usuarios, mejoras iterativas.