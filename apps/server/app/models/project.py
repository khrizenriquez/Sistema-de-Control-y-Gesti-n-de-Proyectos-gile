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
    
    # Relaciones
    owner: UserProfile = Relationship(back_populates="owned_projects")
    members: List["ProjectMember"] = Relationship(back_populates="project")
    sprints: List["Sprint"] = Relationship(back_populates="project")
    user_stories: List["UserStory"] = Relationship(back_populates="project")
    boards: List["Board"] = Relationship(back_populates="project")

class ProjectMember(SQLModel, table=True):
    """Miembro de un proyecto"""
    __tablename__ = "project_members"
    
    project_id: str = Field(foreign_key="projects.id", primary_key=True)
    user_id: str = Field(foreign_key="user_profiles.id", primary_key=True)
    role: str = Field(default="member")  # e.g. 'owner', 'admin', 'member'
    
    # Relaciones
    project: Project = Relationship(back_populates="members")
    user: UserProfile = Relationship(back_populates="memberships") 