import logging
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Run the migration to create the notifications table if it doesn't exist"""
    
    # Crear el engine de la base de datos
    engine = create_engine(settings.DATABASE_URL)
    
    # Query para verificar si la tabla existe
    check_table_query = text("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications'
        );
    """)
    
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            # Verificar si la tabla ya existe
            result = connection.execute(check_table_query)
            table_exists = result.fetchone()[0]
            
            if not table_exists:
                # Crear la tabla de notificaciones
                connection.execute(text("""
                    CREATE TABLE notifications (
                        id UUID PRIMARY KEY,
                        user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
                        content TEXT NOT NULL,
                        type VARCHAR(50) NOT NULL,
                        entity_id UUID NOT NULL,
                        data JSONB,
                        read BOOLEAN NOT NULL DEFAULT FALSE,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        is_active BOOLEAN NOT NULL DEFAULT TRUE
                    )
                """))
                
                # Crear índices para optimizar consultas
                connection.execute(text("""
                    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
                """))
                
                connection.execute(text("""
                    CREATE INDEX idx_notifications_read ON notifications(read);
                """))
                
                connection.execute(text("""
                    CREATE INDEX idx_notifications_created_at ON notifications(created_at);
                """))
                
                logger.info("Migration successful: Created notifications table with indexes")
            else:
                logger.info("Table notifications already exists, skipping migration")
                
            transaction.commit()
            return True
        except Exception as e:
            transaction.rollback()
            logger.error(f"Migration failed: {str(e)}")
            return False

if __name__ == "__main__":
    success = run_migration()
    if success:
        logger.info("Notifications table migration completed successfully")
    else:
        logger.error("Notifications table migration failed") 