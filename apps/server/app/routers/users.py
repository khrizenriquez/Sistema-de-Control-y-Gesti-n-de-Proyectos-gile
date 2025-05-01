from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.db import get_db
from app.models.user import UserProfile
from app.core.auth import get_current_user, AuthUser
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
        bio=profile.bio
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
        bio=profile.bio
    ) 