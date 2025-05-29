from __future__ import annotations
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, List, TYPE_CHECKING
from typing_extensions import Annotated
from sqlalchemy.orm import Mapped, relationship
from datetime import datetime
from enum import Enum

# Usar TYPE_CHECKING para evitar importaciones circulares
if TYPE_CHECKING:
    from app.models.user import UserProfile
    from app.models.agile import Sprint, UserStory, Board

from app.models.base import BaseModel

class ProjectStatus(str, Enum):
    """Estados del proyecto"""
    PLANNING = "planning"        # En planificación inicial
    ACTIVE = "active"           # Proyecto activo en desarrollo
    ON_HOLD = "on_hold"         # Proyecto pausado temporalmente
    COMPLETED = "completed"     # Proyecto completado exitosamente
    CANCELLED = "cancelled"     # Proyecto cancelado antes de completar
    ARCHIVED = "archived"       # Proyecto archivado

class ProjectPriority(str, Enum):
    """Prioridades del proyecto"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Project(BaseModel, table=True):
    """Proyecto ágil con gestión completa del ciclo de vida"""
    __tablename__ = "projects"
    
    name: str
    description: Optional[str] = None
    owner_id: str = Field(foreign_key="user_profiles.id")
    created_by: Optional[str] = Field(default=None, foreign_key="user_profiles.id")
    
    # Gestión del ciclo de vida del proyecto
    status: ProjectStatus = Field(default=ProjectStatus.PLANNING)
    priority: ProjectPriority = Field(default=ProjectPriority.MEDIUM)
    
    # Fechas importantes del proyecto
    start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None  # Fecha planificada de finalización
    actual_end_date: Optional[datetime] = None   # Fecha real de finalización
    archived_at: Optional[datetime] = None       # Fecha de archivado
    
    # Métricas y progreso
    completion_percentage: float = Field(default=0.0)  # Porcentaje de completación (0-100)
    budget: Optional[float] = None                      # Presupuesto estimado
    actual_cost: Optional[float] = None                 # Costo real
    
    # Metadatos adicionales
    tags: Optional[str] = None                          # Tags separados por comas
    client_name: Optional[str] = None                   # Nombre del cliente
    project_manager_id: Optional[str] = Field(default=None, foreign_key="user_profiles.id")
    
    # Campos heredados de BaseModel para borrado lógico
    is_active: bool = Field(default=True)  # Mantener compatibilidad con código existente
    
    # Relaciones
    owner = Relationship(
        sa_relationship=relationship("UserProfile", back_populates="owned_projects", foreign_keys=[owner_id])
    )
    
    creator = Relationship(
        sa_relationship=relationship("UserProfile", foreign_keys=[created_by])
    )
    
    project_manager = Relationship(
        sa_relationship=relationship("UserProfile", foreign_keys=[project_manager_id])
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
    
    milestones = Relationship(
        sa_relationship=relationship("ProjectMilestone", back_populates="project")
    )
    
    def is_overdue(self) -> bool:
        """Verificar si el proyecto está atrasado"""
        if not self.planned_end_date:
            return False
        return datetime.utcnow() > self.planned_end_date and self.status not in [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED, ProjectStatus.ARCHIVED]
    
    def days_remaining(self) -> Optional[int]:
        """Calcular días restantes hasta la fecha planificada de finalización"""
        if not self.planned_end_date:
            return None
        if self.status in [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED, ProjectStatus.ARCHIVED]:
            return 0
        delta = self.planned_end_date - datetime.utcnow()
        return max(0, delta.days)
    
    def can_be_archived(self) -> bool:
        """Verificar si el proyecto puede ser archivado"""
        return self.status in [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED]
    
    def __repr__(self) -> str:
        return f"<Project id={self.id} name={self.name} status={self.status}>"

class ProjectMilestone(BaseModel, table=True):
    """Hitos del proyecto para tracking de fechas importantes"""
    __tablename__ = "project_milestones"
    
    project_id: str = Field(foreign_key="projects.id")
    name: str
    description: Optional[str] = None
    due_date: datetime
    completed_at: Optional[datetime] = None
    is_completed: bool = Field(default=False)
    
    # Relaciones
    project = Relationship(
        sa_relationship=relationship("Project", back_populates="milestones")
    )
    
    def is_overdue(self) -> bool:
        """Verificar si el hito está atrasado"""
        return not self.is_completed and datetime.utcnow() > self.due_date
    
    def __repr__(self) -> str:
        return f"<ProjectMilestone id={self.id} name={self.name} completed={self.is_completed}>"

class ProjectMember(BaseModel, table=True):
    """Miembro de un proyecto con su rol"""
    __tablename__ = "project_members"
    
    user_id: str = Field(foreign_key="user_profiles.id")
    project_id: str = Field(foreign_key="projects.id")
    role: str = Field(default="member")  # developer, product_owner, scrum_master, member
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: Optional[datetime] = None   # Para tracking histórico de membresía
    is_active: bool = Field(default=True)
    
    # Relaciones
    user = Relationship(
        sa_relationship=relationship("UserProfile", back_populates="project_memberships")
    )
    
    project = Relationship(
        sa_relationship=relationship("Project", back_populates="members")
    )
    
    def __repr__(self) -> str:
        return f"<ProjectMember id={self.id} role={self.role} active={self.is_active}>"

class ProjectActivity(BaseModel, table=True):
    """Log de actividades del proyecto para auditoría"""
    __tablename__ = "project_activities"
    
    project_id: str = Field(foreign_key="projects.id")
    user_id: str = Field(foreign_key="user_profiles.id")
    activity_type: str  # created, status_changed, member_added, milestone_completed, etc.
    description: str
    extra_data: Optional[str] = None  # JSON string con datos adicionales
    
    # Relaciones
    project = Relationship(
        sa_relationship=relationship("Project")
    )
    
    user = Relationship(
        sa_relationship=relationship("UserProfile")
    )
    
    def __repr__(self) -> str:
        return f"<ProjectActivity id={self.id} type={self.activity_type}>" 