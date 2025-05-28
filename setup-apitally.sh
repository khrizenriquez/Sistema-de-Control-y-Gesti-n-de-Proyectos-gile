#!/bin/bash

# Script para configurar Apitally de forma segura
# Uso: ./setup-apitally.sh

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Configuración de Apitally${NC}"
echo

# Verificar si ya existe configuración
if [[ -n "$APITALLY_CLIENT_ID" ]]; then
    echo -e "${GREEN}✅ Apitally ya está configurado${NC}"
    echo -e "   Client ID: ${APITALLY_CLIENT_ID:0:8}..."
    echo -e "   Ambiente: ${APITALLY_ENV:-dev}"
    echo
    exit 0
fi

echo -e "${YELLOW}⚠️ IMPORTANTE:${NC} Tu client ID de Apitally debe configurarse como variable de entorno"
echo -e "${YELLOW}⚠️ NUNCA lo incluyas directamente en el código fuente${NC}"
echo

echo -e "${BLUE}📋 Para configurar Apitally, ejecuta estos comandos:${NC}"
echo
echo -e "# Para la sesión actual:"
echo -e "${GREEN}export APITALLY_CLIENT_ID=\"tu_client_id_aqui\"${NC}"
echo -e "${GREEN}export APITALLY_ENV=\"dev\"${NC}"
echo -e "${GREEN}export ENABLE_APITALLY=\"true\"${NC}"
echo
echo -e "# Para persistir en tu shell (añadir a ~/.bashrc o ~/.zshrc):"
echo -e "${GREEN}echo 'export APITALLY_CLIENT_ID=\"tu_client_id_aqui\"' >> ~/.bashrc${NC}"
echo -e "${GREEN}echo 'export APITALLY_ENV=\"dev\"' >> ~/.bashrc${NC}"
echo -e "${GREEN}echo 'export ENABLE_APITALLY=\"true\"' >> ~/.bashrc${NC}"
echo
echo -e "# Para Docker/Podman (añadir al archivo .env del servidor):"
echo -e "${GREEN}echo 'APITALLY_CLIENT_ID=tu_client_id_aqui' >> apps/server/.env${NC}"
echo -e "${GREEN}echo 'APITALLY_ENV=dev' >> apps/server/.env${NC}"
echo -e "${GREEN}echo 'ENABLE_APITALLY=true' >> apps/server/.env${NC}"
echo

echo -e "${BLUE}🚀 Después de configurar, reinicia tu aplicación con:${NC}"
echo -e "${GREEN}./start-environment.sh --build --dev${NC}"
echo

echo -e "${YELLOW}💡 Tip:${NC} Puedes verificar que está funcionando visitando:"
echo -e "   📊 Dashboard de Apitally: https://app.apitally.io"
echo -e "   🔗 API Status: http://localhost:8000" 