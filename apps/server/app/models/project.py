from __future__ import annotations
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List, TYPE_CHECKING

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
    
    # Relaciones con anotaciones de tipo mejoradas
    owner: "UserProfile" = Relationship(back_populates="owned_projects")
    members: list["ProjectMember"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="project", default=[])
    sprints: list["Sprint"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="project", default=[])
    user_stories: list["UserStory"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="project", default=[])
    boards: list["Board"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="project", default=[])

class ProjectMember(SQLModel, table=True):
    """Miembro de un proyecto"""
    __tablename__ = "project_members"
    
    project_id: str = Field(foreign_key="projects.id", primary_key=True)
    user_id: str = Field(foreign_key="user_profiles.id", primary_key=True)
    role: str = Field(default="member")  # e.g. 'owner', 'admin', 'member'
    
    # Relaciones
    project: Project = Relationship(back_populates="members")
    user: "UserProfile" = Relationship(back_populates="memberships") 