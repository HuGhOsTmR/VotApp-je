# Sistema Parlamentario de Votación en Tiempo Real

## 📋 Descripción General

Sistema digital para votaciones parlamentarias en tiempo real desarrollado para la Brigada Parlamentaria de Cochabamba, Bolivia. Permite votaciones electrónicas seguras, transparentes y auditables.

## 🏗️ Arquitectura del Sistema

### Tecnologías Principales
- **Frontend**: Next.js 16.2.4 con React 19 y TypeScript
- **Backend**: Next.js API Routes con Supabase
- **Base de Datos**: PostgreSQL (Supabase)
- **Autenticación**: Supabase Auth con 2FA opcional para admins
- **UI**: Tailwind CSS con componentes shadcn/ui
- **Gráficos**: Recharts para visualización de datos

### Roles de Usuario
1. **Administrador**: Gestiona usuarios, sesiones, mociones y reportes
2. **Parlamentario**: Participa en votaciones
3. **Observador**: Visualiza resultados en tiempo real

## 🔄 Flujo Completo del Sistema

### 1. Configuración Inicial

#### 1.1 Instalación y Setup
```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Ejecutar migraciones de base de datos
# En Supabase SQL Editor, ejecutar:
# - scripts/01_schema.sql
# - scripts/migration_2fa.sql (opcional)

# Ejecutar seed data
node scripts/02_seed.sql
```

#### 1.2 Usuarios por Defecto
- **Admin**: admin@diputados.bo / admin123
- **Parlamentarios**: Varios usuarios de prueba
- **Observadores**: Acceso público limitado

### 2. Flujo de Autenticación

#### 2.1 Login Estándar
```
Usuario ingresa email/contraseña
    ↓
Supabase Auth valida credenciales
    ↓
Obtener perfil de usuario (role, 2FA status)
    ↓
Redirección según rol:
- Admin → /admin
- Parlamentario → /parliamentarian
- Observador → /public
```

#### 2.2 Login con 2FA (Solo Admins)
```
Usuario ingresa email/contraseña
    ↓
Credenciales válidas + 2FA activado
    ↓
Mostrar formulario de código TOTP
    ↓
Validar código con otplib
    ↓
Acceso concedido → /admin
```

#### 2.3 Configuración de 2FA
```
Admin accede a /admin/profile
    ↓
Click "Configurar 2FA"
    ↓
Generar secreto TOTP con otplib
    ↓
Crear QR code con qrcode
    ↓
Mostrar QR + código manual
    ↓
Usuario escanea con app autenticadora
    ↓
Ingresa código de verificación
    ↓
Activar 2FA en base de datos
```

### 3. Flujo Administrativo

#### 3.1 Gestión de Usuarios
```
Admin → /admin/users
    ↓
Crear/Editar/Eliminar usuarios
    ↓
Asignar roles (admin/parliamentarian/observer)
    ↓
Activar/Desactivar cuentas
    ↓
Exportar lista a CSV
```

#### 3.2 Gestión de Sesiones
```
Admin → /admin/sessions
    ↓
Crear nueva sesión parlamentaria
    ↓
Definir fecha, hora, título, descripción
    ↓
Establecer quórum requerido
    ↓
Cambiar estado: programada → activa → cerrada
```

#### 3.3 Gestión de Mociones
```
Admin → /admin/motions
    ↓
Crear moción dentro de sesión activa
    ↓
Definir título, descripción, tipo
    ↓
Asignar proponente (parlamentario)
    ↓
Abrir votación → Parlamentarios pueden votar
    ↓
Cerrar votación → Calcular resultados
```

#### 3.4 Gestión de Parlamentarios
```
Admin → /admin/parliamentarians
    ↓
Crear/Editar perfiles de parlamentarios
    ↓
Asignar partido político, circunscripción
    ↓
Vincular con usuario del sistema
    ↓
Activar/Desactivar participación
```

### 4. Flujo de Votación Parlamentaria

#### 4.1 Inicio de Sesión Parlamentaria
```
Parlamentario inicia sesión
    ↓
Redirección automática a /parliamentarian
    ↓
Ver sesiones activas y mociones abiertas
```

#### 4.2 Proceso de Votación
```
Parlamentario selecciona moción abierta
    ↓
Ver detalles: título, descripción, proponente
    ↓
Seleccionar opción de voto:
- A Favor (✓)
- En Contra (✗)
- Abstención (≈)
- Ausente (—)
    ↓
Confirmación de voto (no reversible)
    ↓
Registro en base de datos con timestamp
    ↓
Auditoría: IP, User-Agent, timestamp
```

#### 4.3 Cálculo de Resultados en Tiempo Real
```
Cada voto registrado
    ↓
Recalcular estadísticas:
- Votos a favor/en contra/abstención/ausentes
- Participación total
- Quórum alcanzado (automático)
    ↓
Actualizar dashboard público cada 5 segundos
    ↓
Mostrar gráficos y análisis
```

### 5. Flujo Público y Transparencia

