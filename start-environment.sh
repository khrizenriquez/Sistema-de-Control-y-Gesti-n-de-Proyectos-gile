#!/bin/bash

# Script para iniciar todo el entorno de desarrollo
# Este script construye (si es necesario) e inicia todos los contenedores

# Colores para mensajes
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Función para imprimir mensajes
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que podman está instalado
if ! command -v podman &> /dev/null; then
  print_error "Podman no está instalado. Por favor instala podman para continuar."
  exit 1
fi

# Detener y eliminar contenedores existentes
print_message "Deteniendo contenedores existentes..."
podman rm -f db pgadmin server client 2>/dev/null || true

# Crear la red si no existe
print_message "Creando red de contenedores..."
podman network create agile-network 2>/dev/null || true

# Configuración de variables
DB_PASSWORD=${DB_PASSWORD:-agilepassword}
PGADMIN_EMAIL=${PGADMIN_EMAIL:-admin@example.com}
PGADMIN_PASSWORD=${PGADMIN_PASSWORD:-admin}

# Construir imágenes si el flag --build está presente
if [[ "$*" == *"--build"* ]]; then
  print_message "Construyendo imagen del servidor..."
  cd apps/server && podman build -t server-app . && cd ../../
  
  print_message "Construyendo imagen del cliente..."
  cd apps/client && podman build -t client-dev -f Dockerfile.dev . && cd ../../
fi

# Iniciar contenedor de base de datos
print_message "Iniciando base de datos PostgreSQL..."
podman run -d \
  --name db \
  --network=agile-network \
  -e POSTGRES_USER=agileuser \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -e POSTGRES_DB=agiledb \
  -p 5432:5432 \
  postgres:15-alpine

# Esperar a que la base de datos esté lista
print_message "Esperando a que la base de datos esté lista..."
sleep 5

# Iniciar pgAdmin
print_message "Iniciando pgAdmin..."
podman run -d \
  --name pgadmin \
  --network=agile-network \
  -e PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL} \
  -e PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD} \
  -p 5050:80 \
  dpage/pgadmin4

# Iniciar servidor
print_message "Iniciando servidor backend..."
podman run -d \
  --name server \
  -p 8000:8000 \
  --network=agile-network \
  -e DATABASE_URL=postgresql+asyncpg://agileuser:${DB_PASSWORD}@db:5432/agiledb \
  localhost/server-app:latest

# Iniciar cliente
print_message "Iniciando cliente frontend..."
if [[ "$*" == *"--dev"* ]]; then
  # Modo desarrollo con volúmenes montados
  print_message "Iniciando cliente en modo desarrollo con volúmenes montados..."
  podman run -d \
    --name client \
    -p 3000:5173 \
    --network=agile-network \
    -v "$(pwd)/apps/client/src:/app/src" \
    -v "$(pwd)/apps/client/public:/app/public" \
    -v "$(pwd)/apps/client/index.html:/app/index.html" \
    -v "$(pwd)/apps/client/.env:/app/.env" \
    localhost/client-dev:latest

  # Verificar que el archivo .env está disponible dentro del contenedor
  if ! podman exec client test -f /app/.env; then
    print_warning "Archivo .env no encontrado en el contenedor. Copiando desde el host..."
    cat apps/client/.env | podman exec -i client sh -c 'cat > /app/.env'
    
    if podman exec client test -f /app/.env; then
      print_message "Archivo .env copiado correctamente al contenedor."
    else
      print_error "No se pudo copiar el archivo .env al contenedor."
    fi
  fi
else
  # Modo normal sin montar volúmenes
  podman run -d \
    --name client \
    -p 3000:5173 \
    --network=agile-network \
    localhost/client-dev:latest
fi

# Mostrar estado de los contenedores
print_message "Verificando estado de los contenedores..."
podman ps

# Mostrar información para conectarse
echo ""
print_message "🚀 Entorno listo! Los servicios están disponibles en:"
echo "  📊 Backend API: http://localhost:8000"
echo "  🖥️ Frontend: http://localhost:3000"
echo "  🛢️ pgAdmin: http://localhost:5050"
echo ""
print_message "Usuarios de prueba disponibles:"
echo "  👤 Admin: admin@example.com (rol: admin)"
echo "  👤 Developer: dev@example.com (rol: developer)"
echo "  👤 Product Owner: pm@example.com (rol: product_owner)"
echo "  👤 Member: member@example.com (rol: member)"
echo ""
print_message "Para ver los logs de un contenedor ejecutar: podman logs <container-name>"
echo "  Ejemplo: podman logs server"
echo ""
print_message "Para detener todos los contenedores ejecutar: podman rm -f db pgadmin server client"
echo ""

# Verificar si todos los contenedores están en ejecución
if podman ps | grep -q "server" && podman ps | grep -q "client" && podman ps | grep -q "db"; then
  print_message "✅ Todos los servicios están en ejecución."
else
  print_warning "⚠️ Alguno de los servicios no se inició correctamente. Revisa los logs para más detalles."
fi 