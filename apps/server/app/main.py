from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import os

app = FastAPI(
    title="Sistema de Control y Gestión de Proyectos Ágiles",
    description="API para gestionar proyectos con metodologías ágiles",
    version="0.1.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, restringir a dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Bienvenido al API de Gestión de Proyectos Ágiles"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Aquí se importarán los routers posteriormente
# from app.routers import projects, users, tasks

# Y se incluirán en la aplicación
# app.include_router(users.router)
# app.include_router(projects.router)
# app.include_router(tasks.router) 