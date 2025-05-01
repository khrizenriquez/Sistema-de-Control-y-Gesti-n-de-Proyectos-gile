from __future__ import annotations
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
    
    # Relaciones (sin anotaciones de tipo para evitar problemas con Python 3.11)
    owned_projects: Optional[List["Project"]] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="owner")
    memberships: Optional[List["ProjectMember"]] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="user") 