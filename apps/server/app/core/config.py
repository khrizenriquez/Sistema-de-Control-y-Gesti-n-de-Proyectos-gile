import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Cargar variables de entorno desde .env
load_dotenv()

class Settings(BaseModel):
    # App general
    PROJECT_NAME: str = os.getenv("APP_NAME", "Sistema de Control y Gestión de Proyectos Ágiles")
    PROJECT_VERSION: str = os.getenv("APP_VERSION", "0.1.0")
    API_PREFIX: str = os.getenv("API_PREFIX", "/api")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mysecretkey")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/agile_db"
    )
    DATABASE_RESET: bool = os.getenv("DATABASE_RESET", "false").lower() == "true"
    
    # Supabase
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Migraciones y datos de prueba
    LOAD_TEST_DATA: str = os.getenv("LOAD_TEST_DATA", "false")

# Crear instancia de configuración
settings = Settings() 