# Sistema de Control y Gestión de Proyectos Ágiles

Este es un sistema completo para la gestión de proyectos ágiles, compuesto por un cliente web (frontend) y un API REST (backend).

## Requisitos previos

- Podman o Docker
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
└── compose.sh           # Script para gestionar los contenedores
```

## Inicio rápido con contenedores

La forma más sencilla de ejecutar la aplicación es usando el script `compose.sh`:

```bash
# Iniciar todos los servicios
./compose.sh up

# Iniciar solo un servicio específico
./compose.sh up client
./compose.sh up server
./compose.sh up db

# Detener todos los servicios
./compose.sh down

# Ver logs
./compose.sh logs
./compose.sh logs server

# Ejecutar comandos dentro de un contenedor
./compose.sh exec server bash
```

## Configuración

1. Crea un archivo `.env` en el directorio `infra/podman/` basado en el archivo `.env.example`:

```bash
cp infra/podman/.env.example infra/podman/.env
```

2. Edita el archivo `.env` para configurar variables de entorno como contraseñas y claves secretas.

## Desarrollo

Para desarrollo local sin contenedores, consulta los README específicos de cada componente:

- [README del Frontend](apps/client/README.md)
- [README del Backend](apps/server/README.md)

## Licencia

MIT