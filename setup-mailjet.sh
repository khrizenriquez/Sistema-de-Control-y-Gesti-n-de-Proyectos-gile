#!/bin/bash

# Script para configurar Mailjet para envío de emails
# Uso: ./setup-mailjet.sh

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📧 Configuración de Mailjet para envío de emails${NC}"
echo

# Verificar si ya existe configuración
if [[ -n "$MAILJET_API_KEY" && -n "$MAILJET_SECRET_KEY" ]]; then
    echo -e "${GREEN}✅ Mailjet ya está configurado${NC}"
    echo -e "   API Key: ${MAILJET_API_KEY:0:8}..."
    echo -e "   Habilitado: ${ENABLE_EMAIL_NOTIFICATIONS:-false}"
    echo
    exit 0
fi

echo -e "${YELLOW}📋 Para configurar Mailjet necesitarás:${NC}"
echo "  1. Una cuenta en Mailjet (https://app.mailjet.com/)"
echo "  2. Crear un API Key y Secret Key"
echo "  3. Verificar tu dominio de envío"
echo

echo -e "${BLUE}🔧 Configuración manual:${NC}"
echo
echo -e "# Para configurar Mailjet, edita el archivo apps/server/.env:"
echo -e "${GREEN}MAILJET_API_KEY=\"tu_api_key_de_mailjet\"${NC}"
echo -e "${GREEN}MAILJET_SECRET_KEY=\"tu_secret_key_de_mailjet\"${NC}"
echo -e "${GREEN}ENABLE_EMAIL_NOTIFICATIONS=\"true\"${NC}"
echo -e "${GREEN}FROM_EMAIL=\"noreply@tu-dominio.com\"${NC}"
echo -e "${GREEN}FROM_NAME=\"Tu Sistema de Gestión\"${NC}"
echo

echo -e "${BLUE}📋 Pasos para obtener las credenciales:${NC}"
echo "  1. Ve a https://app.mailjet.com/"
echo "  2. Registrate o inicia sesión"
echo "  3. Ve a Account Settings > REST API Keys"
echo "  4. Copia el API Key y Secret Key"
echo "  5. Configura un dominio de envío en Account Settings > Sender domains"
echo

echo -e "${BLUE}🚀 Después de configurar, reinicia tu aplicación:${NC}"
echo -e "${GREEN}./start-environment.sh --build --dev${NC}"
echo

echo -e "${YELLOW}💡 Características del servicio:${NC}"
echo "  📊 Métricas registradas en Apitally"
echo "  🎨 Templates HTML profesionales"
echo "  ⚙️ Configuración por usuario (habilitar/deshabilitar)"
echo "  🔗 Enlaces directos a tarjetas/proyectos"
echo "  📧 Soporte para texto plano y HTML"
echo

echo -e "${BLUE}🔍 Para verificar el estado:${NC}"
echo "  📊 API Status: http://localhost:8000"
echo "  📈 Email Metrics: http://localhost:8000/metrics/email"
echo "  ⚙️ Preferencias de usuario: http://localhost:3000/profile" 