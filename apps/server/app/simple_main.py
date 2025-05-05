from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
import os
import logging
import psycopg2
from psycopg2.extras import RealDictCursor

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title="Sistema de Gestión Ágil",
    description="API para gestionar proyectos con metodologías ágiles",
    version="0.1.0",
    openapi_url="/api/openapi.json",
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

# Configuración de base de datos
DB_USER = os.getenv("POSTGRES_USER", "agileuser")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "agilepassword")
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")  # Using localhost for direct connection
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "agiledb")
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Database URL: {DATABASE_URL}")

def get_db_connection():
    try:
        # Give more details in the error message for debugging
        logger.info(f"Trying to connect to database with URL: {DATABASE_URL}")
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not connect to database: {str(e)}"
        )

# Modelos de datos para la API
class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "member"
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

@app.on_event("startup")
async def on_startup():
    logger.info("Iniciando servidor...")
    
    # Verificar conexión a la base de datos
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verificar si la columna role existe
        cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='user_profiles' AND column_name='role'
        """)
        if cursor.rowcount == 0:
            # La columna role no existe, añadirla
            logger.info("Añadiendo columna role a user_profiles...")
            cursor.execute("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'member'")
            conn.commit()
        
        # Crear tabla de user_profiles si no existe
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                auth_id VARCHAR(255),
                email VARCHAR(255) NOT NULL UNIQUE,
                first_name VARCHAR(255) NOT NULL,
                last_name VARCHAR(255) NOT NULL,
                bio TEXT,
                avatar_url TEXT,
                role VARCHAR(50) DEFAULT 'member',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """)
        conn.commit()
        
        # Verificar si ya hay usuarios
        cursor.execute("SELECT COUNT(*) as count FROM user_profiles")
        result = cursor.fetchone()
        if result and result["count"] == 0:
            # Crear usuarios de ejemplo
            logger.info("Creando usuarios de prueba...")
            admin_id = str(uuid.uuid4())
            dev_id = str(uuid.uuid4())
            po_id = str(uuid.uuid4())
            member_id = str(uuid.uuid4())
            
            # Insert each user separately to avoid ON CONFLICT issues
            cursor.execute("""
                INSERT INTO user_profiles (id, auth_id, email, first_name, last_name, role)
                VALUES (%s, %s, 'admin@example.com', 'Admin', 'User', 'admin')
                ON CONFLICT (email) DO NOTHING
            """, (admin_id, admin_id))
            
            cursor.execute("""
                INSERT INTO user_profiles (id, auth_id, email, first_name, last_name, role)
                VALUES (%s, %s, 'developer@example.com', 'Developer', 'User', 'developer')
                ON CONFLICT (email) DO NOTHING
            """, (dev_id, dev_id))
            
            cursor.execute("""
                INSERT INTO user_profiles (id, auth_id, email, first_name, last_name, role)
                VALUES (%s, %s, 'po@example.com', 'Product', 'Owner', 'product_owner')
                ON CONFLICT (email) DO NOTHING
            """, (po_id, po_id))
            
            cursor.execute("""
                INSERT INTO user_profiles (id, auth_id, email, first_name, last_name, role)
                VALUES (%s, %s, 'member@example.com', 'Team', 'Member', 'member')
                ON CONFLICT (email) DO NOTHING
            """, (member_id, member_id))
            
            conn.commit()
        
        cursor.close()
        conn.close()
        
        logger.info("Conexión a la base de datos verificada correctamente")
    except Exception as e:
        logger.error(f"Error inicializando la base de datos: {str(e)}")

@app.get("/")
async def root():
    return {
        "message": "Bienvenido a la API de Gestión de Proyectos Ágiles",
        "docs": "/docs",
        "status": "online",
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}

@app.get("/api/users/", response_model=List[UserResponse])
async def list_users():
    """Lista todos los usuarios registrados"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT id, email, first_name, last_name, role, bio, avatar_url
            FROM user_profiles
        """)
        
        users = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return users
    except Exception as e:
        logger.error(f"Error al listar usuarios: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar usuarios: {str(e)}"
        )

@app.post("/api/auth/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    """Registra un nuevo usuario en el sistema"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Validar rol
        valid_roles = ["developer", "product_owner", "member", "admin"]
        if user_data.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}"
            )
        
        # Generar IDs
        user_id = str(uuid.uuid4())
        auth_id = str(uuid.uuid4())  # En una implementación real, este vendría de Supabase
        
        # Insertar usuario
        cursor.execute("""
            INSERT INTO user_profiles (id, auth_id, email, first_name, last_name, role, bio, avatar_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, email, first_name, last_name, role, bio, avatar_url
        """, (
            user_id, 
            auth_id, 
            user_data.email, 
            user_data.first_name, 
            user_data.last_name, 
            user_data.role, 
            user_data.bio, 
            user_data.avatar_url
        ))
        
        new_user = cursor.fetchone()
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return new_user
    except psycopg2.errors.UniqueViolation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    except Exception as e:
        logger.error(f"Error al registrar usuario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar usuario: {str(e)}"
        ) 