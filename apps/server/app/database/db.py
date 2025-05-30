from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

# Crear engine para la conexión a la base de datos (síncrono)
sync_database_url = settings.DATABASE_URL.replace(
    'postgresql+asyncpg', 'postgresql'
) if 'asyncpg' in settings.DATABASE_URL else settings.DATABASE_URL

engine = create_engine(
    sync_database_url,
    echo=settings.DEBUG,  # Mostrar consultas SQL en consola si estamos en modo debug
    pool_pre_ping=True    # Comprobar la conexión antes de usarla
)

# Engine para operaciones asíncronas (API)
# Asegurar que use asyncpg para conexiones asíncronas
async_database_url = settings.DATABASE_URL
if not async_database_url.startswith('postgresql+asyncpg://'):
    # Si no tiene el driver especificado, agregarlo
    async_database_url = async_database_url.replace('postgresql://', 'postgresql+asyncpg://')

async_engine = create_async_engine(
    async_database_url,
    echo=True,
    future=True
)

# Creador de sesiones asíncronas
async_session = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session() -> AsyncSession:
    """Proporciona una sesión de base de datos como dependencia para FastAPI"""
    async with async_session() as session:
        yield session

def create_db_and_tables():
    """Crear tablas en la base de datos si no existen"""
    try:
        logger.info("Creando tablas en la base de datos...")
        SQLModel.metadata.create_all(engine)
        logger.info("Tablas creadas exitosamente")
    except Exception as e:
        logger.error(f"Error creando tablas: {str(e)}")
        raise

def get_db():
    """
    Generador para obtener una sesión de base de datos.
    Para ser utilizado como dependencia en FastAPI.
    """
    db = Session(engine)
    try:
        yield db
    finally:
        db.close()

def get_sync_session():
    """Proporciona una sesión síncrona (para scripts, migraciones, etc.)"""
    with Session(engine) as session:
        yield session 