"""Add comments table

This migration creates the comments table if it doesn't exist.
The table stores comments associated with cards.
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import logging
import platform
import socket

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Función para verificar si estamos ejecutando dentro de Docker
def is_running_in_docker():
    try:
        with open('/proc/self/cgroup', 'r') as f:
            return any('docker' in line for line in f)
    except:
        return False

# Conectar a la base de datos
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # En entorno local usar una conexión local
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/agile_management"
else:
    # Asegurarse de que el protocolo no sea asyncpg
    DATABASE_URL = DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')

# Usar host 'localhost' si estamos fuera de Docker/Podman
if 'db' in DATABASE_URL and not is_running_in_docker():
    logger.info("Detectado entorno local, usando localhost en lugar de 'db'")
    DATABASE_URL = DATABASE_URL.replace('@db:', '@localhost:')

logger.info(f"Connecting to database: {DATABASE_URL}")
engine = create_engine(DATABASE_URL)

def run_migration():
    """Run the migration to create the comments table if it doesn't exist"""
    
    # Verificar si la tabla ya existe
    check_table_query = text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name='comments'
    """)
    
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            # Verificar si la tabla ya existe
            result = connection.execute(check_table_query)
            table_exists = result.fetchone() is not None
            
            if not table_exists:
                # Crear la tabla de comentarios
                connection.execute(text("""
                    CREATE TABLE comments (
                        id UUID PRIMARY KEY,
                        card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
                        user_id UUID NOT NULL REFERENCES user_profiles(id),
                        content TEXT NOT NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        is_active BOOLEAN NOT NULL DEFAULT TRUE
                    )
                """))
                
                logger.info("Migration successful: Created comments table")
            else:
                logger.info("Table comments already exists, skipping migration")
                
            transaction.commit()
            return True
        except Exception as e:
            transaction.rollback()
            logger.error(f"Migration failed: {str(e)}")
            return False

if __name__ == "__main__":
    run_migration() 