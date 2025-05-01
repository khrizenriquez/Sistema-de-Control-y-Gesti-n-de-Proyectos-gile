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
    POSTGRES_USER=$(echo $DATABASE_URL | sed -e 's/^.*:\/\///' -e 's/:.*$//')
    POSTGRES_PASSWORD=$(echo $DATABASE_URL | sed -e 's/^.*://' -e 's/@.*$//')
    POSTGRES_HOST=$(echo $DATABASE_URL | sed -e 's/^.*@//' -e 's/:.*$//')
    POSTGRES_PORT=$(echo $DATABASE_URL | sed -e 's/^.*://' -e 's/\/.*$//')
    POSTGRES_DB=$(echo $DATABASE_URL | sed -e 's/^.*\///' -e 's/\?.*$//')
    
    export POSTGRES_USER
    export POSTGRES_PASSWORD
    export POSTGRES_HOST
    export POSTGRES_PORT
    export POSTGRES_DB
fi

# Esperar a que PostgreSQL esté disponible
if [[ -n "$POSTGRES_HOST" && -n "$POSTGRES_USER" && -n "$POSTGRES_PASSWORD" && -n "$POSTGRES_DB" ]]; then
    wait_for_postgres
fi

# Crear tablas
echo "Creando tablas en la base de datos..."
python -c "from app.database.db import create_db_and_tables; create_db_and_tables()"

# Verificar si se deben cargar datos de prueba
if [[ "$LOAD_TEST_DATA" == "true" ]]; then
    echo "Cargando datos de prueba..."
    python -m app.database.seed
fi

# Iniciar la aplicación
echo "Iniciando la aplicación..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 