#!/usr/bin/env bash
set -e

# Cargar variables de entorno si existen
SERVER_ENV_FILE="apps/server/.env"
CLIENT_ENV_FILE="apps/client/.env"

# Cargar variables del servidor
if [ -f "$SERVER_ENV_FILE" ]; then
  echo "Cargando variables de entorno del servidor desde $SERVER_ENV_FILE"
  source "$SERVER_ENV_FILE"
fi

# Cargar variables del cliente
if [ -f "$CLIENT_ENV_FILE" ]; then
  echo "Cargando variables de entorno del cliente desde $CLIENT_ENV_FILE"
  source "$CLIENT_ENV_FILE"
fi

# Detectar sistema operativo
IS_MAC_OR_WIN=false
if [[ "$(uname -s)" =~ ^(Darwin|MINGW|MSYS) ]]; then
  IS_MAC_OR_WIN=true
fi

# Iniciar máquina Podman si es necesario (macOS/Windows)
if $IS_MAC_OR_WIN && ! podman machine list | grep -q "Running"; then
  echo "Iniciando máquina virtual de Podman..."
  podman machine start || podman machine init && podman machine start
  sleep 3  # Breve espera para que la máquina esté lista
fi

# Detener y eliminar contenedores existentes
echo "Limpiando contenedores existentes..."
podman stop client server db pgadmin 2>/dev/null || true
podman rm client server db pgadmin 2>/dev/null || true

# Construir imágenes
echo "Construyendo imágenes..."

# Usar valor de la variable CLIENT_DEV_MODE si existe, de lo contrario preguntar
if [ -z "$CLIENT_DEV_MODE" ]; then
  echo "¿Deseas ejecutar el cliente en modo desarrollo? (s/n)"
  read -r DEV_MODE
else
  echo "Usando configuración CLIENT_DEV_MODE=$CLIENT_DEV_MODE"
  if [[ "$CLIENT_DEV_MODE" =~ ^(true|yes|y|s|si|1)$ ]]; then
    DEV_MODE="s"
  else
    DEV_MODE="n"
  fi
fi

if [[ "$DEV_MODE" =~ ^[Ss]$ ]]; then
  echo "Construyendo cliente en modo desarrollo..."
  podman build -t client-dev -f ./apps/client/Dockerfile.dev ./apps/client
else
  echo "Construyendo cliente en modo producción..."
  podman build -t client ./apps/client
fi

podman build -t server ./apps/server

# Crear red si no existe
if ! podman network ls | grep -q "agile-network"; then
  podman network create agile-network
fi

# Crear volúmenes si no existen
if ! podman volume ls | grep -q "postgres-data"; then
  podman volume create postgres-data
fi

if ! podman volume ls | grep -q "pgadmin-data"; then
  podman volume create pgadmin-data
fi

if [[ "$DEV_MODE" =~ ^[Ss]$ ]] && ! podman volume ls | grep -q "client-node-modules"; then
  podman volume create client-node-modules
fi

# Configurar variables con valores por defecto si no están en .env
: "${POSTGRES_USER:=agileuser}"
: "${POSTGRES_PASSWORD:=agilepassword}"
: "${POSTGRES_DB:=agiledb}"
: "${PGADMIN_EMAIL:=admin@admin.com}"
: "${PGADMIN_PASSWORD:=pgadminpwd}"
: "${SECRET_KEY:=temporary_secret_key_change_this_in_production}"
: "${LOAD_TEST_DATA:=true}"

# Supabase - usar valores de .env o preguntar si no existen
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "¿Deseas configurar Supabase para autenticación? (s/n)"
  read -r USE_SUPABASE

  if [[ "$USE_SUPABASE" =~ ^[Ss]$ ]]; then
    if [ -z "$SUPABASE_URL" ]; then
      echo "Ingresa la URL de Supabase:"
      read -r SUPABASE_URL
    fi
    
    if [ -z "$SUPABASE_KEY" ]; then
      echo "Ingresa la API Key de Supabase:"
      read -r SUPABASE_KEY
    fi
  fi
else
  echo "Usando configuración Supabase desde archivo .env"
fi

# Iniciar contenedores
echo "Iniciando contenedores..."

# Base de datos PostgreSQL
echo "Iniciando base de datos..."
podman run -d --name db \
  --network agile-network \
  -e POSTGRES_USER=${POSTGRES_USER} \
  -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} \
  -e POSTGRES_DB=${POSTGRES_DB} \
  -v postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# Iniciar pgAdmin
echo "Iniciando pgAdmin..."
podman run -d --name pgadmin \
  --network agile-network \
  -e PGADMIN_DEFAULT_EMAIL=${PGADMIN_EMAIL} \
  -e PGADMIN_DEFAULT_PASSWORD=${PGADMIN_PASSWORD} \
  -v pgadmin-data:/var/lib/pgadmin \
  -p 5050:80 \
  dpage/pgadmin4

# Ejecutar servidor (backend)
echo "Iniciando servidor..."
podman run -d --name server \
  --network agile-network \
  -e DATABASE_URL=${DATABASE_URL:-postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}} \
  -e SECRET_KEY=${SECRET_KEY} \
  -e SUPABASE_URL=${SUPABASE_URL} \
  -e SUPABASE_KEY=${SUPABASE_KEY} \
  -e LOAD_TEST_DATA=${LOAD_TEST_DATA} \
  -p 8000:8000 \
  server

