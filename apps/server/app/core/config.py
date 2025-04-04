import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Cargar variables de entorno desde el archivo .env
load_dotenv()

class Settings(BaseSettings):
    """
    Configuraciones de la aplicación obtenidas de variables de entorno
    """
    # Configuración de la API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Sistema de Control y Gestión de Proyectos Ágiles"
    
    # Configuración de seguridad
    SECRET_KEY: str = os.getenv("SECRET_KEY", "temporary_secret_key_change_this_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 días por defecto
    
    # Configuración de base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # Configuración de CORS
    BACKEND_CORS_ORIGINS: list = ["*"]

    class Config:
        case_sensitive = True

# Crear instancia global de configuración
settings = Settings() 