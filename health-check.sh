#!/bin/bash

# Script de verificación de salud para el sistema de gestión de proyectos ágiles
# Diseñado para Digital Ocean y producción

# Colores
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m"

# Configuración
LOG_FILE="/var/log/agile_health_check.log"
ALERT_EMAIL=""  # Configurar si se desea alertas por email
MAX_MEMORY_USAGE=80  # Porcentaje máximo de uso de memoria
MAX_CPU_USAGE=80     # Porcentaje máximo de uso de CPU

# Función para logging
log_message() {
  local level=$1
  local message=$2
  echo "$(date '+%Y-%m-%d %H:%M:%S') [$level] $message" | tee -a "$LOG_FILE"
}

# Función para verificar si un contenedor está corriendo
check_container() {
  local container_name=$1
  if podman ps --format "{{.Names}}" | grep -q "^${container_name}$"; then
    return 0
  else
    return 1
  fi
}

# Función para verificar la salud de un servicio HTTP
check_http_service() {
  local service_name=$1
  local url=$2
  local timeout=${3:-10}
  
  if curl -s --max-time "$timeout" "$url" >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Función para verificar la salud de la base de datos
check_database() {
  if podman exec db pg_isready -U agileuser -d agiledb >/dev/null 2>&1; then
    return 0
  else
    return 1
  fi
}

# Función para obtener uso de recursos de un contenedor
get_container_stats() {
  local container_name=$1
  podman stats --no-stream --format "{{.MemUsage}} {{.CPUPerc}}" "$container_name" 2>/dev/null
}

# Función para reiniciar un contenedor
restart_container() {
  local container_name=$1
  log_message "WARN" "Reiniciando contenedor: $container_name"
  
  if podman restart "$container_name" >/dev/null 2>&1; then
    log_message "INFO" "Contenedor $container_name reiniciado exitosamente"
    return 0
  else
    log_message "ERROR" "No se pudo reiniciar el contenedor $container_name"
    return 1
  fi
}

# Función para enviar alerta (implementar según necesidades)
send_alert() {
  local message=$1
  log_message "ALERT" "$message"
  
  # Aquí se puede implementar notificaciones por email, Slack, etc.
  if [ -n "$ALERT_EMAIL" ]; then
    echo "$message" | mail -s "Alerta Sistema Ágil" "$ALERT_EMAIL" 2>/dev/null || true
  fi
}

# Función principal de verificación de salud
health_check() {
  local issues_found=0
  local critical_issues=0
  
  echo -e "${BLUE}=== Verificación de Salud del Sistema ===${NC}"
  echo "Fecha: $(date)"
  echo ""
  
  # Verificar contenedores
  echo -e "${BLUE}1. Verificando contenedores...${NC}"
  
  for container in "db" "server" "client" "pgadmin"; do
    if check_container "$container"; then
      echo -e "  ✅ $container: ${GREEN}Ejecutándose${NC}"
      
      # Verificar recursos del contenedor
      stats=$(get_container_stats "$container")
      if [ -n "$stats" ]; then
        memory_usage=$(echo "$stats" | awk '{print $1}' | grep -o '[0-9.]*')
        cpu_usage=$(echo "$stats" | awk '{print $2}' | grep -o '[0-9.]*')
        
        if (( $(echo "$memory_usage > $MAX_MEMORY_USAGE" | bc -l) )); then
          echo -e "    ⚠️  ${YELLOW}Uso de memoria alto: ${memory_usage}%${NC}"
          log_message "WARN" "Contenedor $container: uso de memoria alto (${memory_usage}%)"
          issues_found=$((issues_found + 1))
        fi
        
        if (( $(echo "$cpu_usage > $MAX_CPU_USAGE" | bc -l) )); then
          echo -e "    ⚠️  ${YELLOW}Uso de CPU alto: ${cpu_usage}%${NC}"
          log_message "WARN" "Contenedor $container: uso de CPU alto (${cpu_usage}%)"
          issues_found=$((issues_found + 1))
        fi
      fi
    else
      echo -e "  ❌ $container: ${RED}No ejecutándose${NC}"
      log_message "ERROR" "Contenedor $container no está ejecutándose"
      
      # Intentar reiniciar contenedores críticos automáticamente
      if [[ "$container" == "db" || "$container" == "server" || "$container" == "client" ]]; then
        echo -e "    🔄 Intentando reiniciar $container..."
        if restart_container "$container"; then
          echo -e "    ✅ $container reiniciado exitosamente"
        else
          echo -e "    ❌ No se pudo reiniciar $container"
          critical_issues=$((critical_issues + 1))
          send_alert "CRÍTICO: No se pudo reiniciar el contenedor $container"
        fi
      fi
      
      issues_found=$((issues_found + 1))
    fi
  done
  
  echo ""
  
  # Verificar servicios HTTP
  echo -e "${BLUE}2. Verificando servicios HTTP...${NC}"
  
  if check_http_service "Backend API" "http://localhost:8000/docs" 15; then
    echo -e "  ✅ Backend API: ${GREEN}Respondiendo${NC}"
  else
    echo -e "  ❌ Backend API: ${RED}No responde${NC}"
    log_message "ERROR" "Backend API no responde en http://localhost:8000/docs"
    issues_found=$((issues_found + 1))
    
    # Intentar reiniciar el servidor
    if check_container "server"; then
      echo -e "    🔄 Reiniciando servidor..."
      restart_container "server"
    fi
  fi
  
  if check_http_service "Frontend" "http://localhost:3000" 10; then
    echo -e "  ✅ Frontend: ${GREEN}Respondiendo${NC}"
  else
    echo -e "  ❌ Frontend: ${RED}No responde${NC}"
    log_message "ERROR" "Frontend no responde en http://localhost:3000"
    issues_found=$((issues_found + 1))
    
    # Intentar reiniciar el cliente
    if check_container "client"; then
      echo -e "    🔄 Reiniciando cliente..."
      restart_container "client"
    fi
  fi
  
  if check_http_service "pgAdmin" "http://localhost:5050" 10; then
    echo -e "  ✅ pgAdmin: ${GREEN}Respondiendo${NC}"
  else
    echo -e "  ⚠️  pgAdmin: ${YELLOW}No responde (no crítico)${NC}"
    log_message "WARN" "pgAdmin no responde en http://localhost:5050"
  fi
  
  echo ""
  
  # Verificar base de datos
  echo -e "${BLUE}3. Verificando base de datos...${NC}"
  
  if check_database; then
    echo -e "  ✅ PostgreSQL: ${GREEN}Respondiendo${NC}"
    
    # Verificar conexiones activas
    active_connections=$(podman exec db psql -U agileuser -d agiledb -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | tr -d ' ')
    
    if [ -n "$active_connections" ]; then
      echo -e "  📊 Conexiones activas: $active_connections"
      
      if [ "$active_connections" -gt 50 ]; then
        echo -e "    ⚠️  ${YELLOW}Muchas conexiones activas${NC}"
        log_message "WARN" "Muchas conexiones activas en la base de datos: $active_connections"
        issues_found=$((issues_found + 1))
      fi
    fi
  else
    echo -e "  ❌ PostgreSQL: ${RED}No responde${NC}"
    log_message "ERROR" "Base de datos PostgreSQL no responde"
    critical_issues=$((critical_issues + 1))
    issues_found=$((issues_found + 1))
    
    # Intentar reiniciar la base de datos
    if check_container "db"; then
      echo -e "    🔄 Reiniciando base de datos..."
      restart_container "db"
      sleep 10  # Esperar a que la DB esté lista
    fi
  fi
  
  echo ""
  
  # Verificar recursos del sistema
  echo -e "${BLUE}4. Verificando recursos del sistema...${NC}"
  
  # Memoria
  memory_info=$(free -m | awk 'NR==2{printf "%.0f %.0f %.2f", $3,$2,$3*100/$2}')
  used_memory=$(echo $memory_info | awk '{print $1}')
  total_memory=$(echo $memory_info | awk '{print $2}')
  memory_percent=$(echo $memory_info | awk '{print $3}')
  
  echo -e "  💾 Memoria: ${used_memory}MB/${total_memory}MB (${memory_percent}%)"
  
  if (( $(echo "$memory_percent > 90" | bc -l) )); then
    echo -e "    ❌ ${RED}Memoria crítica${NC}"
    log_message "ERROR" "Uso de memoria crítico: ${memory_percent}%"
    critical_issues=$((critical_issues + 1))
    send_alert "CRÍTICO: Uso de memoria del sistema: ${memory_percent}%"
  elif (( $(echo "$memory_percent > 80" | bc -l) )); then
    echo -e "    ⚠️  ${YELLOW}Memoria alta${NC}"
    log_message "WARN" "Uso de memoria alto: ${memory_percent}%"
    issues_found=$((issues_found + 1))
  fi
  
  # Disco
  disk_usage=$(df -h / | awk 'NR==2{print $5}' | sed 's/%//')
  echo -e "  💿 Disco: ${disk_usage}% usado"
  
  if [ "$disk_usage" -gt 90 ]; then
    echo -e "    ❌ ${RED}Disco crítico${NC}"
    log_message "ERROR" "Uso de disco crítico: ${disk_usage}%"
    critical_issues=$((critical_issues + 1))
    send_alert "CRÍTICO: Uso de disco del sistema: ${disk_usage}%"
  elif [ "$disk_usage" -gt 80 ]; then
    echo -e "    ⚠️  ${YELLOW}Disco alto${NC}"
    log_message "WARN" "Uso de disco alto: ${disk_usage}%"
    issues_found=$((issues_found + 1))
  fi
  
  echo ""
  
  # Resumen final
  echo -e "${BLUE}=== Resumen ===${NC}"
  
  if [ "$critical_issues" -gt 0 ]; then
    echo -e "❌ ${RED}Estado: CRÍTICO${NC} ($critical_issues problemas críticos)"
    log_message "ERROR" "Verificación completada: CRÍTICO ($critical_issues problemas críticos, $issues_found total)"
    exit 2
  elif [ "$issues_found" -gt 0 ]; then
    echo -e "⚠️  ${YELLOW}Estado: ADVERTENCIA${NC} ($issues_found problemas encontrados)"
    log_message "WARN" "Verificación completada: ADVERTENCIA ($issues_found problemas encontrados)"
    exit 1
  else
    echo -e "✅ ${GREEN}Estado: SALUDABLE${NC}"
    log_message "INFO" "Verificación completada: SALUDABLE"
    exit 0
  fi
}

# Verificar si se debe ejecutar en modo silencioso
if [[ "$1" == "--quiet" || "$1" == "-q" ]]; then
  health_check >/dev/null 2>&1
  exit $?
elif [[ "$1" == "--help" || "$1" == "-h" ]]; then
  echo "Script de verificación de salud del sistema"
  echo "Uso: $0 [opciones]"
  echo ""
  echo "Opciones:"
  echo "  -q, --quiet    Ejecutar en modo silencioso (solo logs)"
  echo "  -h, --help     Mostrar esta ayuda"
  echo ""
  echo "Códigos de salida:"
  echo "  0: Sistema saludable"
  echo "  1: Advertencias encontradas"
  echo "  2: Problemas críticos encontrados"
  exit 0
else
  health_check
fi 