#### 5.1 Dashboard Público
```
Usuario público → /public
    ↓
Ver mociones activas en tiempo real
    ↓
Resultados actualizados automáticamente
    ↓
Gráficos: distribución de votos, participación
    ↓
Análisis de quórum y tendencias
```

#### 5.2 Listado Nominal
```
Ver votación detallada por moción
    ↓
Agrupado por partido político
    ↓
Mostrar votos individuales
    ↓
Colores por tipo de voto
    ↓
Exportar a CSV
```

#### 5.3 Resultados y Estadísticas
```
Ver resultados finales por moción
    ↓
Indicador de aprobación/rechazo
    ↓
Estadísticas por partido
    ↓
Exportar resultados a CSV
    ↓
Última actualización visible
```

### 6. Sistema de Auditoría

#### 6.1 Registro de Acciones
```
Toda acción importante se registra:
- Creación/edición de usuarios
- Inicio/fin de sesiones
- Creación/edición de mociones
- Registro de votos
- Cambios de estado
    ↓
Almacenar: usuario, acción, entidad, IP, timestamp
```

#### 6.2 Dashboard de Auditoría
```
Admin → /admin/audit
    ↓
Ver log completo de acciones
    ↓
Filtrar por usuario, fecha, tipo
    ↓
Exportar reportes de auditoría
```

### 7. Validación de Quórum Automática

#### 7.1 Cálculo Dinámico
```
Obtener total de parlamentarios activos
    ↓
Calcular quórum = MAX(50% + 1, 50)
    ↓
Comparar con votos presentes
    ↓
Actualizar estado en tiempo real
```

#### 7.2 Indicadores Visuales
```
Dashboard muestra:
- Quórum alcanzado: ✓/✗
- Votos requeridos vs presentes
- Participación porcentual
- Parlamentarios totales
```

### 8. Seguridad y Mejores Prácticas

#### 8.1 Autenticación
- Supabase Auth con JWT
- 2FA opcional para administradores
- Sesiones seguras con refresh tokens

#### 8.2 Autorización
- Middleware de rutas protegidas
- Verificación de roles por componente
- Guards de autenticación

#### 8.3 Validación de Datos
- TypeScript para type safety
- Validación en API routes
- Sanitización de inputs

#### 8.4 Auditoría y Transparencia
- Log completo de acciones
- Votos no modificables
- Resultados públicos en tiempo real

### 9. Despliegue y Mantenimiento

#### 9.1 Variables de Entorno
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NODE_ENV=production
```

#### 9.2 Build y Deploy
```bash
# Build de producción
pnpm build

# Verificar build
pnpm start

# Deploy en Vercel/Netlify
# Conectar repositorio y configurar env vars
```

#### 9.3 Monitoreo
- Logs de aplicación
- Monitoreo de base de datos
- Alertas de seguridad
- Backup automático

## 🎯 Casos de Uso Principales

### Caso 1: Sesión Parlamentaria Completa
1. Admin crea sesión
2. Admin registra parlamentarios
3. Admin abre moción para votación
4. Parlamentarios votan en tiempo real
5. Público ve resultados actualizados
6. Admin cierra votación
7. Resultados finales publicados

### Caso 2: Votación de Emergencia
1. Admin crea moción urgente
2. Notificación automática (futuro)
3. Parlamentarios votan desde móviles
4. Quórum validado automáticamente
5. Resultados disponibles inmediatamente

### Caso 3: Auditoría Post-Votación
1. Ver listado nominal completo
2. Revisar logs de auditoría
3. Exportar reportes CSV
4. Verificar integridad de votos

## 🔧 API Endpoints Principales

### Autenticación
- `POST /api/auth/two-factor` - Configurar 2FA
- `PUT /api/auth/two-factor` - Verificar y activar 2FA
- `DELETE /api/auth/two-factor` - Desactivar 2FA
- `POST /api/auth/verify-2fa` - Verificar código 2FA

### Usuarios
- `GET /api/users` - Listar usuarios (admin)
- `POST /api/users` - Crear usuario (admin)
- `PATCH /api/users` - Actualizar usuario (admin)
- `DELETE /api/users` - Eliminar usuario (admin)
- `GET /api/users/profile` - Obtener perfil propio

### Mociones y Votos
- `GET /api/motions` - Listar mociones
- `POST /api/motions` - Crear moción (admin)
- `GET /api/results/[motionId]` - Obtener resultados
- `POST /api/votes` - Registrar voto (parlamentario)

### Parlamentarios
- `GET /api/parliamentarians` - Listar parlamentarios
- `POST /api/parliamentarians` - Crear parlamentario (admin)

## 📱 Responsive Design

- **Móvil**: Layout de una columna, botones grandes
- **Tablet**: 2 columnas para votación
- **Desktop**: Layout completo de 4 columnas
- **Touch-friendly**: Botones de al menos 44px

## 🔄 Actualizaciones en Tiempo Real

- Dashboard público: cada 5 segundos
- WebSockets para notificaciones (futuro)
- Auto-refresh inteligente
- Indicador de última actualización

---

*Sistema desarrollado para promover la transparencia y eficiencia en los procesos parlamentarios de Cochabamba, Bolivia.*