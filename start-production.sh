#!/bin/bash

# Script para iniciar el entorno en PRODUCCIÓN con máxima estabilidad
# Optimizado para Digital Ocean y otros proveedores cloud

# Colores para mensajes
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m" # No Color

# Flags para opciones
BUILD=false
RESET_DB=false
MONITORING=true

# Procesar argumentos
for arg in "$@"; do
  case $arg in
    --build)
      BUILD=true
      ;;
    --reset-db)
      RESET_DB=true
      ;;
    --no-monitoring)
      MONITORING=false
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

print_step() {
  echo -e "${BLUE}[STEP]${NC} $1"
}

# Verificar que podman está instalado
if ! command -v podman &> /dev/null; then
  print_error "Podman no está instalado. Por favor instala podman para continuar."
  exit 1
fi

# Verificar recursos del sistema
print_step "Verificando recursos del sistema..."
total_memory=$(free -m | awk 'NR==2{printf "%.0f", $2}')
available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
disk_space=$(df -h / | awk 'NR==2{print $4}')

print_message "Memoria total: ${total_memory}MB"
print_message "Memoria disponible: ${available_memory}MB"
print_message "Espacio en disco disponible: ${disk_space}"

if [ "$available_memory" -lt 1024 ]; then
  print_warning "⚠️ Memoria disponible baja (${available_memory}MB). Se recomienda al menos 1GB libre."
fi

# Detener contenedores existentes
print_step "Deteniendo contenedores existentes..."
podman stop db pgadmin server client 2>/dev/null || true

# Manejo de base de datos
if [ "$RESET_DB" = true ]; then
  print_warning "¡Opción --reset-db detectada! Se eliminará la base de datos y todos los datos"
  podman rm -f db 2>/dev/null || true
  podman volume rm postgres-data 2>/dev/null || true
  print_message "Volumen de base de datos eliminado, los datos se reiniciarán"
else
  podman rm db 2>/dev/null || true
  print_message "Conservando el volumen postgres-data para mantener los datos existentes"
fi

# Eliminar los demás contenedores
podman rm pgadmin server client 2>/dev/null || true

# Crear la red si no existe
print_step "Configurando red de contenedores..."
podman network create agile-network 2>/dev/null || true

# Configuración de variables para producción
DB_PASSWORD=${DB_PASSWORD:-$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)}
PGADMIN_EMAIL=${PGADMIN_EMAIL:-admin@example.com}
PGADMIN_PASSWORD=${PGADMIN_PASSWORD:-$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)}

print_message "Configuración de base de datos establecida"

# Construir imágenes si el flag --build está presente
if [ "$BUILD" = true ]; then
  print_step "Construyendo imágenes optimizadas para producción..."
  
  print_message "Construyendo imagen del servidor..."
  cd apps/server && podman build -t server-app . && cd ../../
  
  print_message "Construyendo imagen del cliente..."
  cd apps/client && podman build -t client-app -f Dockerfile . && cd ../../
fi

# Iniciar contenedor de base de datos con límites de recursos optimizados para 1GB RAM
print_step "Iniciando base de datos PostgreSQL con configuración de producción..."
podman run -d \
  --name db \
  --restart=unless-stopped \
  --network=agile-network \
  --memory=256m \
  --memory-swap=512m \
  --cpus=0.5 \
  -e POSTGRES_USER=agileuser \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -e POSTGRES_DB=agiledb \
  -e POSTGRES_SHARED_PRELOAD_LIBRARIES=pg_stat_statements \
  -e POSTGRES_MAX_CONNECTIONS=50 \
  -e POSTGRES_SHARED_BUFFERS=64MB \
  -e POSTGRES_EFFECTIVE_CACHE_SIZE=128MB \
  -p 5432:5432 \
  -v postgres-data:/var/lib/postgresql/data \
  docker.io/library/postgres:15-alpine

# Esperar a que la base de datos esté lista con verificación
print_message "Esperando a que la base de datos esté lista..."
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if podman exec db pg_isready -U agileuser -d agiledb >/dev/null 2>&1; then
    print_message "✅ Base de datos lista después de $((attempt + 1)) intentos"
    break
  fi
  attempt=$((attempt + 1))
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  print_error "❌ La base de datos no respondió después de ${max_attempts} intentos"
  exit 1
fi

# Configurar roles de usuario
print_message "Configurando roles de usuario..."
podman exec -i db psql -U agileuser -d agiledb < apps/server/scripts/update_roles.sql >/dev/null 2>&1 || true

