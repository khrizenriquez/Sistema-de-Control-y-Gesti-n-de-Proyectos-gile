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
    
    # Apitally (Observabilidad)
    APITALLY_CLIENT_ID: str = os.getenv("APITALLY_CLIENT_ID", "")
    APITALLY_ENV: str = os.getenv("APITALLY_ENV", "dev")
    ENABLE_APITALLY: bool = os.getenv("ENABLE_APITALLY", "false").lower() == "true"
    
    # Mailjet (Email)
    MAILJET_API_KEY: str = os.getenv("MAILJET_API_KEY", "")
    MAILJET_SECRET_KEY: str = os.getenv("MAILJET_SECRET_KEY", "")
    ENABLE_EMAIL_NOTIFICATIONS: bool = os.getenv("ENABLE_EMAIL_NOTIFICATIONS", "false").lower() == "true"
    FROM_EMAIL: str = os.getenv("FROM_EMAIL", "noreply@tu-dominio.com")
    FROM_NAME: str = os.getenv("FROM_NAME", "Sistema de Gestión de Proyectos")
    
    # Migraciones y datos de prueba
    LOAD_TEST_DATA: str = os.getenv("LOAD_TEST_DATA", "false")

# Crear instancia de configuración
settings = Settings() 