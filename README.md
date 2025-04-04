# Sistema de Control y Gestión de Proyectos Ágiles

Sistema completo para la gestión de proyectos ágiles con metodologías modernas, compuesto por un cliente web (frontend), una API REST (backend) y una base de datos PostgreSQL.

## Requisitos previos

- **Podman** (recomendado v4.0+)
- Node.js 18+ (solo para desarrollo)
- Python 3.11+ (solo para desarrollo)

## Estructura del proyecto

```
├── apps/
│   ├── client/          # Frontend con React
│   └── server/          # Backend con FastAPI
├── infra/
│   ├── podman/          # Configuración de contenedores
│   └── scripts/         # Scripts de utilidad
├── podman-run.sh        # Script principal para ejecutar con Podman
└── compose.sh           # Script legacy (usa podman-run.sh)
```

## Inicio rápido

La forma más sencilla de ejecutar la aplicación es usando el script `podman-run.sh`:

```bash
# Iniciar todos los servicios (frontend, backend, base de datos)
./podman-run.sh
```

La aplicación estará disponible en:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (documentación OpenAPI/Swagger)

> **Nota para usuarios de macOS/Windows**: En algunos casos, necesitarás usar la IP de la máquina virtual de Podman en lugar de localhost. El script te mostrará la URL correcta.

## Comandos útiles

### Gestión de contenedores

```bash
# Ver contenedores en ejecución
podman ps

# Detener todos los servicios
podman stop client server db

# Eliminar todos los contenedores
podman rm client server db
```

### Logs y depuración

```bash
# Ver logs de cada servicio
podman logs client
podman logs server
podman logs db

# Acceso a shell dentro de los contenedores
podman exec -it client sh
podman exec -it server sh
podman exec -it db bash
```

### Construcción manual

```bash
# Construir imágenes individualmente
podman build -t client ./apps/client
podman build -t server ./apps/server

# Ejecutar contenedores individualmente
podman run -d --name server -p 8000:8000 server
podman run -d --name client -p 3000:3000 client
```

## Configuración

1. Crea un archivo `.env` en el directorio `infra/podman/` basado en el archivo `.env.example`:

```bash
cp infra/podman/.env.example infra/podman/.env
```

2. Edita el archivo `.env` para configurar variables de entorno como contraseñas y claves secretas.

## Desarrollo

### Backend (FastAPI)

El backend está construido con FastAPI y expone:
- API RESTful con autenticación JWT
- Documentación automática con Swagger/OpenAPI
- Conexión a PostgreSQL mediante SQLAlchemy

Para desarrollo local del backend:

```bash
cd apps/server
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (React)

El frontend está construido con React y se comunica con el backend mediante API REST.

Para desarrollo local del frontend:

```bash
cd apps/client
npm install
npm run dev
```

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