# Iniciar servidor con límites de recursos optimizados para 1GB RAM
print_step "Iniciando servidor backend con configuración de producción..."
podman run -d \
  --name server \
  --restart=unless-stopped \
  --memory=384m \
  --memory-swap=512m \
  --cpus=1.0 \
  -p 8000:8000 \
  --network=agile-network \
  -e DATABASE_URL=postgresql+asyncpg://agileuser:${DB_PASSWORD}@db:5432/agiledb \
  -e INITIALIZE_DB=true \
  -e SUPABASE_URL=${SUPABASE_URL:-""} \
  -e SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY:-""} \
  -e ENVIRONMENT=production \
  localhost/server-app:latest

# Esperar a que el servidor esté listo con verificación
print_message "Esperando a que el servidor esté listo..."
max_attempts=20
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    print_message "✅ Servidor listo después de $((attempt + 1)) intentos"
    break
  fi
  attempt=$((attempt + 1))
  sleep 3
done

if [ $attempt -eq $max_attempts ]; then
  print_warning "⚠️ El servidor no respondió en el endpoint de salud, pero continuamos..."
fi

# Ejecutar scripts de inicialización
print_message "Ejecutando scripts de inicialización..."
podman exec server python /app/scripts/sync_supabase_roles.py || true
podman exec server python /app/scripts/create_demo_project.py || true

# Iniciar cliente con configuración de producción optimizada para 1GB RAM
print_step "Iniciando cliente frontend con configuración de producción..."
podman run -d \
  --name client \
  --restart=unless-stopped \
  --memory=256m \
  --memory-swap=384m \
  --cpus=0.5 \
  -p 3000:5173 \
  --network=agile-network \
  localhost/client-app:latest

# Crear script de monitoreo si está habilitado
if [ "$MONITORING" = true ]; then
  print_step "Configurando script de monitoreo..."
  cat > monitor_containers.sh << 'EOF'
#!/bin/bash
# Script de monitoreo para contenedores
check_container() {
  local container_name=$1
  if ! podman ps | grep -q "$container_name"; then
    echo "$(date): Contenedor $container_name no está ejecutándose. Reiniciando..."
    podman start $container_name
    if [ $? -eq 0 ]; then
      echo "$(date): Contenedor $container_name reiniciado exitosamente"
    else
      echo "$(date): ERROR: No se pudo reiniciar el contenedor $container_name"
    fi
  fi
}

echo "$(date): Verificando estado de contenedores..."
check_container "db"
check_container "server"
check_container "client"
EOF

  chmod +x monitor_containers.sh
  print_message "Script de monitoreo creado en: ./monitor_containers.sh"
  print_message "Para monitoreo automático, añade esto al crontab:"
  print_message "*/5 * * * * /path/to/monitor_containers.sh >> /var/log/container_monitor.log 2>&1"
fi

# Mostrar estado final
print_step "Verificando estado final de los contenedores..."
sleep 5
podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Información final
echo ""
print_message "🚀 Entorno de PRODUCCIÓN listo! Los servicios están disponibles en:"
echo "  📊 Backend API: http://localhost:8000 (también en puerto 8000 de tu IP pública)"
echo "  🖥️ Frontend: http://localhost:3000 (también en puerto 3000 de tu IP pública)"
echo ""
print_message "🔐 Credenciales de acceso:"
echo "  🗃️ Base de datos: agileuser / [password configurado]"
echo ""
print_message "📊 Comandos útiles para producción:"
echo "  • Ver logs: podman logs -f <container-name>"
echo "  • Monitorear recursos: podman stats"
echo "  • Reiniciar servicio: podman restart <container-name>"
echo "  • Ver estado: podman ps"
echo ""
print_message "🔧 Políticas de reinicio configuradas:"
echo "  • Todos los contenedores se reiniciarán automáticamente si fallan"
echo "  • Para detener permanentemente: podman stop <container-name>"
echo "  • Para eliminar: podman rm <container-name>"
echo ""

# Verificación final de servicios
services_running=true
missing_services=""

for service in "server" "client" "db"; do
  if ! podman ps | grep -q "$service"; then
    services_running=false
    missing_services="$service $missing_services"
  fi
done

if [ "$services_running" = true ]; then
  print_message "✅ Todos los servicios están ejecutándose correctamente con políticas de reinicio activas."
  print_message "🎯 Tu aplicación debe estar disponible en: http://$(hostname -I | awk '{print $1}'):3000"
else
  print_warning "⚠️ Los siguientes servicios no se iniciaron correctamente: ${missing_services}"
  print_warning "Revisa los logs para más detalles: podman logs <nombre-servicio>"
fi

print_message "🔍 Para monitoreo continuo, ejecuta: watch -n 5 'podman ps --format \"table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\"'" 