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

# Esperar a que PostgreSQL esté disponible
if [[ -n "$POSTGRES_HOST" && -n "$POSTGRES_USER" && -n "$POSTGRES_PASSWORD" && -n "$POSTGRES_DB" ]]; then
    wait_for_postgres
fi

# Crear tablas
echo "Creando tablas en la base de datos..."
python -c "from app.database.create_tables import create_tables; create_tables()"

# Verificar si se debe inicializar la base de datos
if [[ "$INITIALIZE_DB" == "true" ]]; then
    echo "Inicialización de base de datos solicitada..."
    
    # Add after creating tables and before seeding users
    echo "Ejecutando script de migración para añadir columna creator_id..."
    python /app/migrations/add_creator_id.py

    # Ejecutar script de usuarios de prueba
    echo "Creando datos de prueba (usuarios por roles)..."
    python /app/scripts/seed_users.py

    # Ejecutar script de actualización de roles
    echo "Actualizando roles de usuarios..."
    PGPASSWORD=${POSTGRES_PASSWORD} psql -h ${POSTGRES_HOST} -U ${POSTGRES_USER} -d ${POSTGRES_DB} -f /app/scripts/update_roles.sql

    # Ejecutar cualquier otro script de inicialización
    echo "Ejecutando script de datos semilla..."
    python -c "from app.database.seed import seed_data; import asyncio; asyncio.run(seed_data())"
    
    # Marcar la inicialización como completada
    echo "Inicialización de la base de datos completada."
else
    echo "Saltando la inicialización de la base de datos (INITIALIZE_DB no está establecido a 'true')"
fi

# Iniciar la aplicación
echo "Iniciando aplicación FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 