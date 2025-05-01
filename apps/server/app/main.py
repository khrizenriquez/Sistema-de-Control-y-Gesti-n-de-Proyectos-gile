from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from typing import List
import os

from app.core.config import settings
from app.database.db import create_db_and_tables

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
def on_startup():
    create_db_and_tables()

@app.get("/")
async def root():
    return {"message": "Bienvenido al API de Gestión de Proyectos Ágiles"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.PROJECT_VERSION}

# Aquí se importarán los routers posteriormente
# from app.routers import projects, users, tasks

# Y se incluirán en la aplicación
# app.include_router(users.router, prefix=settings.API_PREFIX)
# app.include_router(projects.router, prefix=settings.API_PREFIX)
# app.include_router(tasks.router, prefix=settings.API_PREFIX) 