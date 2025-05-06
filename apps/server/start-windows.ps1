# Script para iniciar el entorno en Windows con PowerShell
Write-Host "=== Sistema de Control y Gestion de Proyectos Agiles ===" -ForegroundColor Blue
Write-Host "Iniciando entorno en Windows..." -ForegroundColor Blue

# Comprobar si Docker/Podman está instalado
try {
    docker --version | Out-Null
} catch {
    Write-Host "[ERROR] Docker no encontrado. Por favor, instale Docker Desktop para Windows." -ForegroundColor Red
    exit 1
}

# Variables para el entorno
$BUILD = $false
$DEV = $false

# Procesar argumentos
foreach ($arg in $args) {
    if ($arg -eq "--build") {
        $BUILD = $true
    }
    if ($arg -eq "--dev") {
        $DEV = $true
    }
}

# Mostrar configuración
Write-Host ""
Write-Host "Modo: $DEV (development)"
Write-Host "Rebuild: $BUILD (rebuild containers)"
Write-Host ""

# Crear directorio .env_files si no existe
if (-not (Test-Path ".env_files")) {
    New-Item -Path ".env_files" -ItemType Directory | Out-Null
    Write-Host "Directorio .env_files creado"
}

# Comprobar y crear archivo .env para servidor si no existe
if (-not (Test-Path ".env_files\server.env")) {
    @"
# Base de datos
DATABASE_URL=postgresql+asyncpg://agileuser:agilepassword@db:5432/agiledb

# Supabase (obligatorio para autenticación)
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_KEY=your_supabase_key

# Configuración
SECRET_KEY=clave_secreta_para_jwt
LOAD_TEST_DATA=true
"@ | Out-File -FilePath ".env_files\server.env" -Encoding utf8
    Write-Host "Archivo .env para servidor creado. Por favor, edite .env_files\server.env con sus credenciales."
}

# Comprobar y crear archivo .env para cliente si no existe
if (-not (Test-Path ".env_files\client.env")) {
    @"
# Supabase
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
"@ | Out-File -FilePath ".env_files\client.env" -Encoding utf8
    Write-Host "Archivo .env para cliente creado. Por favor, edite .env_files\client.env con sus credenciales."
}

# Comprobar si los contenedores existen y eliminarlos si es necesario
$containers = docker ps -a --format "{{.Names}}"
if ($containers -match "db" -or $containers -match "server" -or $containers -match "client") {
    Write-Host "Deteniendo y eliminando contenedores existentes..." -ForegroundColor Yellow
    docker stop db server client 2>$null
    docker rm db server client 2>$null
}

# Comprobar si hay que reconstruir las imágenes
if ($BUILD) {
    Write-Host "Construyendo imágenes de contenedores..." -ForegroundColor Green
    
    Write-Host "Construyendo imagen del servidor..." -ForegroundColor Cyan
    Push-Location ..\server
    docker build -t agile-server .
    
    Write-Host "Construyendo imagen del cliente..." -ForegroundColor Cyan
    Push-Location ..\client
    docker build -t agile-client .
    
    Pop-Location
    Pop-Location
}

# Obtener la ruta absoluta del directorio actual
$currentDir = (Get-Location).Path

# Comprobar el modo de ejecución
if ($DEV) {
    Write-Host "Iniciando entorno en modo desarrollo..." -ForegroundColor Green
    
    # Iniciar PostgreSQL
    Write-Host "Iniciando base de datos PostgreSQL..." -ForegroundColor Cyan
    docker run -d --name db -p 5432:5432 `
        -e POSTGRES_USER=agileuser `
        -e POSTGRES_PASSWORD=agilepassword `
        -e POSTGRES_DB=agiledb `
        postgres:16
    
    # Iniciar Servidor en modo dev
    Write-Host "Iniciando servidor en modo desarrollo..." -ForegroundColor Cyan
    docker run -d --name server -p 8000:8000 `
        --link db `
        -v "${currentDir}\..\server:/app" `
        -v "${currentDir}\.env_files\server.env:/app/.env" `
        -e POSTGRES_HOST=db `
        -e POSTGRES_PORT=5432 `
        -e POSTGRES_USER=agileuser `
        -e POSTGRES_PASSWORD=agilepassword `
        -e POSTGRES_DB=agiledb `
        agile-server
    
    # Iniciar Cliente en modo dev
    Write-Host "Iniciando cliente en modo desarrollo..." -ForegroundColor Cyan
    docker run -d --name client -p 3000:3000 `
        --link server `
        -v "${currentDir}\..\client:/app" `
        -v "${currentDir}\.env_files\client.env:/app/.env" `
        agile-client
} else {
    Write-Host "Iniciando entorno en modo producción..." -ForegroundColor Green
    
    # Iniciar PostgreSQL
    Write-Host "Iniciando base de datos PostgreSQL..." -ForegroundColor Cyan
    docker run -d --name db -p 5432:5432 `
        -e POSTGRES_USER=agileuser `
        -e POSTGRES_PASSWORD=agilepassword `
        -e POSTGRES_DB=agiledb `
        postgres:16
    
    # Iniciar Servidor
    Write-Host "Iniciando servidor..." -ForegroundColor Cyan
    docker run -d --name server -p 8000:8000 `
        --link db `
        -v "${currentDir}\.env_files\server.env:/app/.env" `
        -e POSTGRES_HOST=db `
        -e POSTGRES_PORT=5432 `
        -e POSTGRES_USER=agileuser `
        -e POSTGRES_PASSWORD=agilepassword `
        -e POSTGRES_DB=agiledb `
        agile-server
    
    # Iniciar Cliente
    Write-Host "Iniciando cliente..." -ForegroundColor Cyan
    docker run -d --name client -p 3000:3000 `
        --link server `
        -v "${currentDir}\.env_files\client.env:/app/.env" `
        agile-client
}

Write-Host ""
Write-Host "Entorno iniciado correctamente." -ForegroundColor Green
Write-Host "- Cliente: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Servidor API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "- Documentación API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para detener el entorno, ejecute: docker stop client server db" -ForegroundColor Yellow
Write-Host "Para eliminar los contenedores, ejecute: docker rm client server db" -ForegroundColor Yellow
Write-Host "" 