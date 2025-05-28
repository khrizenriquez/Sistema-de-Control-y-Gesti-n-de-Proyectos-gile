# Sistema de Control y Gestión de Proyectos Ágiles

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/khrizenriquez/Sistema-de-Control-y-Gesti-n-de-Proyectos-gile)

Sistema completo para la gestión de proyectos ágiles con metodologías modernas, compuesto por un cliente web (frontend), una API REST (backend) y una base de datos PostgreSQL.

## Documentación Avanzada

Puedes encontrar documentación detallada del proyecto en DeepWiki, donde se explican a profundidad los componentes, arquitectura y flujos del sistema:
[DeepWiki - Sistema de Control y Gestión de Proyectos Ágiles](https://deepwiki.com/khrizenriquez/Sistema-de-Control-y-Gesti-n-de-Proyectos-gile)

La documentación incluye:
- Visión general del proyecto
- Arquitectura del sistema
- Configuración del entorno
- Estructura del frontend y backend
- Modelos de base de datos
- Endpoints de la API
- Sistema de autenticación
- Flujo de desarrollo

## Reglas de Permisos para Tableros

El sistema implementa un conjunto de reglas específicas para la creación y gestión de tableros:

### Roles de Usuario

- **Administradores**: Pueden ver todos los tableros creados por los Product Managers que fueron registrados por ellos. Tienen acceso completo al sistema.
- **Product Managers (PM)**: Son los únicos que pueden crear tableros. Solo pueden ver y administrar los tableros que ellos mismos han creado.
- **Desarrolladores/Miembros**: Pueden ver y trabajar en los tableros a los que han sido asignados por un PM o Admin.

### Flujo de Creación y Asignación

1. Los **Product Managers** crean tableros para proyectos específicos.
2. Los **PM** pueden agregar miembros a sus tableros, limitándose a usuarios creados por el mismo Admin que creó al PM.
3. Los **Administradores** pueden ver todos los tableros creados por PMs que ellos registraron.
4. Los **Miembros/Desarrolladores** solo pueden ver y trabajar en tableros a los que fueron explícitamente asignados.

### Interfaces

- `/boards/new`: Interfaz de creación de tableros (exclusiva para PMs)
- `/boards`: Listado de tableros (filtrado según rol del usuario)
- `/boards/board-id`: Vista individual de un tablero

## Requisitos previos

- **Podman** (recomendado v4.0+)
- Node.js 18+ (solo para desarrollo directo)
- Python 3.11+ (solo para desarrollo directo)

## Estructura del proyecto

```
├── apps/
│   ├── client/          # Frontend con Preact
│   └── server/          # Backend con FastAPI
├── infra/
│   ├── podman/          # Configuración adicional de contenedores
│   └── scripts/         # Scripts de utilidad
└── start-environment.sh # Script para ejecutar con Podman
```

## Inicio rápido

```bash
# Dar permisos de ejecución al script
chmod +x ./start-environment.sh

# Iniciar todos los servicios (frontend, backend, base de datos)
./start-environment.sh
```

El script acepta las siguientes opciones:

- `--build`: Reconstruye las imágenes de los contenedores antes de iniciarlos
- `--dev`: Inicia el cliente en modo desarrollo con volúmenes montados para actualización en tiempo real
- `--no-pgadmin`: Inicia el entorno sin el contenedor de pgAdmin

Ejemplos:
```bash
# Reconstruir imágenes y luego iniciar
./start-environment.sh --build

# Iniciar en modo desarrollo (monta volúmenes para el cliente)
./start-environment.sh --dev

# Iniciar sin el contenedor de pgAdmin
./start-environment.sh --no-pgadmin

# Combinar opciones
./start-environment.sh --build --dev
./start-environment.sh --build --no-pgadmin
./start-environment.sh --dev --no-pgadmin
./start-environment.sh --build --dev --no-pgadmin
```

## Modos de ejecución

### Modo normal (producción)

```bash
./start-environment.sh
```

Este modo:
- Usa imágenes existentes sin reconstruirlas
- El código del cliente se ejecuta desde dentro de la imagen Docker
- No se montan volúmenes del host al contenedor
- Los cambios en archivos locales no se reflejan hasta reconstruir la imagen
- **Ventajas**: Inicio rápido, ideal para probar o ejecutar el sistema en producción
- **Mejor para**: Demostraciones, pruebas finales o despliegue

### Modo desarrollo

```bash
./start-environment.sh --build --dev
```

Este modo:
- Reconstruye todas las imágenes antes de iniciarlas
- Monta directorios locales (`src/`, `public/`, `index.html`) dentro del contenedor
- Permite desarrollo en tiempo real con hot-reloading
- Los cambios en el código se reflejan inmediatamente sin reconstruir
- **Ventajas**: Desarrollo ágil y fluido con feedback inmediato
- **Mejor para**: Desarrollo activo, pruebas iterativas, depuración

> **Recomendación**: Para desarrollo diario usa el modo desarrollo. Cuando necesites probar el sistema completo en condiciones similares a producción, usa el modo normal.

## Arquitectura de la aplicación

![Arquitectura de la aplicación](https://github.com/user-attachments/assets/5916abdb-f9a3-48cf-b8b9-aba97784a27f)

## Persistencia de Datos

El sistema utiliza volúmenes de Docker/Podman para asegurar la persistencia de los datos, incluso cuando los contenedores se reinician o se detienen:

- **postgres-data**: Almacena todos los datos de la base de datos PostgreSQL, garantizando que los proyectos, tableros y demás información persistan entre sesiones.
- **server-data**: Guarda datos del servidor como archivos subidos o configuraciones locales.

### Inicialización y Seeders

La base de datos se inicializa utilizando un sistema de seeders en Python en lugar de scripts SQL puros. Esto proporciona varias ventajas:

1. Mayor flexibilidad para la creación de datos iniciales
2. Uso del ORM (SQLModel) para mantener consistencia con el resto del código
3. Mejor manejo de relaciones complejas entre entidades
4. Actualizaciones automáticas cuando cambian los modelos de datos

Para controlar la inicialización, puede utilizar la variable de entorno `INITIALIZE_DB=true` en el servicio del servidor.

### Respaldo y Restauración de la Base de Datos

Para mayor seguridad, se incluyen scripts para respaldar y restaurar la base de datos:

```bash
# Crear un respaldo de la base de datos
./infra/podman/backup-db.sh

# Restaurar desde un respaldo
./infra/podman/restore-db.sh ./infra/podman/backups/agiledb_backup_20231215_120000.sql.gz
```

Estos scripts garantizan que pueda recuperar sus datos en caso de problemas o transferirlos entre entornos.

## Acceso a la aplicación

La aplicación estará disponible en:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (documentación OpenAPI/Swagger)
- **pgAdmin**: http://localhost:5050 (administración de la base de datos)

### Contenedores del proyecto

Al ejecutar el proyecto con éxito, deberías ver los siguientes contenedores en ejecución:

![Contenedores del proyecto](https://github.com/user-attachments/assets/caebe691-ad39-4724-8368-d6db63bb240c)

Como se muestra en la imagen, el sistema se compone de 3-4 contenedores principales:
- **client**: Frontend en Preact (puerto 3000)
- **server**: Backend en FastAPI (puerto 8000)
- **db**: Base de datos PostgreSQL (puerto 5432)
- **pgadmin**: Administrador de PostgreSQL (puerto 5050) - *opcional si se usa `--no-pgadmin`*

### Credenciales de pgAdmin

- **Email**: admin@example.com
- **Password**: admin

Para conectarse a la base de datos desde pgAdmin:
- **Nombre**: agiledb (o cualquier nombre descriptivo)
- **Host**: db
- **Port**: 5432
- **Database**: agiledb
- **Username**: agileuser
- **Password**: agilepassword

### Usuarios de prueba para Supabase

Para iniciar sesión en la aplicación, se han configurado los siguientes usuarios de prueba:

| Rol             | Email                | Contraseña      |
|-----------------|---------------------|-----------------|
| admin           | admin@ingsistemas.gt   | Admin2025!      |
| developer       | dev@ingsistemas.gt     | Developer2025!  |
| product_owner   | pm@ingsistemas.gt      | Manager2025!    |
| member          | member@ingsistemas.gt  | Member2025!     |

Estos usuarios deben crearse en Supabase siguiendo las instrucciones en `apps/server/SUPABASE_SETUP.md`.

## Comandos útiles

### Gestión de contenedores

```bash
# Ver contenedores en ejecución
podman ps

# Detener todos los servicios manualmente
podman stop client server db pgadmin
podman rm client server db pgadmin
```

### Logs y depuración

```bash
# Ver logs de cada servicio
podman logs client
podman logs server
podman logs db
podman logs pgadmin

# Acceso a shell dentro de los contenedores
podman exec -it client sh
podman exec -it server sh
podman exec -it db bash
```

## Configuración

El sistema utiliza varias variables de entorno que pueden configurarse:

### Para el servidor

- `DATABASE_URL`: URL de conexión a PostgreSQL
- `SECRET_KEY`: Clave secreta para seguridad
- `LOAD_TEST_DATA`: Si se cargan datos de prueba en la BD ("true"/"false")

### Para el cliente

- `VITE_API_URL`: URL base del API backend (por defecto http://localhost:8000)

## Desarrollo

### Backend (FastAPI)

El backend está construido con FastAPI y SQLModel:
- API RESTful con autenticación JWT
- Documentación automática con Swagger/OpenAPI
- Conexión a PostgreSQL mediante SQLModel
- Modelos de datos unificados (ORM + validación)

Para desarrollo local del backend (sin contenedores):

```bash
cd apps/server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (Preact)

El frontend está construido con Preact y se comunica con el backend mediante API REST.

Para desarrollo local del frontend (sin contenedores):

```bash
cd apps/client
npm install
npm run dev
```

### Base de datos

El sistema utiliza PostgreSQL como base de datos y proporciona:
- pgAdmin para administración visual
- Modelos SQLModel para gestión de datos
- Inicialización automática de esquema
- Datos de prueba para desarrollo

Para acceder a pgAdmin:
1. Abre http://localhost:5050 en tu navegador
2. Inicia sesión con las credenciales mencionadas anteriormente
3. Conecta a la base de datos usando los parámetros indicados en la sección de credenciales

## Solución de problemas comunes

### Problemas con Podman en macOS

Si encuentras problemas con `gateway.containers.internal` en macOS:

```bash
# Reiniciar máquina Podman
podman machine stop
podman machine start

# Ver la IP de la máquina Podman
podman machine inspect | grep -A 10 ConnectionInfo
```

### Acceso a los servicios

Si no puedes acceder a los servicios usando localhost, intenta usar:
- La IP de la máquina Podman (mostrada por el script)
- `podman-machine` si lo has configurado en `/etc/hosts`

## Licencia

MIT