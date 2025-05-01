from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "Sistema de Control y Gestión de Proyectos Ágiles"
    PROJECT_VERSION: str = "0.1.0"
    API_PREFIX: str = "/api"
    
    # Configuración de base de datos
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+asyncpg://agileuser:agilepassword@db:5432/agiledb"
    )
    
    # Configuración Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Configuración JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "temporary_secret_key_change_this_in_production")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 día
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings() 