"""Combined migration to add assignee_id and cover_color columns to cards table

This migration adds the assignee_id and cover_color columns to the cards table:
- assignee_id: allows assigning cards to developers
- cover_color: stores the card's cover color selection
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

# Conectar a la base de datos
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/agile_management"
else:
    # Asegurarse de que el protocolo no sea asyncpg
    DATABASE_URL = DATABASE_URL.replace('postgresql+asyncpg://', 'postgresql://')

logger.info(f"Connecting to database: {DATABASE_URL}")
engine = create_engine(DATABASE_URL)

def run_migration():
    """Run the migration to add assignee_id and cover_color columns to cards table"""
    
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            # Verificar si la columna assignee_id ya existe
            check_assignee_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='cards' AND column_name='assignee_id'
            """)
            
            result = connection.execute(check_assignee_query)
            assignee_exists = result.fetchone() is not None
            
            if not assignee_exists:
                # Añadir la columna assignee_id
                connection.execute(text("""
                    ALTER TABLE cards 
                    ADD COLUMN assignee_id UUID REFERENCES user_profiles(id) NULL
                """))
                
                # Crear índice para mejorar el rendimiento
                connection.execute(text("""
                    CREATE INDEX idx_cards_assignee_id ON cards(assignee_id)
                """))
                
                logger.info("Added assignee_id column to cards table")
            else:
                logger.info("Column assignee_id already exists in cards table, skipping")
            
            # Verificar si la columna cover_color ya existe
            check_cover_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='cards' AND column_name='cover_color'
            """)
            
            result = connection.execute(check_cover_query)
            cover_exists = result.fetchone() is not None
            
            if not cover_exists:
                # Añadir la columna cover_color
                connection.execute(text("""
                    ALTER TABLE cards 
                    ADD COLUMN cover_color VARCHAR(50) NULL
                """))
                
                logger.info("Added cover_color column to cards table")
            else:
                logger.info("Column cover_color already exists in cards table, skipping")
            
            transaction.commit()
            logger.info("Migration successful: All columns added to cards table")
            return True
        except Exception as e:
            transaction.rollback()
            logger.error(f"Migration failed: {str(e)}")
            return False

if __name__ == "__main__":
    run_migration() 