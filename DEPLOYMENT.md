# Guía de Deployment a Vercel

## Opción 1: Deploy desde GitHub (Recomendado)

### 1. Preparar Repositorio

```bash
# Inicializar git (si no está inicializado)
git init

# Agregar archivos
git add .

# Commit inicial
git commit -m "Sistema Parlamentario de Votación"

# Crear repositorio en GitHub y pushear
git remote add origin https://github.com/tu-usuario/sistema-parlamentario.git
git branch -M main
git push -u origin main
```

### 2. Deploy en Vercel

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en **"Add New..." > "Project"**
3. Selecciona tu repositorio GitHub
4. En **Environment Variables**, añade:
   - `NEXT_PUBLIC_SUPABASE_URL` = (tu URL de Supabase)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (tu anon key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (tu service role key)
5. Click en **"Deploy"**

### 3. Configurar Dominio Personalizado

En Vercel Dashboard:
1. Ve a tu proyecto
2. Settings > Domains
3. Añade tu dominio personalizado

## Opción 2: Deploy Manual con Vercel CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# En preguntas interactivas:
# - Project name: sistema-parlamentario
# - Directory: . (actual)
# - Override settings: No
```

## Opción 3: Deploy sin Vercel (Cualquier host con Node.js)

```bash
# Build
pnpm build

# Start
pnpm start

# Será accesible en http://localhost:3000
```

Para producción con PM2:

```bash
pm2 start "pnpm start" --name "sistema-parlamentario"
```

## Variables de Entorno en Producción

### En Vercel Dashboard:

1. Ve a tu proyecto > **Settings > Environment Variables**
2. Añade las 3 variables de Supabase:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. En **Environments**, asegúrate que estén disponibles en:
   - Production
   - Preview
   - Development

## Configurar CORS en Supabase

Para que el sitio deployado funcione correctamente:

1. Ve a Supabase > **Settings > API > CORS**
2. Añade tu dominio Vercel:
   - `https://tu-proyecto.vercel.app`
   - `https://tu-dominio-personalizado.com` (si tienes)

## Verificar Deployment

Después del deploy, verifica que todo funciona:

```bash
# Probar endpoint de sesiones
curl https://tu-app.vercel.app/api/sessions

# Probar login
# Ve a https://tu-app.vercel.app/auth/login
```

## Monitorar en Producción

### Logs en Vercel:

1. Dashboard > Tu proyecto > **Deployments**
2. Click en el último deployment
3. Ve a **Logs** para ver errores en tiempo real

### Monitorear Supabase:

1. Dashboard de Supabase > **Monitoring**
2. Revisa:
   - Database queries
   - Auth events
   - RLS violations

## Optimizaciones para Producción

### 1. Habilitar Cache

En `next.config.mjs`, asegúrate que está optimizado:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false, // Vercel optimiza imágenes automáticamente
  },
  // Caching de assets
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
```

### 2. Rate Limiting (Próximo)

Implementar rate limiting en endpoints críticos:

```typescript
// lib/rate-limiter.ts
const rateLimit = (limit: number, window: number) => {
  // Implementar con Redis o en-memory cache
};
```

### 3. Comprimir Responses

Next.js comprime automáticamente con gzip.

## Escalabilidad

### Si tienes alto tráfico:

1. **Database**: Supabase escala automáticamente
2. **CDN**: Vercel incluye CDN global
3. **API Routes**: Pueden manejarse funciones serverless sin problemas
4. **WebSockets**: Considera usar Pusher o similar para tiempo real

### Metricas a monitorear:

- Response time
- CPU usage
- Database connections
- API calls
- Errors rate

## Rollback

Si algo sale mal en production:

```bash
# Ver deployments anteriores
vercel list

# Revertir a deployment anterior
vercel rollback
```

## Certificados SSL

Vercel maneja SSL automáticamente:
- Todos los dominios incluyen certificado Let's Encrypt
- Se renuevan automáticamente
- HTTPS es obligatorio

## Backup de Base de Datos

Supabase incluye backups automáticos:

1. Dashboard > **Settings > Backups**
2. Puedes descargar manual: **Settings > Backups > Download backup**

Para restaurar, contacta a Supabase support.

## Monitoreo Continuo

### Alertas recomendadas:

1. **Error rate > 5%**: Revisar logs inmediatamente
2. **Response time > 2s**: Optimizar queries
3. **Database CPU > 80%**: Escalar recursos
4. **Unhandled exceptions**: Investigar y corregir

## Securidad en Producción

✅ Verificaciones antes de ir a producción:

- [ ] CORS configurado correctamente
- [ ] RLS policies en lugar
- [ ] No hay secretos en código
- [ ] Rate limiting implementado
- [ ] HTTPS habilitado
- [ ] Backups de BD configurados
- [ ] Monitoring activo

## Troubleshooting en Producción

### 401 Unauthorized

```
Causa: Tokens expirados o CORS bloqueado
Solución: Verifica CORS en Supabase Settings
```

### 500 Internal Server Error

```
Causa: Error en API route
Solución: Ve a Vercel Logs para detalles
```

### Slow API responses

```
Causa: Queries sin optimizar o DB sobrecargada
Solución: Revisa índices en Supabase, optimiza queries
```

### Memoria agotada

```
Causa: Memory leak en code
Solución: Revisa console.error, busca loops infinitos
```

## Post-Deployment

Después de ir a producción:

1. **Comunicar a usuarios**: Enviar email con nueva URL
2. **Probar completamente**: Tests de smoke testing
3. **Monitorear 24h**: Primer día crítico
4. **Documentar cambios**: Actualizar documentación
5. **Configurar alertas**: Slack/Email para errores

## Contacto Soporte

- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/docs/guides/getting-help
- **GitHub Issues**: Repositorio del proyecto

---

Última actualización: Abril 2026
