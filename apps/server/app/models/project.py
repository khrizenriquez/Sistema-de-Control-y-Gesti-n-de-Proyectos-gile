from __future__ import annotations
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List, TYPE_CHECKING
from typing_extensions import Annotated
from sqlalchemy.orm import Mapped, relationship

# Usar TYPE_CHECKING para evitar importaciones circulares
if TYPE_CHECKING:
    from app.models.user import UserProfile
    from app.models.agile import Sprint, UserStory, Board

from app.models.base import BaseModel

class Project(BaseModel, table=True):
    """Proyecto ágil"""
    __tablename__ = "projects"
    
    name: str
    description: Optional[str] = None
    owner_id: str = Field(foreign_key="user_profiles.id")
    created_by: Optional[str] = Field(default=None, foreign_key="user_profiles.id")
    
    # Relaciones
    owner = Relationship(
        sa_relationship=relationship("UserProfile", back_populates="owned_projects", foreign_keys=[owner_id])
    )
    
    creator = Relationship(
        sa_relationship=relationship("UserProfile", foreign_keys=[created_by])
    )
    
    members = Relationship(
        sa_relationship=relationship("ProjectMember", back_populates="project")
    )
    
    sprints = Relationship(
        sa_relationship=relationship("Sprint", back_populates="project")
    )
    
    user_stories = Relationship(
        sa_relationship=relationship("UserStory", back_populates="project")
    )
    
    boards = Relationship(
        sa_relationship=relationship("Board", back_populates="project")
    )
    
    def __repr__(self) -> str:
        return f"<Project id={self.id} name={self.name}>"

class ProjectMember(BaseModel, table=True):
    """Miembro de un proyecto con su rol"""
    __tablename__ = "project_members"
    
    user_id: str = Field(foreign_key="user_profiles.id")
    project_id: str = Field(foreign_key="projects.id")
    role: str = Field(default="member")  # developer, product_owner, member
    
    # Relaciones
    user = Relationship(
        sa_relationship=relationship("UserProfile", back_populates="project_memberships")
    )
    
    project = Relationship(
        sa_relationship=relationship("Project", back_populates="members")
    )
    
    def __repr__(self) -> str:
        return f"<ProjectMember id={self.id} role={self.role}>" 