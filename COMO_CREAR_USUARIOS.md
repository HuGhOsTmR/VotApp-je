# Cómo Crear los Usuarios Demo

## Opción A: Rápida (Recomendado - 2 minutos)

### En Supabase Dashboard

1. Abre tu proyecto Supabase: https://supabase.com/dashboard
2. Ve a **Authentication > Users**
3. Haz click en **"Add user"** cuatro veces y crea estos usuarios:

```
Email: admin@diputados.bo
Password: Admin123!@#
Auto confirm: ✓

Email: parlamentario1@diputados.bo
Password: Parl123!@#
Auto confirm: ✓

Email: parlamentario2@diputados.bo
Password: Parl123!@#
Auto confirm: ✓

Email: observador@diputados.bo
Password: Obs123!@#
Auto confirm: ✓
```

4. Abre tu terminal y ejecuta:
```bash
pnpm db:demo-users
```

5. Abre http://localhost:3000/auth/login e ingresa con cualquier usuario de arriba

---

## Opción B: Automática (Más fácil - 1 minuto)

Si ya tienes tus variables de Supabase configuradas correctamente:

```bash
pnpm db:demo-users
```

Este comando crea automáticamente los 4 usuarios.

---

## Opción C: Manual vía SQL (Para expertos)

En Supabase SQL Editor, ejecuta:

```bash
# Primero, crea los usuarios en Supabase Auth (via Dashboard)
# Luego, ejecuta este script SQL

curl -X POST "https://supabase.co/..." # Ver CREATE_SUPABASE_USERS.md
```

---

## ¿Qué pasa después?

Una vez creados los usuarios:

1. **Admin** (admin@diputados.bo) → Va a `/admin`
2. **Parlamentario 1** (parlamentario1@diputados.bo) → Va a `/parliamentarian`
3. **Parlamentario 2** (parlamentario2@diputados.bo) → Va a `/parliamentarian`
4. **Observador** (observador@diputados.bo) → Va a `/public`

---

## Verificar que Funcionó

```bash
pnpm dev
# Abre http://localhost:3000/auth/login
# Intenta ingresar con admin@diputados.bo / Admin123!@#
```

Si ves el dashboard → ¡Funcionó! ✓

---

## Problemas?

**"Invalid login credentials"**
- Verifica que marcaste "Auto confirm" al crear el usuario
- Asegúrate de escribir bien email y password

**No se redirige al dashboard**
- Ejecuta: `pnpm db:demo-users`
- Esto crea los perfiles en la BD

**Error de conexión a Supabase**
- Revisa que NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén configuradas
- Ve a tu proyecto > Settings > API Keys
