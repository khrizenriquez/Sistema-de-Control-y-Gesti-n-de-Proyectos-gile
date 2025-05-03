from __future__ import annotations
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List, TYPE_CHECKING
from app.models.base import BaseModel

# Usar TYPE_CHECKING para evitar importaciones circulares
if TYPE_CHECKING:
    from app.models.project import Project, ProjectMember

class UserProfile(BaseModel, table=True):
    """Perfil de usuario vinculado a Supabase Auth"""
    __tablename__ = "user_profiles"
    
    auth_id: str = Field(index=True)  # ID de Supabase Auth
    first_name: str
    last_name: str
    email: str = Field(index=True)
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    role: str = Field(default="member", index=True)  # Valores posibles: 'admin', 'developer', 'product_owner', 'member'
    
    # Relaciones
    owned_projects: list["Project"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="owner")
    memberships: list["ProjectMember"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="user") 