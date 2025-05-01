from __future__ import annotations
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List
from app.models.base import BaseModel
from app.models.user import UserProfile

class Project(BaseModel, table=True):
    """Proyecto ágil"""
    __tablename__ = "projects"
    
    name: str
    description: Optional[str] = None
    owner_id: str = Field(foreign_key="user_profiles.id")
    
    # Relaciones (sin anotaciones de tipo para evitar problemas con Python 3.11)
    owner: UserProfile = Relationship(back_populates="owned_projects")
    members: Optional[List["ProjectMember"]] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="project")
    sprints: Optional[List["Sprint"]] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="project")
    user_stories: Optional[List["UserStory"]] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="project")
    boards: Optional[List["Board"]] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="project")

class ProjectMember(SQLModel, table=True):
    """Miembro de un proyecto"""
    __tablename__ = "project_members"
    
    project_id: str = Field(foreign_key="projects.id", primary_key=True)
    user_id: str = Field(foreign_key="user_profiles.id", primary_key=True)
    role: str = Field(default="member")  # e.g. 'owner', 'admin', 'member'
    
    # Relaciones
    project: Project = Relationship(back_populates="members")
    user: UserProfile = Relationship(back_populates="memberships") 