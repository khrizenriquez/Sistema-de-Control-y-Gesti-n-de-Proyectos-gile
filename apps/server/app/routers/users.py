from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.sql import text
import uuid

from app.database.db import get_db
from app.core.auth import get_current_user, AuthUser

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

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
    name: Optional[str] = None  # Computed field
    role: Optional[str] = "member"
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

@router.get("/", response_model=List[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """Lista todos los usuarios registrados"""
    try:
        # Imprimir información para debugging
        print(f"Listando usuarios. Usuario actual: {current_user.email if current_user else 'No autenticado'}")
        
        # Obtener el rol y el ID del usuario actual de la base de datos local
        user_query = text("""
            SELECT id, role FROM user_profiles 
            WHERE auth_id = :auth_id OR email = :email
            LIMIT 1
        """)
        user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
        user_record = user_result.fetchone()
        
        if not user_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado en la base de datos local"
            )
        
        local_user_id = user_record[0]
        user_role = user_record[1]
        
        # Si el usuario no es administrador, lanzar error 403
        if user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los administradores pueden listar usuarios"
            )
        
        # Los administradores solo ven usuarios que ellos mismos han creado
        # o que no tienen un creator_id (usuarios del sistema o creados por registro)
        result = db.execute(text("""
            SELECT 
                id, 
                email, 
                first_name, 
                last_name, 
                bio, 
                avatar_url, 
                role
            FROM user_profiles
            WHERE creator_id = :admin_id OR creator_id IS NULL
            ORDER BY created_at DESC
        """), {"admin_id": local_user_id})
        
        users = []
        row_count = 0
        for row in result:
            row_count += 1
            # Acceder a las columnas por índice o nombre directamente
            user_dict = {
                "id": row[0],  # o row.id
                "email": row[1],  # o row.email
                "first_name": row[2],  # o row.first_name
                "last_name": row[3],  # o row.last_name
                "bio": row[4],  # o row.bio
                "avatar_url": row[5],  # o row.avatar_url
                "role": row[6],  # o row.role
            }
            
            # Añadir el campo computado 'name'
            user_dict['name'] = f"{user_dict['first_name']} {user_dict['last_name']}"
            users.append(user_dict)
        
        print(f"Total de usuarios encontrados: {row_count}")
        return users
    except Exception as e:
        print(f"Error al listar usuarios: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar usuarios: {str(e)}"
        )

# Endpoint sin autenticación para pruebas
@router.get("/debug/list", response_model=List[UserResponse])
async def debug_list_users(
    db: Session = Depends(get_db)
):
    """Lista todos los usuarios (endpoint de prueba sin autenticación)"""
    try:
        # Usar SQL directo con etiquetas explícitas para columnas
        result = db.execute(text("""
            SELECT 
                id, 
                email, 
                first_name, 
                last_name, 
                bio, 
                avatar_url, 
                role
            FROM user_profiles
        """))
        
        users = []
        for row in result:
            # Acceder a las columnas por índice o nombre directamente
            user_dict = {
                "id": row[0],
                "email": row[1],
                "first_name": row[2],
                "last_name": row[3],
                "bio": row[4],
                "avatar_url": row[5],
                "role": row[6]
            }
            
            # Añadir el campo computado 'name'
            user_dict['name'] = f"{user_dict['first_name']} {user_dict['last_name']}"
            users.append(user_dict)
            
        return users
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar usuarios: {str(e)}"
        )

@router.post("/", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: AuthUser = Depends(get_current_user)
):
    """Crea un nuevo usuario (requiere ser administrador)"""
    # Validar el rol solicitado - no se puede crear admin desde este endpoint
    if user_data.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pueden crear administradores desde este endpoint. Use /register para crear administradores."
        )
    
    # Obtener el rol y el ID del usuario actual de la base de datos local
    user_query = text("""
        SELECT id, role FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado en la base de datos local"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Solo los administradores pueden crear usuarios
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear usuarios"
        )
    
    try:
        # Usar SQL directo para evitar problemas con los mapeos ORM
        query = text("""
            INSERT INTO user_profiles (
                id, auth_id, first_name, last_name, email, bio, avatar_url, role, 
                created_at, updated_at, is_active, creator_id
            )
            VALUES (
                :id, :auth_id, :first_name, :last_name, :email, :bio, :avatar_url, :role, 
                NOW(), NOW(), true, :creator_id
            )
            RETURNING id, email, first_name, last_name, bio, avatar_url, role
        """)
        
        result = db.execute(query, {
            "id": str(uuid.uuid4()),
            "auth_id": str(uuid.uuid4()),  # En una implementación real, este vendría de Supabase
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "email": user_data.email,
            "bio": user_data.bio,
            "avatar_url": user_data.avatar_url,
            "role": user_data.role,
            "creator_id": local_user_id  # Guardar qué admin creó este usuario
        })
        
        db.commit()
        
        # Obtener el usuario insertado
        user_record = result.fetchone()
        if not user_record:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario: no se pudo recuperar el registro creado"
            )
            
        # Convertir fila SQL a diccionario usando la misma técnica que en list_users
        user_dict = {
            "id": user_record[0], 
            "email": user_record[1],
            "first_name": user_record[2],
            "last_name": user_record[3],
            "bio": user_record[4],
            "avatar_url": user_record[5],
            "role": user_record[6]
        }
        
        # Añadir el campo computado 'name'
        user_dict['name'] = f"{user_dict['first_name']} {user_dict['last_name']}"
        
        return user_dict
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear usuario: {str(e)}"
        ) 