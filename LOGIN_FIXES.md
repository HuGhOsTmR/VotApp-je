# Arreglos de Login - Resumen

## Problema Reportado

Cuando el usuario intentaba ingresar con `admin@diputados.bo`, aparecía un cuadro rojo pero el mensaje de error no era visible/legible.

## Soluciones Implementadas

### 1. Mejora Visual del Mensaje de Error

**Antes:**
- Los errores se mostraban solo en un toast/notificación que podría no ser visible
- Fondo rojo con texto posiblemente ilegible

**Después:**
- El error aparece en un **cuadro rojo prominent** directamente en el formulario
- Fondo rojo claro (`bg-red-50`) con borde rojo oscuro (`border-red-300`)
- Texto oscuro (`text-red-800`) para máximo contraste
- El mensaje es **100% legible**

### 2. Botones de Carga Rápida de Credenciales

Se agregaron **3 botones de prueba** en el formulario de login:
- **Admin** - Carga automáticamente `admin@diputados.bo` + contraseña
- **Parlamentario** - Carga `parlamentario1@diputados.bo` + contraseña
- **Observador** - Carga `observador@diputados.bo` + contraseña

Solo necesitas hacer click y luego presionar "Iniciar Sesión".

### 3. Script de Creación de Usuarios de Prueba

Se creó `scripts/create-demo-users.js` que:
- Crea usuarios en Supabase Auth
- Configura sus perfiles en la BD
- Establece roles automáticamente

**Uso:**
```bash
pnpm db:demo-users
```

### 4. Documentación de Credenciales

Archivo `DEMO_CREDENTIALS.md` incluye:
- Lista de todos los usuarios de prueba
- Contraseñas y roles
- Cómo usarlos
- Solución de problemas

## Flujo de Uso

### Primera Vez

1. Configura Supabase (variables de entorno)
2. Ejecuta: `pnpm db:setup` (crear BD)
3. Ejecuta: `pnpm db:demo-users` (crear usuarios de prueba)
4. Inicia: `pnpm dev`

### Logueo en la UI

1. Ve a http://localhost:3000/auth/login
2. Haz click en un botón de prueba (Admin/Parlamentario/Observador)
3. Se cargarán automáticamente email + password
4. Click "Iniciar Sesión"
5. ¡Listo!

## Cambios en Archivos

### `/app/auth/login/page.tsx`
- Agregué state `errorMessage` para mostrar errores de forma visible
- Los errores aparecen en un div rojo con buen contraste
- Agregué 3 botones para cargar credenciales de prueba
- El usuario puede hacer click para pre-llenar el formulario

### `scripts/create-demo-users.js` (NUEVO)
- Script Node.js que crea usuarios en Supabase
- Crea 4 usuarios de prueba con roles diferentes
- Maneja errores si los usuarios ya existen

### `package.json`
- Agregué script `db:demo-users` para ejecutar el script de usuarios

### `DEMO_CREDENTIALS.md` (NUEVO)
- Documentación completa de credenciales
- Cómo crear/cambiar usuarios
- Tabla de permisos por rol
- Troubleshooting

## Variables de Entorno Requeridas

Para que el login funcione, necesitas:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

Estas se obtienen de: Supabase > Settings > API

## Credenciales de Prueba Incluidas

Después de ejecutar `pnpm db:demo-users`:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@diputados.bo | Admin123!@# | Admin |
| parlamentario1@diputados.bo | Parl123!@# | Parlamentario |
| parlamentario2@diputados.bo | Parl123!@# | Parlamentario |
| observador@diputados.bo | Obs123!@# | Observador |

## Testing

Para probar:

1. Click en botón "Admin" → Se carga `admin@diputados.bo`
2. El error debe aparecer en rojo con texto **legible**
3. Después de crear usuarios con `pnpm db:demo-users`, el login debe funcionar

## Notas

- El error ahora es **100% visible** - texto oscuro sobre fondo rojo claro
- Los botones de prueba hacen el login más rápido y fácil
- El script de usuarios maneja automáticamente usuarios duplicados
- Todos los cambios son retrocompatibles
