from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from typing import List
import os
import subprocess
import logging
from sqlalchemy import text

from app.core.config import settings
from app.database.db import create_db_and_tables

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API para gestionar proyectos con metodologías ágiles",
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS
origins = ["*"]  # Allow all origins for debugging

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Importar routers
from app.routers import users, auth
# Importar router de proyectos si existe
# try:
#     from app.routers import projects
#     app.include_router(projects.router, prefix=settings.API_PREFIX)
#     logger.info("Router de proyectos incluido correctamente")
# except ImportError:
#     logger.warning("Router de proyectos no encontrado o con errores, no se incluirá en la API")

# Incluir routers en la aplicación
app.include_router(users.router, prefix=settings.API_PREFIX)
app.include_router(auth.router, prefix=settings.API_PREFIX)

@app.on_event("startup")
async def on_startup():
    logger.info("Iniciando servidor...")
    logger.info("Creando tablas si no existen...")
    create_db_and_tables()
    logger.info("Operación de creación de tablas completada")
    
    # Ejecutar SQL directo para asegurar que user_profiles tiene la columna role
    try:
        from app.database.db import engine
        with engine.connect() as conn:
            # Verificar si la columna role existe
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='role'"))
            if result.rowcount == 0:
                # La columna role no existe, agregarla
                logger.info("Agregando columna 'role' a la tabla user_profiles...")
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'"))
                conn.commit()
                logger.info("Columna 'role' agregada correctamente")
            else:
                logger.info("La columna 'role' ya existe en la tabla user_profiles")
    except Exception as e:
        logger.error(f"Error actualizando el esquema de la base de datos: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "Bienvenido a la API de Gestión de Proyectos Ágiles",
        "docs": "/docs",
        "status": "online",
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.PROJECT_VERSION} 