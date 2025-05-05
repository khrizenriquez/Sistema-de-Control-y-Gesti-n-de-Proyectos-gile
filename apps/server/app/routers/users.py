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
        # Usar SQL directo para evitar problemas con los mapeos ORM
        result = db.execute(text("""
            SELECT id, email, first_name, last_name, 
                   bio, avatar_url, role
            FROM user_profiles
        """))
        
        users = []
        for row in result:
            # Convertir filas SQL a diccionarios
            user_dict = {key: row[key] for key in row.keys()}
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
    # Solo los administradores pueden crear usuarios
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear usuarios"
        )
    
    try:
        # Usar SQL directo para evitar problemas con los mapeos ORM
        query = text("""
            INSERT INTO user_profiles (id, auth_id, first_name, last_name, email, bio, avatar_url, role, created_at, updated_at, is_active)
            VALUES (:id, :auth_id, :first_name, :last_name, :email, :bio, :avatar_url, :role, NOW(), NOW(), true)
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
            "role": user_data.role
        })
        
        db.commit()
        
        # Obtener el usuario insertado
        user_record = result.fetchone()
        if not user_record:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario: no se pudo recuperar el registro creado"
            )
            
        # Convertir fila SQL a diccionario
        user_dict = {key: user_record[key] for key in user_record.keys()}
        # Añadir el campo computado 'name'
        user_dict['name'] = f"{user_dict['first_name']} {user_dict['last_name']}"
        
        return user_dict
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear usuario: {str(e)}"
        ) 