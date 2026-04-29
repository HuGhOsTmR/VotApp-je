# Cómo Encontrar la Service Role Key

## Paso 1: Abre Supabase Dashboard

Ve a: https://app.supabase.com

## Paso 2: Selecciona tu Proyecto

Haz clic en: **"VotApp Cochabamba"** (o el proyecto que creamos)

## Paso 3: Ve a Configuración

En el menú izquierdo:
1. Busca **"Settings"** (engranaje)
2. Haz clic en **"Settings"**

## Paso 4: Abre API

En la página de Settings:
1. En el menú lateral izquierdo, busca **"API"**
2. Haz clic en **"API"**

## Paso 5: Encuentra la Service Role Key

En la página de API verás dos secciones:

### Sección "Project API keys"

```
┌─────────────────────────────────────────┐
│ Project API keys                        │
├─────────────────────────────────────────┤
│                                         │
│ anon public                             │
│ ─────────────────────────────────────   │ (esta es la ANON KEY)
│ sb_publishable_mwgWPbPnIXgYVD9ey2b8Og   │
│                                         │
│ service_role secret                     │
│ ─────────────────────────────────────   │ (esta es la SERVICE ROLE KEY)
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... │ (token largo)
│                                         │
│ Copy    Reveal                          │ (botones para copiar/mostrar)
│
└─────────────────────────────────────────┘
```

## ¿Qué Copiar?

La **service_role key** es un token que comienza típicamente con:
- `eyJ...` (si empieza así, es un JWT)
- Tiene cientos de caracteres
- Es mucho más largo que la anon key

## Pasos Finales

1. Busca la línea que dice **"service_role secret"**
2. Haz clic en **"Copy"** (botón al lado)
3. El token se copia al portapapeles
4. Pégalo en el campo **SUPABASE_SERVICE_ROLE_KEY** en v0

## Si No Ves "service_role secret"

Si no aparece, es posible que:
1. No estés en Settings > API
2. El navegador no haya cargado completamente
3. **Solución**: Recarga la página (F5) e intenta de nuevo

## Verificación

Después de copiar, debería tener:

✓ NEXT_PUBLIC_SUPABASE_URL = https://owiclogtneltzgarrffl.supabase.co
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_mwgWPbPnIXgYVD9ey2b8Og...
✓ SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIs... (token largo)

Cuando tengas las 3, está completo ✓

