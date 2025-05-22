from __future__ import annotations
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from datetime import datetime
from sqlalchemy.orm import relationship

# Usar TYPE_CHECKING para evitar importaciones circulares
if TYPE_CHECKING:
    from app.models.project import Project
    from app.models.user import UserProfile

from app.models.base import BaseModel

class UserStory(BaseModel, table=True):
    """Historia de usuario"""
    __tablename__ = "user_stories"
    
    title: str
    description: Optional[str] = None
    project_id: str = Field(foreign_key="projects.id")
    status: str = "backlog"  # backlog, sprint, in_progress, done
    priority: Optional[int] = None
    story_points: Optional[int] = None
    
    # Relaciones - usar relationship de sqlalchemy para mayor control
    project = Relationship(sa_relationship=relationship("Project", back_populates="user_stories"))
    tasks: List["Task"] = Relationship(sa_relationship=relationship("Task", back_populates="story"))
    sprint_backlog_items: List["SprintBacklogItem"] = Relationship(sa_relationship=relationship("SprintBacklogItem", back_populates="story"))

class Sprint(BaseModel, table=True):
    """Sprint"""
    __tablename__ = "sprints"
    
    name: str
    project_id: str = Field(foreign_key="projects.id")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    goal: Optional[str] = None
    status: str = "planning"  # planning, active, completed, cancelled
    
    # Relaciones - usar mismo patrón que UserStory
    project = Relationship(sa_relationship=relationship("Project", back_populates="sprints"))
    backlog_items: List["SprintBacklogItem"] = Relationship(sa_relationship=relationship("SprintBacklogItem", back_populates="sprint"))
    metrics: List["SprintMetric"] = Relationship(sa_relationship=relationship("SprintMetric", back_populates="sprint"))

class SprintBacklogItem(SQLModel, table=True):
    """Elemento del backlog de sprint"""
    __tablename__ = "sprint_backlog"
    
    sprint_id: str = Field(foreign_key="sprints.id", primary_key=True)
    story_id: str = Field(foreign_key="user_stories.id", primary_key=True)
    
    # Relaciones - usar relationship de sqlalchemy para mayor control
    sprint = Relationship(sa_relationship=relationship("Sprint", back_populates="backlog_items"))
    story = Relationship(sa_relationship=relationship("UserStory", back_populates="sprint_backlog_items"))

class SprintMetric(BaseModel, table=True):
    """Métricas de sprint"""
    __tablename__ = "sprint_metrics"
    
    sprint_id: str = Field(foreign_key="sprints.id")
    total_stories: Optional[int] = None
    completed_stories: Optional[int] = None
    velocity: Optional[float] = None
    avg_completion_time: Optional[float] = None  # en días
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones - usar mismo patrón que los demás modelos
    sprint = Relationship(sa_relationship=relationship("Sprint", back_populates="metrics"))

class Board(BaseModel, table=True):
    """Tablero Kanban"""
    __tablename__ = "boards"
    
    name: str
    project_id: str = Field(foreign_key="projects.id")
    
    # Relaciones - usar mismo patrón que UserStory
    project = Relationship(sa_relationship=relationship("Project", back_populates="boards"))
    lists: List["List"] = Relationship(sa_relationship=relationship("List", back_populates="board"))

class List(BaseModel, table=True):
    """Lista en un tablero Kanban"""
    __tablename__ = "lists"
    
    name: str
    board_id: str = Field(foreign_key="boards.id")
    position: int = 0
    
    # Relaciones - usar mismo patrón que los demás modelos
    board = Relationship(sa_relationship=relationship("Board", back_populates="lists"))
    cards: List["Card"] = Relationship(sa_relationship=relationship("Card", back_populates="list"))

class Card(BaseModel, table=True):
    """Tarjeta en una lista Kanban"""
    __tablename__ = "cards"
    
    title: str
    description: Optional[str] = None
    list_id: str = Field(foreign_key="lists.id")
    position: int = 0
    due_date: Optional[datetime] = None
    assignee_id: Optional[str] = Field(default=None, foreign_key="user_profiles.id")
    cover_color: Optional[str] = None
    
    # Relaciones - usar mismo patrón que los demás modelos
    list = Relationship(sa_relationship=relationship("List", back_populates="cards"))
    tasks: List["Task"] = Relationship(sa_relationship=relationship("Task", back_populates="card"))
    comments: List["Comment"] = Relationship(sa_relationship=relationship("Comment", back_populates="card"))
    labels: List["CardLabel"] = Relationship(sa_relationship=relationship("CardLabel", back_populates="card"))
    assignee = Relationship(sa_relationship=relationship("UserProfile", foreign_keys=[assignee_id]))

class Task(BaseModel, table=True):
    """Tarea"""
    __tablename__ = "tasks"
    
    title: str
    description: Optional[str] = None
    story_id: Optional[str] = Field(default=None, foreign_key="user_stories.id")
    card_id: Optional[str] = Field(default=None, foreign_key="cards.id")
    status: str = "todo"  # todo, in_progress, done
    assignee_id: Optional[str] = Field(default=None, foreign_key="user_profiles.id")
    estimate: Optional[int] = None  # en horas o puntos
    
    # Relaciones - usar relationship de sqlalchemy para mayor control
    story = Relationship(sa_relationship=relationship("UserStory", back_populates="tasks"))
    card = Relationship(sa_relationship=relationship("Card", back_populates="tasks"))
    assignee = Relationship(sa_relationship=relationship("UserProfile"))

class Comment(BaseModel, table=True):
    """Comentario en una tarjeta"""
    __tablename__ = "comments"
    
    card_id: str = Field(foreign_key="cards.id")
    user_id: str = Field(foreign_key="user_profiles.id")
    content: str
    
    # Relaciones - usar mismo patrón que los demás modelos
    card = Relationship(sa_relationship=relationship("Card", back_populates="comments"))
    user = Relationship(sa_relationship=relationship("UserProfile"))

class Label(BaseModel, table=True):
    """Etiqueta"""
    __tablename__ = "labels"
    
    name: str
    color: Optional[str] = None
    project_id: str = Field(foreign_key="projects.id")
    
    # Relaciones - usar mismo patrón que los demás modelos
    project = Relationship(sa_relationship=relationship("Project"))
    card_labels: List["CardLabel"] = Relationship(sa_relationship=relationship("CardLabel", back_populates="label"))

class CardLabel(SQLModel, table=True):
    """Relación entre tarjeta y etiqueta"""
    __tablename__ = "card_labels"
    
    card_id: str = Field(foreign_key="cards.id", primary_key=True)
    label_id: str = Field(foreign_key="labels.id", primary_key=True)
    
    # Relaciones - usar mismo patrón que los demás modelos
    card = Relationship(sa_relationship=relationship("Card", back_populates="labels"))
    label = Relationship(sa_relationship=relationship("Label", back_populates="card_labels")) 