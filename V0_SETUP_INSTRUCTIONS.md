# 🔧 Instrucciones de Setup en v0

## Resumen Rápido

Tu Sistema Parlamentario de Votación ya está 95% listo. Solo necesitas:

1. **Configura 3 variables de entorno** (2 minutos)
2. **Ejecuta el setup de BD** (1 minuto)
3. **¡Listo!**

---

## Paso 1: Configura Variables de Entorno

### 1.1 - Obtén las credenciales de Supabase

1. Ve a https://supabase.com y abre tu proyecto
2. En el menú lateral, haz clic en **Settings**
3. Abre la pestaña **API**
4. **Copia** estos valores:

```
Project URL:        → Copy (necesitarás esto para NEXT_PUBLIC_SUPABASE_URL)
anon public key:    → Copy (necesitarás esto para NEXT_PUBLIC_SUPABASE_ANON_KEY)
Service role secret → Copy (necesitarás esto para SUPABASE_SERVICE_ROLE_KEY)
```

### 1.2 - Configúralos en v0

1. Haz clic en el botón **Settings** (⚙️) en la esquina superior derecha de v0
2. Abre la sección **Vars** (segunda pestaña)
3. Haz clic en **+ Add Variable**
4. Crea 3 variables:

```
Variable 1:
  Name:  NEXT_PUBLIC_SUPABASE_URL
  Value: [Pega aquí tu Project URL de Supabase]
  
Variable 2:
  Name:  NEXT_PUBLIC_SUPABASE_ANON_KEY
  Value: [Pega aquí tu anon public key]
  
Variable 3:
  Name:  SUPABASE_SERVICE_ROLE_KEY
  Value: [Pega aquí tu Service role secret]
```

5. Haz clic en **Save** para cada una

⚠️ **Importante:** Asegúrate de que las tres variables estén configuradas sin espacios adicionales.

---

## Paso 2: Verificar Variables

Abre la terminal en v0 y ejecuta:

```bash
node scripts/diagnose.js
```

Deberías ver:
```
✅ NEXT_PUBLIC_SUPABASE_URL: https://...
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGc...
✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGc...
```

Si ves ❌, verifica que las variables estén correctamente guardadas.

---

## Paso 3: Ejecutar Setup de Base de Datos

### Opción A: Automático (RECOMENDADO)

En la terminal de v0:

```bash
pnpm db:setup
```

Deberías ver:
```
✨ Base de datos configurada exitosamente!
```

### Opción B: Manual (Si el automático falla)

1. Ve a tu proyecto Supabase
2. Abre **SQL Editor** (en el menú lateral)
3. Haz clic en **New Query**
4. Copia TODO el contenido de:
   - `scripts/01_schema.sql` (Pégalo, ejecútalo)
   - `scripts/02_seed.sql` (Pégalo, ejecútalo)

---

## Paso 4: Inicia el Servidor de Desarrollo

En la terminal:

```bash
pnpm dev
```

Deberías ver:
```
▲ Next.js
- ready on http://localhost:3000
```

---

## Paso 5: Prueba el Sistema

### 5.1 - Crea tu cuenta de admin

1. Ve a http://localhost:3000 en tu navegador
2. Haz clic en **Ir a Login**
3. Haz clic en **¿No tienes cuenta? Regístrate**
4. Llena el formulario (email, contraseña)
5. ¡La primera cuenta se crea como admin automáticamente!

### 5.2 - Prueba cada dashboard

**Admin Dashboard:**
- URL: http://localhost:3000/admin
- Aquí puedes:
  - Crear nuevas sesiones parlamentarias
  - Crear mociones para votar
  - Gestionar parlamentarios
  - Ver logs de auditoría
  - Exportar reportes

**Parlamentario Dashboard:**
- URL: http://localhost:3000/parliamentarian
- Aquí puedes:
  - Ver mociones abiertas
  - Votar (con interfaz grande para móvil)
  - Ver tu historial de votos
  - **Nota:** Tu cuenta de admin también puede acceder aquí

**Público Dashboard:**
- URL: http://localhost:3000/public
- Sin login requerido
- Ver resultados en vivo
- Ver votos nominales

### 5.3 - Crea una moción de prueba

1. Ve a `/admin/motions`
2. Haz clic en **Nueva Moción**
3. Llena el formulario:
   - Título: "Prueba de sistema"
   - Descripción: "Moción para probar el sistema"
   - Estado: "open"
4. Haz clic en **Crear**

### 5.4 - Vota en la moción

1. Ve a `/parliamentarian/voting`
2. Selecciona la moción que acabas de crear
3. Haz clic en uno de los botones (Favor, Contra, Abstención)
4. Confirma tu voto
5. Ve a `/public` para ver el resultado en vivo

---

## 🎯 Usuarios de Prueba

Después del setup, tienes automáticamente:

**Tu cuenta de admin:**
- Email: El que hayas creado
- Rol: Admin

**20 Parlamentarios de ejemplo:**

Si quieres acceder como parlamentario (sin crear nueva cuenta):
- Ve a Supabase > Auth > Users
- Verás los 20 usuarios creados
- Puedes resetear su contraseña si necesitas

Partidos representados:
- MAS (Movimiento Al Socialismo)
- UN (Un Nuevo Tiempo)
- CC (Comunidad Ciudadana)

---

## 🚀 Próximos Pasos (Opcional)

### Deploy a Producción

1. Lee: `DEPLOYMENT.md`
2. Sigue los pasos para desplegar a Vercel

### Personalización

- `lib/constants.ts` - Cambia nombres, configuración
- `app/layout.tsx` - Cambia metadatos
- Archivos en `scripts/02_seed.sql` - Agrega más parlamentarios

---

## ❌ Troubleshooting

### Error: "Missing environment variables"

**Solución:**
1. Ejecuta: `node scripts/diagnose.js`
2. Verifica que las 3 variables estén en Settings > Vars
3. Recarga la página de v0
4. Intenta de nuevo

### Error: "Connection refused"

**Solución:**
1. Verifica que tu proyecto Supabase está activo
2. Verifica que la URL sea correcta (sin espacios)
3. Intenta resetear las variables

### No se crean las tablas

**Solución:**
1. Ve a tu proyecto Supabase > SQL Editor
2. Ejecuta manualmente `scripts/01_schema.sql`
3. Ejecuta manualmente `scripts/02_seed.sql`

### No aparecen los datos de ejemplo

**Solución:**
1. Ve a tu proyecto Supabase
2. Abre **SQL Editor**
3. Ejecuta:
```sql
SELECT COUNT(*) FROM parliamentarians;
```
4. Si es 0, ejecuta `scripts/02_seed.sql`

---

## 📞 Ayuda Rápida

| Problema | Comando/Solución |
|----------|-----------------|
| Verificar variables | `node scripts/diagnose.js` |
| Reiniciar servidor | Ctrl+C, luego `pnpm dev` |
| Ver logs Supabase | Supabase dashboard > Logs |
| Resetear BD | Supabase dashboard > Database > Reset |
| Exportar datos | Admin > Reports |

---

## ✨ ¡Ya está listo!

Una vez completados los 5 pasos, tienes un **Sistema Parlamentario de Votación en Tiempo Real** completamente funcional con:

- ✅ Autenticación segura
- ✅ 3 dashboards separados
- ✅ Votación en tiempo real
- ✅ Auditoría inmutable
- ✅ Reportes
- ✅ Acceso público

---

**Tiempo total de setup:** ~5 minutos

¡Disfruta tu sistema!
