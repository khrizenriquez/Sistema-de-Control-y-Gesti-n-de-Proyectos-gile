@echo off
SETLOCAL EnableDelayedExpansion

REM Script para iniciar el entorno en Windows con Podman
echo === Sistema de Control y Gestion de Proyectos Agiles ===
echo Iniciando entorno en Windows con Podman...

REM Comprobar si Podman está instalado
WHERE podman >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Podman no encontrado. Por favor, instale Podman para Windows.
    exit /b 1
)

REM Variables para el entorno
SET BUILD=false
SET DEV=false

REM Procesar argumentos
:arg_loop
IF "%1" == "" GOTO continue
IF "%1" == "--build" (
    SET BUILD=true
    SHIFT
    GOTO arg_loop
)
IF "%1" == "--dev" (
    SET DEV=true
    SHIFT
    GOTO arg_loop
)
SHIFT
GOTO arg_loop

:continue
REM Mostrar configuración
echo.
echo Modo: %DEV% ^(development^)
echo Rebuild: %BUILD% ^(rebuild containers^)
echo.

REM Crear directorio .env_files si no existe
IF NOT EXIST ".env_files" (
    mkdir .env_files
    echo Directorio .env_files creado
)

REM Comprobar y crear archivo .env para servidor si no existe
IF NOT EXIST ".env_files\server.env" (
    echo # Base de datos> .env_files\server.env
    echo DATABASE_URL=postgresql+asyncpg://agileuser:agilepassword@db:5432/agiledb>> .env_files\server.env
    echo.>> .env_files\server.env
    echo # Supabase ^(obligatorio para autenticación^)>> .env_files\server.env
    echo SUPABASE_URL=https://your-project-url.supabase.co>> .env_files\server.env
    echo SUPABASE_KEY=your_supabase_key>> .env_files\server.env
    echo.>> .env_files\server.env
    echo # Configuración>> .env_files\server.env
    echo SECRET_KEY=clave_secreta_para_jwt>> .env_files\server.env
    echo LOAD_TEST_DATA=true>> .env_files\server.env
    echo Archivo .env para servidor creado. Por favor, edite .env_files\server.env con sus credenciales.
)

REM Comprobar y crear archivo .env para cliente si no existe
IF NOT EXIST ".env_files\client.env" (
    echo # Supabase> .env_files\client.env
    echo VITE_SUPABASE_URL=https://your-project-url.supabase.co>> .env_files\client.env
    echo VITE_SUPABASE_ANON_KEY=your_supabase_anon_key>> .env_files\client.env
    echo Archivo .env para cliente creado. Por favor, edite .env_files\client.env con sus credenciales.
)

REM Crear una red de podman si no existe
echo Verificando si existe la red podman-network...
podman network ls | findstr "podman-network" >nul
IF %ERRORLEVEL% NEQ 0 (
    echo Creando red podman-network...
    podman network create podman-network
) ELSE (
    echo La red podman-network ya existe
)

REM Detener y eliminar contenedores existentes
podman stop db server client 2>nul
podman rm db server client 2>nul

REM Comprobar si hay que reconstruir las imágenes
IF "%BUILD%" == "true" (
    echo Construyendo imágenes de contenedores...
    
    echo Construyendo imagen del servidor...
    cd ..\server
    podman build -t agile-server .
    
    echo Construyendo imagen del cliente...
    cd ..\client
    podman build -t agile-client .
    
    cd ..\server
)

REM Obtener la ruta absoluta del directorio actual y convertirla para Podman
FOR %%i IN (".") DO SET "CURRENT_DIR=%%~fi"
SET "PODMAN_PATH=!CURRENT_DIR:\=/!"
SET "DRIVE_LETTER=!PODMAN_PATH:~0,1!"
SET "PODMAN_PATH=/!DRIVE_LETTER!!PODMAN_PATH:~2!"

REM Comprobar el modo de ejecución
IF "%DEV%" == "true" (
    echo Iniciando entorno en modo desarrollo...
    
    REM Iniciar PostgreSQL
    podman run -d --name db --network podman-network -p 5432:5432 ^
        -e POSTGRES_USER=agileuser ^
        -e POSTGRES_PASSWORD=agilepassword ^
        -e POSTGRES_DB=agiledb ^
        postgres:16
    
    REM Iniciar Servidor en modo dev
    podman run -d --name server --network podman-network -p 8000:8000 ^
        -v "!PODMAN_PATH!/../server:/app:Z" ^
        -v "!PODMAN_PATH!/.env_files/server.env:/app/.env:Z" ^
        -e POSTGRES_HOST=db ^
        -e POSTGRES_PORT=5432 ^
        -e POSTGRES_USER=agileuser ^
        -e POSTGRES_PASSWORD=agilepassword ^
        -e POSTGRES_DB=agiledb ^
        agile-server
    
    REM Iniciar Cliente en modo dev
    podman run -d --name client --network podman-network -p 3000:3000 ^
        -v "!PODMAN_PATH!/../client:/app:Z" ^
        -v "!PODMAN_PATH!/.env_files/client.env:/app/.env:Z" ^
        agile-client
) ELSE (
    echo Iniciando entorno en modo producción...
    
    REM Iniciar PostgreSQL
    podman run -d --name db --network podman-network -p 5432:5432 ^
        -e POSTGRES_USER=agileuser ^
        -e POSTGRES_PASSWORD=agilepassword ^
        -e POSTGRES_DB=agiledb ^
        postgres:16
    
    REM Iniciar Servidor
    podman run -d --name server --network podman-network -p 8000:8000 ^
        -v "!PODMAN_PATH!/.env_files/server.env:/app/.env:Z" ^
        -e POSTGRES_HOST=db ^
        -e POSTGRES_PORT=5432 ^
        -e POSTGRES_USER=agileuser ^
        -e POSTGRES_PASSWORD=agilepassword ^
        -e POSTGRES_DB=agiledb ^
        agile-server
    
    REM Iniciar Cliente
    podman run -d --name client --network podman-network -p 3000:3000 ^
        -v "!PODMAN_PATH!/.env_files/client.env:/app/.env:Z" ^
        agile-client
)

echo.
echo Entorno iniciado correctamente.
echo - Cliente: http://localhost:3000
echo - Servidor API: http://localhost:8000
echo - Documentación API: http://localhost:8000/docs
echo.
echo Para detener el entorno, ejecute: podman stop client server db
echo Para eliminar los contenedores, ejecute: podman rm client server db
echo.

ENDLOCAL 