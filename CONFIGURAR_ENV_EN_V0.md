# Cómo Configurar las Variables de Entorno en v0

## Ubicación en v0

### Paso 1: Abre el Menú de Configuración
En la esquina **superior derecha** de v0, verás un ícono de **engranaje** (⚙️)
- Haz clic en ese icono

### Paso 2: Ve a Variables de Entorno
En el menú que aparece:
1. Busca la opción **"Vars"** o **"Variables"**
2. Haz clic en **"Vars"**

### Paso 3: Agrega las Variables

Verás un formulario donde puedes agregar variables. Debes tener 3:

#### Variable 1: NEXT_PUBLIC_SUPABASE_URL
```
Nombre:  NEXT_PUBLIC_SUPABASE_URL
Valor:   https://owiclogtneltzgarrffl.supabase.co
```

#### Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Nombre:  NEXT_PUBLIC_SUPABASE_ANON_KEY
Valor:   sb_publishable_mwgWPbPnIXgYVD9ey2b8Og_LIwFC4ny
```

#### Variable 3: SUPABASE_SERVICE_ROLE_KEY
```
Nombre:  SUPABASE_SERVICE_ROLE_KEY
Valor:   [Pega aquí la clave que copiaste de Supabase - es un token largo que empieza con eyJ]
```

## Paso a Paso Visual

```
v0 Interface
┌─────────────────────────────────────────────┐
│  [Botón Preview]  [⚙️ Settings]             │ (arriba a la derecha)
│                                             │
└─────────────────────────────────────────────┘
                    ↓
        (Haz clic en ⚙️ Settings)
                    ↓
┌─────────────────────────────────────────────┐
│  Design  Rules  Vars ← AQUÍ                 │
│                                             │
│  [+] Add Variable                           │
│  ────────────────────────────────────────── │
│  NEXT_PUBLIC_SUPABASE_URL                   │
│  https://owiclogtneltzgarrffl.supabase.co   │
│                                             │
│  NEXT_PUBLIC_SUPABASE_ANON_KEY              │
│  sb_publishable_mwgWPbPnIXgYVD9ey2b8Og...   │
│                                             │
│  SUPABASE_SERVICE_ROLE_KEY                  │
│  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...    │
│                                             │
└─────────────────────────────────────────────┘
```

## Verificación

Después de agregar las 3 variables:
- ✓ Debería ver un listado con las 3 variables
- ✓ No debería haber errores en rojo
- ✓ Puedes cerrar el menú de configuración

## Siguiente Paso

Una vez configuradas las variables:

```bash
pnpm db:migrate      # Crear tablas
pnpm db:setup        # Insertar datos
pnpm db:demo-users   # Crear usuarios de prueba
pnpm dev             # Iniciar servidor
```

## Si No Ves la Opción "Vars"

1. Asegúrate que estés en v0 (https://v0.app)
2. Haz clic en el ícono de engranaje (⚙️) en la esquina superior derecha
3. Debería aparecer un menú con opciones: Design, Rules, Vars, Settings
4. Si aún no aparece, recarga la página (F5)

