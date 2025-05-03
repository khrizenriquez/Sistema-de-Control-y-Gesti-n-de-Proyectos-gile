from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from typing import List
import os
import subprocess
import logging

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Eventos de inicio y cierre
@app.on_event("startup")
async def on_startup():
    logger.info("Iniciando servidor...")
    
    try:
        # En lugar de intentar verificar si las tablas existen mediante operaciones async,
        # simplemente intentaremos crear las tablas directamente.
        # Si ya existen, SQLAlchemy manejará esto sin problemas
        logger.info("Creando tablas si no existen...")
        create_db_and_tables()
        logger.info("Operación de creación de tablas completada")
    except Exception as e:
        logger.error(f"Error al crear tablas: {str(e)}")
    
    # Cargar datos de prueba si está habilitado
    load_test_data = getattr(settings, "LOAD_TEST_DATA", "false")
    if load_test_data and str(load_test_data).lower() == "true":
        logger.info("Cargando datos de prueba...")
        try:
            from app.database.seed import seed_data
            success = await seed_data()
            if success:
                logger.info("Datos de prueba cargados exitosamente")
            else:
                logger.info("No se cargaron datos de prueba (posiblemente ya existan)")
        except Exception as e:
            logger.error(f"Error cargando datos de prueba: {str(e)}")
            logger.info("Continuando sin datos de prueba")

@app.get("/")
async def root():
    return {"message": "Bienvenido al API de Gestión de Proyectos Ágiles"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.PROJECT_VERSION}

# Importar routers
from app.routers import users
# from app.routers import projects, tasks

# Incluir routers en la aplicación
app.include_router(users.router, prefix=settings.API_PREFIX)
# app.include_router(projects.router, prefix=settings.API_PREFIX)
# app.include_router(tasks.router, prefix=settings.API_PREFIX) 