# Ejecutar cliente (frontend)
if [[ "$DEV_MODE" =~ ^[Ss]$ ]]; then
  echo "Iniciando cliente en modo desarrollo..."
  podman run -d --name client \
    --network agile-network \
    -v "$(pwd)/apps/client:/app" \
    -v "client-node-modules:/app/node_modules" \
    -e VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-$SUPABASE_URL} \
    -e VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-$SUPABASE_KEY} \
    -e VITE_API_URL=${VITE_API_URL:-http://localhost:8000} \
    -p 3000:3000 \
    client-dev
else
  echo "Iniciando cliente en modo producción..."
  podman run -d --name client \
    --network agile-network \
    -p 3000:3000 \
    client
fi

# Mostrar información de acceso
echo "Contenedores iniciados:"
podman ps

# Mostrar URLs de acceso
if $IS_MAC_OR_WIN; then
  # En macOS/Windows, determinar la IP de la máquina Podman
  echo "Obteniendo IP de la máquina Podman..."
  
  # Diferentes métodos para obtener la IP de la máquina Podman según la versión
  PODMAN_IP=""
  
  # Método 1: podman machine inspect (versiones más recientes)
  PODMAN_IP=$(podman machine inspect --format '{{.NetworkSettings.IPAddress}}' 2>/dev/null || \
              podman machine inspect --format '{{.Host.NetworkSettings.IPAddress}}' 2>/dev/null || \
              podman machine inspect --format '{{.ConnectionInfo.URI}}' | sed 's|.*://\(.*\):[0-9]*|\1|' 2>/dev/null || \
              echo "")
  
  # Método 2: si el anterior falló, intentar con podman machine ls
  if [ -z "$PODMAN_IP" ]; then
    PODMAN_IP=$(podman machine ls --format "{{.Name}}  {{.URI}}" | grep "podman" | awk '{print $2}' | sed 's|.*://\(.*\):[0-9]*|\1|' 2>/dev/null || echo "")
  fi
  
  # Método 3: si los anteriores fallaron, usar el nombre de host por defecto
  if [ -z "$PODMAN_IP" ]; then
    echo "No se pudo determinar la IP automáticamente."
    PODMAN_IP="localhost"
    
    # Mostrar posibles direcciones
    echo "Posibles direcciones para conectarse:"
    echo "- localhost (para túneles SSH)"
    echo "- podman-machine (si está configurado en /etc/hosts)"
    echo "- 127.0.0.1 (loopback)"
  else
    echo "IP de la máquina Podman: $PODMAN_IP"
  fi
  
  echo ""
  echo "======================= ACCESO A LA APLICACIÓN ========================="
  echo "Accede a la aplicación en:"
  echo "- Frontend: http://$PODMAN_IP:3000"
  echo "- Backend:  http://$PODMAN_IP:8000"
  echo "- API Docs: http://$PODMAN_IP:8000/docs"
  echo "- pgAdmin:  http://$PODMAN_IP:5050"
  echo ""
  echo "Si no puedes acceder usando la dirección anterior, intenta con:"
  echo "- http://localhost:3000 (frontend)"
  echo "- http://localhost:8000 (backend)"
  echo "- http://localhost:5050 (pgAdmin)"
  echo "======================================================================"
  echo ""
  echo "Credenciales pgAdmin:"
  echo "Email: ${PGADMIN_EMAIL}"
  echo "Password: ${PGADMIN_PASSWORD}"
  echo ""
  echo "Datos de conexión a PostgreSQL desde pgAdmin:"
  echo "Host: db"
  echo "Port: 5432"
  echo "Username: ${POSTGRES_USER}"
  echo "Password: ${POSTGRES_PASSWORD}"
  echo "Database: ${POSTGRES_DB}"
else
  # En Linux, acceder directamente a localhost
  echo ""
  echo "======================= ACCESO A LA APLICACIÓN ========================="
  echo "Accede a la aplicación en:"
  echo "- Frontend: http://localhost:3000"
  echo "- Backend:  http://localhost:8000"
  echo "- API Docs: http://localhost:8000/docs"
  echo "- pgAdmin:  http://localhost:5050"
  echo "======================================================================"
  echo ""
  echo "Credenciales pgAdmin:"
  echo "Email: ${PGADMIN_EMAIL}"
  echo "Password: ${PGADMIN_PASSWORD}"
  echo ""
  echo "Datos de conexión a PostgreSQL desde pgAdmin:"
  echo "Host: db"
  echo "Port: 5432"
  echo "Username: ${POSTGRES_USER}"
  echo "Password: ${POSTGRES_PASSWORD}"
  echo "Database: ${POSTGRES_DB}"
fi

echo ""
echo "Comandos útiles:"
echo "- Ver logs: podman logs [client|server|db|pgadmin]"
echo "- Detener contenedores: podman stop client server db pgadmin"
echo "- Ejecutar shell: podman exec -it [client|server|db] sh" 