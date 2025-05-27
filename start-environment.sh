#!/bin/bash

# Script para iniciar todo el entorno de desarrollo
# Este script construye (si es necesario) e inicia todos los contenedores

# Colores para mensajes
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

# Flags para opciones
BUILD=false
DEV=false
NO_PGADMIN=false
RESET_DB=false

# Procesar argumentos
for arg in "$@"; do
  case $arg in
    --build)
      BUILD=true
      ;;
    --dev)
      DEV=true
      ;;
    --no-pgadmin)
      NO_PGADMIN=true
      ;;
    --reset-db)
      RESET_DB=true
      ;;
  esac
done

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

# Detener contenedores existentes
print_message "Deteniendo contenedores existentes..."
podman stop db pgadmin server client 2>/dev/null || true

# Solo eliminar el volumen de la base de datos si se especifica --reset-db
if [ "$RESET_DB" = true ]; then
  print_warning "¡Opción --reset-db detectada! Se eliminará la base de datos y todos los datos"
  # Eliminar contenedor de base de datos
  podman rm -f db 2>/dev/null || true
  # Eliminar volumen de datos PostgreSQL
  podman volume rm postgres-data 2>/dev/null || true
  print_message "Volumen de base de datos eliminado, los datos se reiniciarán"
else
  # Solo eliminar el contenedor pero conservar el volumen
  podman rm db 2>/dev/null || true
  print_message "Conservando el volumen postgres-data para mantener los datos existentes"
fi

# Eliminar los demás contenedores
podman rm pgadmin server client 2>/dev/null || true

# Crear la red si no existe
print_message "Creando red de contenedores..."
podman network create agile-network 2>/dev/null || true

# Configuración de variables
DB_PASSWORD=${DB_PASSWORD:-agilepassword}
PGADMIN_EMAIL=${PGADMIN_EMAIL:-admin@example.com}
PGADMIN_PASSWORD=${PGADMIN_PASSWORD:-admin}

# Construir imágenes si el flag --build está presente
if [ "$BUILD" = true ]; then
  print_message "Construyendo imagen del servidor..."
  cd apps/server && podman build -t server-app . && cd ../../
  
  print_message "Construyendo imagen del cliente..."
  cd apps/client && podman build -t client-dev -f Dockerfile.dev . && cd ../../
fi

# Iniciar contenedor de base de datos
print_message "Iniciando base de datos PostgreSQL..."
podman run -d \
  --name db \
  --restart=unless-stopped \
  --network=agile-network \
  -e POSTGRES_USER=agileuser \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -e POSTGRES_DB=agiledb \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  docker.io/library/postgres:15-alpine

# Esperar a que la base de datos esté lista
print_message "Esperando a que la base de datos esté lista..."
sleep 10  # Aumentamos el tiempo de espera para mayor estabilidad

# Asegurar que los roles de usuario estén correctamente configurados
print_message "Asegurando roles de usuario correctos..."
podman exec -i db psql -U agileuser -d agiledb < apps/server/scripts/update_roles.sql >/dev/null 2>&1 || true

# Iniciar pgAdmin solo si no se especifica --no-pgadmin
if [ "$NO_PGADMIN" = false ]; then
  print_message "Iniciando pgAdmin..."
  podman run -d \
    --name pgadmin \
    --restart=unless-stopped \
    --network=agile-network \
    -e PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL} \
    -e PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD} \
    -p 5050:80 \
    docker.io/dpage/pgadmin4
else
  print_message "Opción --no-pgadmin detectada, omitiendo pgAdmin..."
fi

# Iniciar servidor
print_message "Iniciando servidor backend..."
podman run -d \
  --name server \
  --restart=unless-stopped \
  -p 8000:8000 \
  --network=agile-network \
  -e DATABASE_URL=postgresql+asyncpg://agileuser:${DB_PASSWORD}@db:5432/agiledb \
  -e INITIALIZE_DB=true \
  -e SUPABASE_URL=${SUPABASE_URL:-""} \
  -e SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY:-""} \
  localhost/server-app:latest

# Esperar a que el servidor esté listo
print_message "Esperando a que el servidor esté listo..."
sleep 10  # Aumentamos el tiempo de espera para mayor estabilidad

# Ejecutar script de sincronización de roles
print_message "Ejecutando script de sincronización de roles..."
podman exec server python /app/scripts/sync_supabase_roles.py || true

# Crear proyectos de demostración si no existen
print_message "Creando proyectos de demostración si es necesario..."
podman exec server python /app/scripts/create_demo_project.py || true

# Iniciar cliente
print_message "Iniciando cliente frontend..."
if [ "$DEV" = true ]; then
  # Modo desarrollo con volúmenes montados
  print_message "Iniciando cliente en modo desarrollo con volúmenes montados..."
  podman run -d \
    --name client \
    --restart=unless-stopped \
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
    --restart=unless-stopped \
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
if [ "$NO_PGADMIN" = false ]; then
  echo "  🛢️ pgAdmin: http://localhost:5050"
fi
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
print_message "Para eliminar todos los datos y reiniciar la base de datos, use: ./start-environment.sh --reset-db"
echo ""

# Modificar verificación para considerar que pgAdmin podría no estar presente
services_running=true
missing_services=""

if ! podman ps | grep -q "server"; then 
  services_running=false
  missing_services="server $missing_services"
fi

if ! podman ps | grep -q "client"; then
  services_running=false
  missing_services="client $missing_services"
fi

if ! podman ps | grep -q "db"; then
  services_running=false
  missing_services="db $missing_services"
fi

if [ "$NO_PGADMIN" = false ]; then
  if ! podman ps | grep -q "pgadmin"; then
    services_running=false
    missing_services="pgadmin $missing_services"
  fi
fi

if [ "$services_running" = true ]; then
  print_message "✅ Todos los servicios solicitados están en ejecución."
else
  print_warning "⚠️ Los siguientes servicios no se iniciaron correctamente: ${missing_services}"
  print_warning "Revisa los logs para más detalles (podman logs <nombre-servicio>)."
fi 