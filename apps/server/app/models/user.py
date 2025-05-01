from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List
from app.models.base import BaseModel

class UserProfile(BaseModel, table=True):
    """Perfil de usuario vinculado a Supabase Auth"""
    __tablename__ = "user_profiles"
    
    auth_id: str = Field(index=True)  # ID de Supabase Auth
    first_name: str
    last_name: str
    email: str = Field(index=True)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    
    # Relaciones
    owned_projects: List["Project"] = Relationship(back_populates="owner")
    memberships: List["ProjectMember"] = Relationship(back_populates="user") 