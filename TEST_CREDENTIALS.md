# Credenciales de Prueba

## Cómo Crear los Usuarios de Prueba

Ejecuta en tu terminal después de configurar Supabase:

```bash
pnpm db:demo-users
```

Este comando crea 4 usuarios en tu base de datos Supabase.

## Credenciales Disponibles

### Admin
- **Email**: `admin@diputados.bo`
- **Contraseña**: `Admin123!@#`
- **Acceso**: Dashboard administrativo (`/admin`)

### Parlamentario 1
- **Email**: `parlamentario1@diputados.bo`
- **Contraseña**: `Parl123!@#`
- **Acceso**: Dashboard de votación (`/parliamentarian`)

### Parlamentario 2
- **Email**: `parlamentario2@diputados.bo`
- **Contraseña**: `Parl123!@#`
- **Acceso**: Dashboard de votación (`/parliamentarian`)

### Observador
- **Email**: `observador@diputados.bo`
- **Contraseña**: `Obs123!@#`
- **Acceso**: Dashboard público (`/public`)

## Proceso de Prueba Recomendado

1. Abre http://localhost:3000/auth/login
2. Ingresa las credenciales de arriba
3. Verifica que se redirija al dashboard correcto según el rol
4. Prueba las funcionalidades de cada rol

## Problemas Encontrados

Documenta aquí cualquier error o comportamiento inesperado que encuentres:

- [ ] Admin Dashboard
- [ ] Parlamentario Dashboard
- [ ] Public Dashboard
- [ ] Votación
- [ ] Resultados en Vivo
- [ ] Auditoría
- [ ] Reportes
