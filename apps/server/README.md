# API del Sistema de Control y Gestión de Proyectos Ágiles

Backend desarrollado con FastAPI, SQLModel y PostgreSQL para la gestión de proyectos ágiles.

## Inicio rápido

```bash
# Iniciar el servidor en modo desarrollo
uvicorn app.main:app --reload
```

## Estructura del proyecto

```
├── app/
│   ├── core/            # Configuraciones básicas
│   ├── database/        # Configuración de BD y seeders
│   ├── models/          # Modelos de datos (SQLModel)
│   ├── routers/         # Endpoints de la API
│   ├── schemas/         # Esquemas Pydantic
│   └── main.py          # Punto de entrada de la aplicación
├── migrations/          # Migraciones de Alembic
│   ├── versions/        # Versiones de migraciones
│   └── env.py           # Configuración de entorno para migraciones
├── scripts/             # Scripts útiles
│   └── migrate.py       # Script para facilitar migraciones
├── requirements.txt     # Dependencias
├── Dockerfile           # Configuración para Docker
└── alembic.ini          # Configuración de Alembic
```

## Base de datos

El sistema utiliza PostgreSQL con SQLModel como ORM y Alembic para migraciones.

### Migraciones con Alembic

Para manejar la estructura de la base de datos, utilizamos Alembic:

```bash
# Actualizar a la última versión
python scripts/migrate.py

# Crear una nueva migración
python scripts/migrate.py --create "descripción del cambio"

# Ver historial de migraciones
python scripts/migrate.py --history

# Volver a versión anterior
python scripts/migrate.py --downgrade -1
```

### Datos de prueba

El sistema carga datos de prueba automáticamente al iniciar. Estos datos solo se cargan si la base de datos está vacía.

#### Usuarios de prueba

El seed crea los siguientes usuarios por rol para pruebas:

| Rol             | Email               | Auth ID             | Nombre            |
|-----------------|---------------------|---------------------|-------------------|
| admin           | admin@ingsistemas.gt   | supabase-auth-id-1  | Admin Usuario     |
| developer       | dev@ingsistemas.gt     | supabase-auth-id-2  | Desarrollador Ejemplo |
| product_owner   | pm@ingsistemas.gt      | supabase-auth-id-3  | Project Manager   |
| member          | member@ingsistemas.gt  | supabase-auth-id-4  | Miembro Regular   |

Todos estos usuarios se crean con IDs de autenticación simulados que deben ser reemplazados por IDs reales si se usa Supabase para autenticación.

#### Credenciales para Supabase

Al crear estos usuarios en Supabase, utilice las siguientes contraseñas para cada rol:

| Rol             | Email                 | Contraseña       |
|-----------------|----------------------|------------------|
| admin           | admin@ingsistemas.gt    | Admin2025!      |
| developer       | dev@ingsistemas.gt      | Developer2025!  |
| product_owner   | pm@ingsistemas.gt       | Manager2025!    |
| member          | member@ingsistemas.gt   | Member2025!     |

> **Nota**: Estas contraseñas son solo para entornos de desarrollo. En un entorno de producción, utilice contraseñas seguras y únicas.

## Autenticación con Supabase

La autenticación está integrada con Supabase. Para configurarla:

1. Crea un proyecto en Supabase y configura la autenticación por email
2. Copia la URL y API Key en las variables de entorno
3. Los usuarios autenticados serán vinculados con perfiles en `user_profiles`

## Variables de entorno

Crea un archivo `.env` en la raíz:

```
# Base de datos
DATABASE_URL=postgresql+asyncpg://agileuser:agilepassword@db:5432/agiledb

# Supabase (obligatorio para autenticación)
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Configuración
SECRET_KEY=clave_secreta_para_jwt
LOAD_TEST_DATA=true  # solo en desarrollo
```

## Requisitos

- Python 3.11+
- Pip

## Instalación

1. Clonar el repositorio
2. Crear un entorno virtual:
   ```
   python -m venv venv
   ```
3. Activar el entorno virtual:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Instalar dependencias:
   ```
   pip install -r requirements.txt
   ```
5. Copiar `.env.example` a `.env` y configurar las variables de entorno:
   ```
   cp .env.example .env
   ```

## Uso

### Ejecutar en desarrollo

```
uvicorn app.main:app --reload
```

La API estará disponible en http://localhost:8000

### Documentación

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Docker

Para ejecutar con Docker:

```
docker build -t server-app .
docker run -p 8000:8000 server-app
```

Para ejecutar con Podman:

```
podman build -t server-app .
podman run -p 8000:8000 server-app
```

## Estructura del Proyecto

```
app/
├── core/          # Configuraciones y utilidades core
├── database/      # Configuración de la base de datos
├── models/        # Modelos SQLAlchemy
├── routers/       # Endpoints de la API
├── schemas/       # Esquemas Pydantic
└── main.py        # Punto de entrada de la aplicación
``` 