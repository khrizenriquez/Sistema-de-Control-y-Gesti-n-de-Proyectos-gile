from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.db import get_db
from app.models.user import UserProfile
from app.core.auth import get_current_user, AuthUser
from app.core.supabase import update_user_metadata, create_user_in_supabase
from typing import List
from pydantic import BaseModel

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "No encontrado"}},
)

# Esquema para actualizaciones de perfil
class UserProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    bio: str = None
    avatar_url: str = None

# Esquema para la respuesta de perfil
class UserProfileResponse(BaseModel):
    id: str
    auth_id: str
    first_name: str
    last_name: str
    email: str
    avatar_url: str = None
    bio: str = None
    role: str = "member"

# Esquema para actualización de rol
class UserRoleUpdate(BaseModel):
    role: str

@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene el perfil del usuario autenticado"""
    profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not profile:
        # Si el perfil no existe en la base de datos, lo creamos automáticamente
        # Esto sincroniza usuarios de Supabase con nuestra base de datos
        profile = UserProfile(
            auth_id=current_user.id,
            email=current_user.email,
            first_name=current_user.user_metadata.get("first_name", "") if current_user.user_metadata else "",
            last_name=current_user.user_metadata.get("last_name", "") if current_user.user_metadata else ""
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return UserProfileResponse(
        id=profile.id,
        auth_id=profile.auth_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        email=profile.email,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        role=profile.role
    )

@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    profile_update: UserProfileUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza el perfil del usuario autenticado"""
    profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado"
        )
    
    # Actualizar los campos
    profile.first_name = profile_update.first_name
    profile.last_name = profile_update.last_name
    if profile_update.bio is not None:
        profile.bio = profile_update.bio
    if profile_update.avatar_url is not None:
        profile.avatar_url = profile_update.avatar_url
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return UserProfileResponse(
        id=profile.id,
        auth_id=profile.auth_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        email=profile.email,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        role=profile.role
    )

@router.put("/me/role", response_model=UserProfileResponse)
async def update_my_role(
    role_update: UserRoleUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza el rol del usuario autenticado"""
    profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil no encontrado"
        )
    
    # Validar rol
    valid_roles = ["admin", "developer", "product_owner", "member"]
    if role_update.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}"
        )
    
    # Actualizar el rol
    profile.role = role_update.role
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return UserProfileResponse(
        id=profile.id,
        auth_id=profile.auth_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        email=profile.email,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        role=profile.role
    )

@router.put("/{user_id}/role", response_model=UserProfileResponse)
async def update_user_role(
    user_id: str,
    role_update: UserRoleUpdate,
    update_metadata: bool = False,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualiza el rol de un usuario (solo administradores)"""
    # Verificar que el usuario actual es administrador
    admin_profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not admin_profile or admin_profile.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden modificar roles de usuarios"
        )
    
    # Encontrar el perfil del usuario a actualizar
    profile = db.exec(
        select(UserProfile).where(UserProfile.id == user_id)
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Validar rol
    valid_roles = ["admin", "developer", "product_owner", "member"]
    if role_update.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}"
        )
    
    # Actualizar el rol en la base de datos
    profile.role = role_update.role
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    # Si se solicitó actualizar los metadatos en Supabase Auth
    if update_metadata:
        # Actualizar metadatos en Supabase Auth
        await update_user_metadata(profile.auth_id, {"role": role_update.role})
    
    return UserProfileResponse(
        id=profile.id,
        auth_id=profile.auth_id,
        first_name=profile.first_name,
        last_name=profile.last_name,
        email=profile.email,
        avatar_url=profile.avatar_url,
        bio=profile.bio,
        role=profile.role
    )

# Endpoint para crear un nuevo usuario (solo para administradores)
class CreateUserRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str
    bio: str = None
    avatar_url: str = None

@router.post("/", response_model=UserProfileResponse)
async def create_user(
    user_data: CreateUserRequest,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crea un nuevo usuario (solo administradores)"""
    # Verificar que el usuario actual es administrador
    admin_profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not admin_profile or admin_profile.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear usuarios"
        )
    
    # Validar rol
    valid_roles = ["admin", "developer", "product_owner", "member"]
    if user_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}"
        )
    
    # Preparar metadatos de usuario
    user_metadata = {
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "full_name": f"{user_data.first_name} {user_data.last_name}",
        "role": user_data.role
    }
    
    try:
        # Crear usuario en Supabase Auth
        supabase_response = await create_user_in_supabase(
            email=user_data.email,
            password=user_data.password,
            metadata=user_metadata
        )
        
        if not supabase_response:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario en Supabase Auth"
            )
        
        # Obtener ID del usuario creado en Supabase
        if isinstance(supabase_response, dict):
            auth_id = supabase_response.get("id") or supabase_response.get("user", {}).get("id")
            if not auth_id:
                print(f"Advertencia: No se pudo extraer el auth_id de la respuesta: {supabase_response}")
                auth_id = f"supabase-auth-id-{user_data.email}"
        else:
            print(f"Advertencia: Respuesta inesperada de Supabase: {type(supabase_response)}")
            auth_id = f"supabase-auth-id-{user_data.email}"
        
        # Crear perfil en nuestra base de datos
        new_profile = UserProfile(
            auth_id=auth_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            bio=user_data.bio,
            avatar_url=user_data.avatar_url,
            role=user_data.role
        )
        
        db.add(new_profile)
        db.commit()
        db.refresh(new_profile)
        
        return UserProfileResponse(
            id=new_profile.id,
            auth_id=new_profile.auth_id,
            first_name=new_profile.first_name,
            last_name=new_profile.last_name,
            email=new_profile.email,
            avatar_url=new_profile.avatar_url,
            bio=new_profile.bio,
            role=new_profile.role
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear usuario: {str(e)}"
        )

@router.get("/", response_model=List[UserProfileResponse])
async def list_users(
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar todos los usuarios (solo administradores)"""
    # Verificar que el usuario actual es administrador
    admin_profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not admin_profile or admin_profile.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden listar usuarios"
        )
    
    # Obtener todos los perfiles
    profiles = db.exec(select(UserProfile)).all()
    
    return [
        UserProfileResponse(
            id=profile.id,
            auth_id=profile.auth_id,
            first_name=profile.first_name,
            last_name=profile.last_name,
            email=profile.email,
            avatar_url=profile.avatar_url,
            bio=profile.bio,
            role=profile.role
        )
        for profile in profiles
    ] 