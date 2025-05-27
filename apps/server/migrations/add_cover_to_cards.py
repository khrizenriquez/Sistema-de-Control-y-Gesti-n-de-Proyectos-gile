"""Add cover_color column to cards table

This migration adds the cover_color column to the cards table,
which allows storing the card's cover color selection.
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
    """Run the migration to add cover_color column to cards table"""
    
    # Verificar si la columna ya existe
    check_column_query = text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='cards' AND column_name='cover_color'
    """)
    
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            # Verificar si la columna ya existe
            result = connection.execute(check_column_query)
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                # Añadir la columna cover_color
                connection.execute(text("""
                    ALTER TABLE cards 
                    ADD COLUMN cover_color VARCHAR(50) NULL
                """))
                
                logger.info("Migration successful: Added cover_color column to cards table")
            else:
                logger.info("Column cover_color already exists in cards table, skipping migration")
                
            transaction.commit()
            return True
        except Exception as e:
            transaction.rollback()
            logger.error(f"Migration failed: {str(e)}")
            return False

if __name__ == "__main__":
    run_migration() 