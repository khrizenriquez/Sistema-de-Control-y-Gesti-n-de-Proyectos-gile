from __future__ import annotations
from sqlmodel import Field, SQLModel, Relationship
from typing import Optional, Dict, Any, List, TYPE_CHECKING
from datetime import datetime

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
    
    # Relaciones
    project: "Project" = Relationship(back_populates="user_stories")
    tasks: list["Task"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="story", default=[])
    sprint_backlog_items: list["SprintBacklogItem"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="story", default=[])

class Sprint(BaseModel, table=True):
    """Sprint"""
    __tablename__ = "sprints"
    
    name: str
    project_id: str = Field(foreign_key="projects.id")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    goal: Optional[str] = None
    status: str = "planning"  # planning, active, completed, cancelled
    
    # Relaciones
    project: "Project" = Relationship(back_populates="sprints")
    backlog_items: list["SprintBacklogItem"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="sprint", default=[])
    metrics: list["SprintMetric"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="sprint", default=[])

class SprintBacklogItem(SQLModel, table=True):
    """Elemento del backlog de sprint"""
    __tablename__ = "sprint_backlog"
    
    sprint_id: str = Field(foreign_key="sprints.id", primary_key=True)
    story_id: str = Field(foreign_key="user_stories.id", primary_key=True)
    
    # Relaciones
    sprint: Sprint = Relationship(back_populates="backlog_items")
    story: UserStory = Relationship(back_populates="sprint_backlog_items")

class SprintMetric(BaseModel, table=True):
    """Métricas de sprint"""
    __tablename__ = "sprint_metrics"
    
    sprint_id: str = Field(foreign_key="sprints.id")
    total_stories: Optional[int] = None
    completed_stories: Optional[int] = None
    velocity: Optional[float] = None
    avg_completion_time: Optional[float] = None  # en días
    recorded_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relaciones
    sprint: Sprint = Relationship(back_populates="metrics")

class Board(BaseModel, table=True):
    """Tablero Kanban"""
    __tablename__ = "boards"
    
    name: str
    project_id: str = Field(foreign_key="projects.id")
    
    # Relaciones
    project: "Project" = Relationship(back_populates="boards")
    lists: list["List"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="board", default=[])

class List(BaseModel, table=True):
    """Lista en un tablero Kanban"""
    __tablename__ = "lists"
    
    name: str
    board_id: str = Field(foreign_key="boards.id")
    position: int = 0
    
    # Relaciones
    board: Board = Relationship(back_populates="lists")
    cards: list["Card"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="list", default=[])

class Card(BaseModel, table=True):
    """Tarjeta en una lista Kanban"""
    __tablename__ = "cards"
    
    title: str
    description: Optional[str] = None
    list_id: str = Field(foreign_key="lists.id")
    position: int = 0
    due_date: Optional[datetime] = None
    
    # Relaciones
    list: List = Relationship(back_populates="cards")
    tasks: list["Task"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="card", default=[])
    comments: list["Comment"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="card", default=[])
    labels: list["CardLabel"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="card", default=[])

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
    
    # Relaciones
    story: Optional[UserStory] = Relationship(back_populates="tasks")
    card: Optional[Card] = Relationship(back_populates="tasks")
    assignee: Optional["UserProfile"] = Relationship()

class Comment(BaseModel, table=True):
    """Comentario en una tarjeta"""
    __tablename__ = "comments"
    
    card_id: str = Field(foreign_key="cards.id")
    user_id: str = Field(foreign_key="user_profiles.id")
    content: str
    
    # Relaciones
    card: Card = Relationship(back_populates="comments")
    user: "UserProfile" = Relationship()

class Label(BaseModel, table=True):
    """Etiqueta"""
    __tablename__ = "labels"
    
    name: str
    color: Optional[str] = None
    project_id: str = Field(foreign_key="projects.id")
    
    # Relaciones
    project: "Project" = Relationship()
    card_labels: list["CardLabel"] = Relationship(sa_relationship_kwargs={"uselist": True}, back_populates="label", default=[])

class CardLabel(SQLModel, table=True):
    """Relación entre tarjeta y etiqueta"""
    __tablename__ = "card_labels"
    
    card_id: str = Field(foreign_key="cards.id", primary_key=True)
    label_id: str = Field(foreign_key="labels.id", primary_key=True)
    
    # Relaciones
    card: Card = Relationship(back_populates="labels")
    label: Label = Relationship(back_populates="card_labels") 