# Configuración de Supabase para Autenticación

Este documento detalla los pasos para configurar Supabase y crear los usuarios de prueba para el sistema de Control y Gestión de Proyectos Ágiles.

## Pasos para configurar Supabase

1. Crea una cuenta en [Supabase](https://supabase.com/) si aún no tienes una
2. Crea un nuevo proyecto en Supabase
3. Ve a la sección "Authentication" en el panel lateral
4. En "Providers", asegúrate de que "Email" esté habilitado
5. En "URL Configuration", configura la URL de tu aplicación cliente

## Configuración de variables de entorno

### Para el servidor (Backend)

Crea o edita el archivo `.env` en la carpeta `apps/server`:

```
# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
```

### Para el cliente (Frontend)

Crea o edita el archivo `.env` en la carpeta `apps/client`:

```
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Creación de usuarios de prueba

Hay dos formas de crear los usuarios de prueba:

### Método 1: Desde el panel de Supabase

1. Ve a "Authentication" > "Users" en tu panel de Supabase
2. Haz clic en "Add User" o "Invite User"
3. Crea los siguientes usuarios:

| Rol             | Email                | Contraseña      |
|-----------------|---------------------|-----------------|
| admin           | admin@ingsistemas.gt   | Admin2025!      |
| developer       | dev@ingsistemas.gt     | Developer2025!  |
| product_owner   | pm@ingsistemas.gt      | Manager2025!    |
| member          | member@ingsistemas.gt  | Member2025!     |

### Método 2: Mediante la interfaz de registro de la aplicación

1. Inicia la aplicación cliente y servidor
2. Accede a la página de registro
3. Registra cada usuario utilizando las credenciales mencionadas anteriormente

## Sincronización con la base de datos PostgreSQL

La sincronización entre los usuarios de Supabase y la base de datos PostgreSQL ocurre automáticamente:

1. Cuando un usuario inicia sesión por primera vez, se crea automáticamente un perfil en la tabla `user_profiles` si no existe
2. El ID de autenticación de Supabase se almacena en el campo `auth_id` de la tabla `user_profiles`
3. Esto permite asociar los usuarios de Supabase con los perfiles y roles en la aplicación

## Asignación de roles

La asignación de roles a los usuarios debe hacerse manualmente en la base de datos PostgreSQL. Puedes utilizar pgAdmin o ejecutar directamente SQL:

```sql
-- Ejemplo: Asignar rol admin a un usuario (reemplaza los IDs según corresponda)
UPDATE user_profiles SET role = 'admin' WHERE email = 'admin@ingsistemas.gt';
```

También puedes asignar roles a través de la API una vez que tengas un usuario con rol de administrador funcionando. 