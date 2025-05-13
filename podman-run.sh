#!/usr/bin/env bash
set -e

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
podman stop client server db 2>/dev/null || true
podman rm client server db 2>/dev/null || true

# Construir imágenes
echo "Construyendo imágenes..."
podman build -t client ./apps/client
podman build -t server ./apps/server

# Crear red si no existe
if ! podman network ls | grep -q "agile-network"; then
  podman network create agile-network
fi

# Crear volumen para la base de datos si no existe
if ! podman volume ls | grep -q "postgres-data"; then
  podman volume create postgres-data
fi

# Iniciar contenedores
echo "Iniciando contenedores..."

# Base de datos PostgreSQL
echo "Iniciando base de datos..."
podman run -d --name db \
  --network agile-network \
  -e POSTGRES_USER=agileuser \
  -e POSTGRES_PASSWORD=agilepassword \
  -e POSTGRES_DB=agiledb \
  -v postgres-data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:15-alpine

# Ejecutar servidor (backend)
echo "Iniciando servidor..."
podman run -d --name server \
  --network agile-network \
  -e DATABASE_URL=postgresql://agileuser:agilepassword@db:5432/agiledb \
  -e SECRET_KEY=temporary_secret_key_change_this_in_production \
  -p 8000:8000 \
  server

# Ejecutar cliente (frontend)
echo "Iniciando cliente..."
podman run -d --name client \
  --network agile-network \
  -p 3000:3000 \
  client

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
  echo ""
  echo "Si no puedes acceder usando la dirección anterior, intenta con:"
  echo "- http://localhost:3000 (frontend)"
  echo "- http://localhost:8000 (backend)"
  echo "======================================================================"
else
  # En Linux, acceder directamente a localhost
  echo ""
  echo "======================= ACCESO A LA APLICACIÓN ========================="
  echo "Accede a la aplicación en:"
  echo "- Frontend: http://localhost:3000"
  echo "- Backend:  http://localhost:8000"
  echo "- API Docs: http://localhost:8000/docs"
  echo "======================================================================"
fi

echo ""
echo "Comandos útiles:"
echo "- Ver logs: podman logs [client|server|db]"
echo "- Detener contenedores: podman stop client server db"
echo "- Ejecutar shell: podman exec -it [client|server|db] sh" 