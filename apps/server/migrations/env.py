import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

# Importar modelos de SQLModel para que Alembic los reconozca
from app.models import *
from app.models.base import BaseModel
from sqlmodel import SQLModel
from app.core.config import settings

# Cargar configuración de alembic.ini
config = context.config

# Sobreescribir la URL con la de nuestras settings
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

# Interpretar config de logging en alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Definir el target de la migración
# Esto debe ser el mismo modelo que SQLModel crea
target_metadata = SQLModel.metadata

def run_migrations_offline() -> None:
    """Ejecutar migraciones en modo 'offline'.
    
    Esto configura el contexto con solo una URL
    y no hay Engine/Connection."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Ejecutar migraciones en modo 'online'."""
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online()) 