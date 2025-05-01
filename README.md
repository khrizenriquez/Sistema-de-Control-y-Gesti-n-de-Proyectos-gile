# Sistema de Control y Gestión de Proyectos Ágiles

Sistema completo para la gestión de proyectos ágiles con metodologías modernas, compuesto por un cliente web (frontend), una API REST (backend) y una base de datos PostgreSQL.

## Requisitos previos

- **Podman** (recomendado v4.0+)
- Node.js 18+ (solo para desarrollo)
- Python 3.11+ (solo para desarrollo)

## Estructura del proyecto

```
├── apps/
│   ├── client/          # Frontend con Preact
│   └── server/          # Backend con FastAPI
├── infra/
│   ├── podman/          # Configuración de contenedores
│   └── scripts/         # Scripts de utilidad
└── start-environment.sh # Script principal para ejecutar con Podman
```

## Inicio rápido

La forma más sencilla de ejecutar la aplicación es usando el script `start-environment.sh`:

```bash
# Dar permisos de ejecución al script
chmod +x ./start-environment.sh

# Iniciar todos los servicios (frontend, backend, base de datos)
./start-environment.sh
```

El script acepta las siguientes opciones:

- `--build`: Reconstruye las imágenes de los contenedores antes de iniciarlos
- `--dev`: Inicia el cliente en modo desarrollo con volúmenes montados para actualización en tiempo real

Ejemplos:
```bash
# Iniciar normalmente
./start-environment.sh

# Reconstruir imágenes y luego iniciar
./start-environment.sh --build

# Iniciar en modo desarrollo (monta volúmenes para el cliente)
./start-environment.sh --dev

# Combinar opciones
./start-environment.sh --build --dev
```

La aplicación estará disponible en:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (documentación OpenAPI/Swagger)
- **pgAdmin**: http://localhost:5050 (administración de la base de datos)

> **Nota para usuarios de macOS/Windows**: En algunos casos, necesitarás usar la IP de la máquina virtual de Podman en lugar de localhost. El script te mostrará la URL correcta.

## Comandos útiles

### Gestión de contenedores

```bash
# Ver contenedores en ejecución
podman ps

# Detener todos los servicios
podman stop client server db pgadmin

# Eliminar todos los contenedores
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

### Construcción manual

```bash
# Construir imágenes individualmente
podman build -t client ./apps/client
podman build -t client-dev -f ./apps/client/Dockerfile.dev ./apps/client
podman build -t server ./apps/server

# Ejecutar contenedores individualmente
podman run -d --name server -p 8000:8000 server
podman run -d --name client -p 3000:3000 client
```

## Configuración

El sistema utiliza varias variables de entorno que pueden configurarse:

### Variables para el servidor

- `DATABASE_URL`: URL de conexión a PostgreSQL
- `SECRET_KEY`: Clave secreta para seguridad
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_KEY`: Clave API de Supabase
- `LOAD_TEST_DATA`: Si se cargan datos de prueba en la BD ("true"/"false")

### Archivos de entorno (.env)

Se recomienda crear manualmente los archivos `.env` en los directorios `/apps/server` y `/apps/client` siguiendo la estructura de los archivos `.env.example`. Esto asegura que no se sobrescriban configuraciones personalizadas.

Para generar una clave secreta segura para `SECRET_KEY`, puedes usar:
```bash
openssl rand -hex 32
```

### Variables para el cliente

- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY`: Clave anónima de API de Supabase
- `VITE_API_URL`: URL base del API backend (por defecto http://localhost:8000)

## Desarrollo

### Backend (FastAPI)

El backend está construido con FastAPI y SQLModel:
- API RESTful con autenticación JWT o Supabase
- Documentación automática con Swagger/OpenAPI
- Conexión a PostgreSQL mediante SQLModel
- Modelos de datos unificados (ORM + validación)

Para desarrollo local del backend:

```bash
cd apps/server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (Preact)

El frontend está construido con Preact y se comunica con el backend mediante API REST.

Para desarrollo local del frontend:

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
2. Usa las credenciales proporcionadas por el script
3. Crea una nueva conexión al servidor usando la información mostrada

## Integración con Supabase

El sistema está preparado para utilizar Supabase como sistema de autenticación:

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Habilita la autenticación con email/password u OAuth
3. Obtén la URL y API Key de tu proyecto
4. Proporciona estos datos al ejecutar `podman-run.sh`

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