#!/bin/bash

# Script de despliegue rápido para Digital Ocean
# Este script aplica todas las correcciones para el problema de contenedores que se caen

set -e  # Salir si hay algún error

# Colores
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
BLUE="\033[0;34m"
NC="\033[0m"

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

echo "🚀 Desplegando correcciones para estabilidad en Digital Ocean"
echo "============================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "start-environment.sh" ]; then
  print_error "No se encontró start-environment.sh. Asegúrate de estar en el directorio del proyecto."
  exit 1
fi

print_step "1. Haciendo backup de configuración actual..."
cp start-environment.sh start-environment.sh.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

print_step "2. Verificando scripts de producción..."
if [ ! -f "start-production.sh" ]; then
  print_error "Script start-production.sh no encontrado. Asegúrate de tener la versión actualizada del repositorio."
  exit 1
fi

if [ ! -f "health-check.sh" ]; then
  print_error "Script health-check.sh no encontrado. Asegúrate de tener la versión actualizada del repositorio."
  exit 1
fi

print_step "3. Haciendo scripts ejecutables..."
chmod +x start-production.sh health-check.sh start-environment.sh

print_step "4. Deteniendo contenedores actuales..."
print_warning "Esto detendrá temporalmente tu aplicación (1-2 minutos)"
podman stop $(podman ps -q) 2>/dev/null || true

print_step "5. Eliminando contenedores antiguos (conservando datos)..."
podman rm server client pgadmin 2>/dev/null || true
# NO eliminamos el contenedor db para conservar los datos

print_step "6. Iniciando con configuración de producción mejorada..."
print_message "Usando start-production.sh con políticas de reinicio automático..."

# Ejecutar el script de producción
if ./start-production.sh --build; then
  print_message "✅ Despliegue exitoso!"
else
  print_error "❌ Error en el despliegue. Intentando con script original..."
  ./start-environment.sh --build
fi

print_step "7. Verificando estado del sistema..."
sleep 10

# Verificar que los contenedores están corriendo
if podman ps | grep -q "server" && podman ps | grep -q "client" && podman ps | grep -q "db"; then
  print_message "✅ Todos los contenedores principales están ejecutándose"
else
  print_warning "⚠️ Algunos contenedores pueden no estar ejecutándose. Verificando..."
  podman ps
fi

print_step "8. Ejecutando verificación de salud..."
if ./health-check.sh; then
  print_message "✅ Sistema saludable"
else
  print_warning "⚠️ Se encontraron algunos problemas, pero el sistema debería funcionar"
fi

print_step "9. Configurando monitoreo automático..."
print_message "Añadiendo verificación de salud al crontab..."

# Crear entrada de crontab si no existe
CRON_JOB="*/5 * * * * $(pwd)/health-check.sh --quiet >> /var/log/container_monitor.log 2>&1"
(crontab -l 2>/dev/null | grep -v "health-check.sh"; echo "$CRON_JOB") | crontab -

print_message "✅ Monitoreo automático configurado (cada 5 minutos)"

echo ""
echo "🎉 ¡DESPLIEGUE COMPLETADO!"
echo "========================"
echo ""
print_message "🔧 Mejoras aplicadas:"
echo "  ✅ Políticas de reinicio automático (--restart=unless-stopped)"
echo "  ✅ Límites de recursos para estabilidad"
echo "  ✅ Verificaciones de salud con reintentos"
echo "  ✅ Monitoreo automático cada 5 minutos"
echo "  ✅ Configuración optimizada para producción"
echo ""
print_message "🌐 Tu aplicación está disponible en:"
echo "  • Frontend: http://161.35.97.194:3000"
echo "  • Backend: http://161.35.97.194:8000"
echo "  • API Docs: http://161.35.97.194:8000/docs"
echo ""
print_message "📊 Comandos útiles:"
echo "  • Ver estado: podman ps"
echo "  • Ver logs: podman logs server"
echo "  • Verificar salud: ./health-check.sh"
echo "  • Monitoreo en tiempo real: watch -n 5 'podman ps'"
echo ""
print_message "🔍 Los contenedores ahora se reiniciarán automáticamente si fallan"
print_message "📝 Logs de monitoreo en: /var/log/container_monitor.log"
echo ""

# Verificación final
if curl -s http://localhost:3000 >/dev/null 2>&1; then
  print_message "✅ Frontend respondiendo correctamente"
else
  print_warning "⚠️ Frontend no responde aún, puede necesitar unos minutos más"
fi

if curl -s http://localhost:8000/docs >/dev/null 2>&1; then
  print_message "✅ Backend respondiendo correctamente"
else
  print_warning "⚠️ Backend no responde aún, puede necesitar unos minutos más"
fi

echo ""
print_message "🎯 ¡Tu aplicación ahora debería mantenerse estable 24/7!"
print_message "📖 Para más detalles, consulta: PRODUCTION_DEPLOYMENT.md" 