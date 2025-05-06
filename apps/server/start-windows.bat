@echo off
SETLOCAL EnableDelayedExpansion

REM Script para iniciar el entorno en Windows
echo === Sistema de Control y Gestion de Proyectos Agiles ===
echo Iniciando entorno en Windows...

REM Comprobar si Docker/Podman está instalado
WHERE docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker no encontrado. Por favor, instale Docker Desktop para Windows.
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

REM Comprobar si hay que reconstruir las imágenes
IF "%BUILD%" == "true" (
    echo Construyendo imágenes de contenedores...
    
    echo Construyendo imagen del servidor...
    cd ..\server
    docker build -t agile-server .
    
    echo Construyendo imagen del cliente...
    cd ..\client
    docker build -t agile-client .
    
    cd ..\server
)

REM Comprobar el modo de ejecución
IF "%DEV%" == "true" (
    echo Iniciando entorno en modo desarrollo...
    
    REM Iniciar PostgreSQL
    docker run -d --name db -p 5432:5432 ^
        -e POSTGRES_USER=agileuser ^
        -e POSTGRES_PASSWORD=agilepassword ^
        -e POSTGRES_DB=agiledb ^
        postgres:16
    
    REM Iniciar Servidor en modo dev
    docker run -d --name server -p 8000:8000 ^
        --link db ^
        -v "%CD%\..\server:/app" ^
        -v "%CD%\.env_files\server.env:/app/.env" ^
        -e POSTGRES_HOST=db ^
        -e POSTGRES_PORT=5432 ^
        -e POSTGRES_USER=agileuser ^
        -e POSTGRES_PASSWORD=agilepassword ^
        -e POSTGRES_DB=agiledb ^
        agile-server
    
    REM Iniciar Cliente en modo dev
    docker run -d --name client -p 3000:3000 ^
        --link server ^
        -v "%CD%\..\client:/app" ^
        -v "%CD%\.env_files\client.env:/app/.env" ^
        agile-client
) ELSE (
    echo Iniciando entorno en modo producción...
    
    REM Iniciar PostgreSQL
    docker run -d --name db -p 5432:5432 ^
        -e POSTGRES_USER=agileuser ^
        -e POSTGRES_PASSWORD=agilepassword ^
        -e POSTGRES_DB=agiledb ^
        postgres:16
    
    REM Iniciar Servidor
    docker run -d --name server -p 8000:8000 ^
        --link db ^
        -v "%CD%\.env_files\server.env:/app/.env" ^
        -e POSTGRES_HOST=db ^
        -e POSTGRES_PORT=5432 ^
        -e POSTGRES_USER=agileuser ^
        -e POSTGRES_PASSWORD=agilepassword ^
        -e POSTGRES_DB=agiledb ^
        agile-server
    
    REM Iniciar Cliente
    docker run -d --name client -p 3000:3000 ^
        --link server ^
        -v "%CD%\.env_files\client.env:/app/.env" ^
        agile-client
)

echo.
echo Entorno iniciado correctamente.
echo - Cliente: http://localhost:3000
echo - Servidor API: http://localhost:8000
echo - Documentación API: http://localhost:8000/docs
echo.
echo Para detener el entorno, ejecute: docker stop client server db
echo Para eliminar los contenedores, ejecute: docker rm client server db
echo.

ENDLOCAL 