#!/usr/bin/env python3
"""
Script para agregar la columna creator_id a la tabla user_profiles
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os

# Obtener configuración desde variables de entorno
db_config = {
    "host": os.environ.get("POSTGRES_HOST", "localhost"),
    "port": os.environ.get("POSTGRES_PORT", "5432"),
    "database": os.environ.get("POSTGRES_DB", "agiledb"),
    "user": os.environ.get("POSTGRES_USER", "agileuser"),
    "password": os.environ.get("POSTGRES_PASSWORD", "agilepassword")
}

# También se puede usar la variable DATABASE_URL completa si está disponible
if "DATABASE_URL" in os.environ:
    # Formato esperado: postgresql+asyncpg://user:password@host:port/dbname
    database_url = os.environ["DATABASE_URL"]
    
    # Extraer los componentes del DATABASE_URL
    # Reemplazamos el prefijo postgresql+asyncpg:// por nada para procesarlo
    url_without_prefix = database_url.replace("postgresql+asyncpg://", "")
    
    # Extraer usuario y contraseña (antes de @)
    user_pass, host_port_db = url_without_prefix.split("@", 1)
    
    # Extraer usuario y contraseña
    if ":" in user_pass:
        user, password = user_pass.split(":", 1)
        db_config["user"] = user
        db_config["password"] = password
    
    # Extraer host, puerto y nombre de la base de datos
    host_port, db_name = host_port_db.split("/", 1)
    
    # Extraer host y puerto
    if ":" in host_port:
        host, port = host_port.split(":", 1)
        db_config["host"] = host
        db_config["port"] = port
    else:
        db_config["host"] = host_port
    
    # Extraer nombre de la base de datos (eliminar cualquier parámetro adicional)
    if "?" in db_name:
        db_name = db_name.split("?", 1)[0]
    
    db_config["database"] = db_name

def add_creator_id_column():
    """Añadir columna creator_id a la tabla user_profiles si no existe"""
    conn = None
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(**db_config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Verificar si la columna creator_id ya existe
        cur.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles' AND column_name = 'creator_id'
        """)
        
        if cur.fetchone() is None:
            print("Añadiendo columna creator_id a la tabla user_profiles...")
            
            # Añadir la columna creator_id con referencia a user_profiles.id
            cur.execute("""
                ALTER TABLE user_profiles 
                ADD COLUMN creator_id VARCHAR(36) REFERENCES user_profiles(id)
            """)
            
            print("Columna creator_id añadida correctamente")
        else:
            print("La columna creator_id ya existe en la tabla user_profiles")
        
    except Exception as e:
        print(f"Error al añadir la columna creator_id: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_creator_id_column() 