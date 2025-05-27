#!/bin/bash
set -e

# Función para esperar a que PostgreSQL esté disponible
wait_for_postgres() {
    echo "Esperando a que PostgreSQL esté disponible..."
    until PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -c '\q'; do
        echo "PostgreSQL no disponible aún - esperando..."
        sleep 2
    done
    echo "PostgreSQL está disponible. Continuando..."
}

# Extraer variables de entorno desde DATABASE_URL
if [[ -n "$DATABASE_URL" ]]; then
    # Formato esperado: postgresql+asyncpg://user:password@host:port/dbname
    # Extraer usuario
    POSTGRES_USER=$(echo $DATABASE_URL | sed -e 's|^.*://||' -e 's|:.*$||')
    
    # Extraer contraseña (entre ":" y "@")
    POSTGRES_PASSWORD=$(echo $DATABASE_URL | sed -e 's|^.*://[^:]*:||' -e 's|@.*$||')
    
    # Extraer host
    POSTGRES_HOST=$(echo $DATABASE_URL | sed -e 's|^.*@||' -e 's|:.*$||')
    
    # Extraer puerto
    POSTGRES_PORT=$(echo $DATABASE_URL | sed -e 's|^.*:||' -e 's|/.*$||')
    
    # Extraer nombre de base de datos
    POSTGRES_DB=$(echo $DATABASE_URL | sed -e 's|^.*/||' -e 's|\?.*$||')
    
    export POSTGRES_USER
    export POSTGRES_PASSWORD
    export POSTGRES_HOST
    export POSTGRES_PORT
    export POSTGRES_DB
    
    # Debug
    echo "Extracted DB settings:"
    echo "User: $POSTGRES_USER"
    echo "Password: $POSTGRES_PASSWORD"
    echo "Host: $POSTGRES_HOST"
    echo "Port: $POSTGRES_PORT"
    echo "Database: $POSTGRES_DB"
fi

# Inicializar la base de datos utilizando nuestro script de Python mejorado
echo "Inicializando base de datos con script mejorado..."
python /app/scripts/init_db.py

# Verificar si se debe inicializar la base de datos con datos iniciales
if [[ "$INITIALIZE_DB" == "true" ]]; then
    echo "Inicialización de datos solicitada..."
    
    # Ejecutar script de migración para añadir columna creator_id si es necesario
    echo "Ejecutando script de migración para añadir columna creator_id..."
    python /app/migrations/add_creator_id.py
    
    # Ejecutar script de actualización de roles
    echo "Actualizando roles de usuarios..."
    PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -f /app/scripts/update_roles.sql
    
    # Marcar la inicialización como completada
    echo "Inicialización de la base de datos completada."
fi

# Iniciar la aplicación
echo "Iniciando aplicación FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 