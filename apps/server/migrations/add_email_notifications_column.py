#!/usr/bin/env python3
"""
Migración para agregar el campo email_notifications a la tabla user_profiles
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Run the migration to add email_notifications column if it doesn't exist"""
    # Importar configuración
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from app.core.config import settings
    
    try:
        # Crear conexión a la base de datos
        engine = create_engine(settings.DATABASE_URL)
        
        with engine.connect() as connection:
            transaction = connection.begin()
            
            # Verificar si la columna ya existe
            check_column_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user_profiles' AND column_name='email_notifications'
            """)
            
            result = connection.execute(check_column_query)
            column_exists = result.fetchone() is not None
            
            if not column_exists:
                # Agregar la columna email_notifications
                connection.execute(text("""
                    ALTER TABLE user_profiles 
                    ADD COLUMN email_notifications BOOLEAN NOT NULL DEFAULT TRUE
                """))
                
                logger.info("Migration successful: Added email_notifications column to user_profiles table")
            else:
                logger.info("Column email_notifications already exists, skipping migration")
                
            transaction.commit()
            return True
    except Exception as e:
        transaction.rollback()
        logger.error(f"Migration failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = run_migration()
    sys.exit(0 if success else 1) 