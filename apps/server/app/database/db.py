from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Engine para operaciones síncronas (migraciones, etc.)
sync_database_url = settings.DATABASE_URL.replace(
    'postgresql+asyncpg', 'postgresql'
)
sync_engine = create_engine(sync_database_url, echo=True)

# Engine para operaciones asíncronas (API)
async_engine = create_async_engine(
    settings.DATABASE_URL,
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
    """Crea todas las tablas definidas en los modelos SQLModel"""
    SQLModel.metadata.create_all(sync_engine)

def get_sync_session():
    """Proporciona una sesión síncrona (para scripts, migraciones, etc.)"""
    with Session(sync_engine) as session:
        yield session 