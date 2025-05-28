from __future__ import annotations
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List, TYPE_CHECKING
from app.models.base import BaseModel
from sqlalchemy.orm import relationship

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
    role: str = Field(default="member")  # Por defecto, el rol es "member"
    email_notifications: bool = Field(default=True)  # Habilitar notificaciones por email
    
    # Relaciones
    owned_projects = Relationship(
        sa_relationship=relationship("Project", back_populates="owner", foreign_keys="[Project.owner_id]")
    )
    
    project_memberships = Relationship(
        sa_relationship=relationship("ProjectMember", back_populates="user")
    )
    
    def __repr__(self) -> str:
        return f"<UserProfile id={self.id} email={self.email} role={self.role}>" 