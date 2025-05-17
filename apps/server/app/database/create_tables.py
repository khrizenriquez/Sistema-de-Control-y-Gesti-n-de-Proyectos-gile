from sqlalchemy import create_engine, MetaData, Table, Column, String, Integer, ForeignKey, Text, Boolean, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings
import datetime
import logging
from sqlalchemy import text
from sqlmodel import SQLModel
from app.database.db import engine

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Engine para operaciones síncronas
sync_database_url = settings.DATABASE_URL.replace(
    'postgresql+asyncpg', 'postgresql'
)
engine = create_engine(sync_database_url, echo=True)

# Crear el metadata y base
metadata = MetaData()
Base = declarative_base()

# Definir tablas usando SQLAlchemy Core (sin typing complejo)
user_profiles = Table(
    'user_profiles', metadata,
    Column('id', String, primary_key=True),
    Column('auth_id', String, index=True),
    Column('first_name', String),
    Column('last_name', String),
    Column('email', String, index=True),
    Column('avatar_url', String, nullable=True),
    Column('bio', Text, nullable=True),
    Column('role', String, default='member'),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

projects = Table(
    'projects', metadata,
    Column('id', String, primary_key=True),
    Column('name', String),
    Column('description', Text, nullable=True),
    Column('owner_id', String, ForeignKey('user_profiles.id')),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

project_members = Table(
    'project_members', metadata,
    Column('project_id', String, ForeignKey('projects.id'), primary_key=True),
    Column('user_id', String, ForeignKey('user_profiles.id'), primary_key=True),
    Column('role', String, default='member')
)

user_stories = Table(
    'user_stories', metadata,
    Column('id', String, primary_key=True),
    Column('title', String),
    Column('description', Text, nullable=True),
    Column('project_id', String, ForeignKey('projects.id')),
    Column('status', String, default='backlog'),
    Column('priority', Integer, nullable=True),
    Column('story_points', Integer, nullable=True),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de Sprints
sprints = Table(
    'sprints', metadata,
    Column('id', String, primary_key=True),
    Column('name', String),
    Column('project_id', String, ForeignKey('projects.id')),
    Column('start_date', DateTime, nullable=True),
    Column('end_date', DateTime, nullable=True),
    Column('goal', Text, nullable=True),
    Column('status', String, default='planning'),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de relación entre Sprint y UserStories
sprint_backlog = Table(
    'sprint_backlog', metadata,
    Column('sprint_id', String, ForeignKey('sprints.id'), primary_key=True),
    Column('story_id', String, ForeignKey('user_stories.id'), primary_key=True)
)

# Tabla de Métricas del Sprint
sprint_metrics = Table(
    'sprint_metrics', metadata,
    Column('id', String, primary_key=True),
    Column('sprint_id', String, ForeignKey('sprints.id')),
    Column('total_stories', Integer, nullable=True),
    Column('completed_stories', Integer, nullable=True),
    Column('velocity', Float, nullable=True),
    Column('avg_completion_time', Float, nullable=True),
    Column('recorded_at', DateTime, default=datetime.datetime.utcnow),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de Tableros Kanban
boards = Table(
    'boards', metadata,
    Column('id', String, primary_key=True),
    Column('name', String),
    Column('project_id', String, ForeignKey('projects.id')),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de Listas Kanban
lists = Table(
    'lists', metadata,
    Column('id', String, primary_key=True),
    Column('name', String),
    Column('board_id', String, ForeignKey('boards.id')),
    Column('position', Integer, default=0),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de Tarjetas Kanban
cards = Table(
    'cards', metadata,
    Column('id', String, primary_key=True),
    Column('title', String),
    Column('description', Text, nullable=True),
    Column('list_id', String, ForeignKey('lists.id')),
    Column('position', Integer, default=0),
    Column('due_date', DateTime, nullable=True),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de Tareas
tasks = Table(
    'tasks', metadata,
    Column('id', String, primary_key=True),
    Column('title', String),
    Column('description', Text, nullable=True),
    Column('story_id', String, ForeignKey('user_stories.id'), nullable=True),
    Column('card_id', String, ForeignKey('cards.id'), nullable=True),
    Column('status', String, default='todo'),
    Column('assignee_id', String, ForeignKey('user_profiles.id'), nullable=True),
    Column('estimate', Integer, nullable=True),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de Comentarios
comments = Table(
    'comments', metadata,
    Column('id', String, primary_key=True),
    Column('card_id', String, ForeignKey('cards.id')),
    Column('user_id', String, ForeignKey('user_profiles.id')),
    Column('content', Text),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de Etiquetas
labels = Table(
    'labels', metadata,
    Column('id', String, primary_key=True),
    Column('name', String),
    Column('color', String, nullable=True),
    Column('project_id', String, ForeignKey('projects.id')),
    Column('created_at', DateTime, default=datetime.datetime.utcnow),
    Column('updated_at', DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
)

# Tabla de relación entre Tarjetas y Etiquetas
card_labels = Table(
    'card_labels', metadata,
    Column('card_id', String, ForeignKey('cards.id'), primary_key=True),
    Column('label_id', String, ForeignKey('labels.id'), primary_key=True)
)

# Tabla de Registro de Actividades
activity_logs = Table(
    'activity_logs', metadata,
    Column('id', String, primary_key=True),
    Column('user_id', String, ForeignKey('user_profiles.id')),
    Column('project_id', String, ForeignKey('projects.id')),
    Column('action_type', String),  # e.g. 'create', 'update', 'delete'
    Column('entity_type', String),  # e.g. 'task', 'story', 'sprint'
    Column('entity_id', String),
    Column('description', Text),
    Column('created_at', DateTime, default=datetime.datetime.utcnow)
)

def add_role_column_if_not_exists():
    """Agregar columna role si no existe y asignar roles correctos a usuarios por defecto"""
    try:
        with engine.connect() as conn:
            # Verificar si la columna role existe
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='role'"))
            rows = result.fetchall()
            
            if len(rows) == 0:
                # La columna role no existe, agregarla
                logger.info("Agregando columna 'role' a la tabla user_profiles...")
                conn.execute(text("ALTER TABLE user_profiles ADD COLUMN role VARCHAR(50) DEFAULT 'member'"))
                conn.commit()
                logger.info("Columna 'role' agregada correctamente")
            
            # Asegurar que los usuarios tengan los roles correctos según sus correos
            logger.info("Verificando y actualizando roles de usuarios predefinidos...")
            
            # Actualizar rol del admin
            conn.execute(text("""
                UPDATE user_profiles
                SET role = 'admin'
                WHERE email = 'admin@ingsistemas.gt' AND (role IS NULL OR role != 'admin')
            """))
            
            # Actualizar rol del desarrollador
            conn.execute(text("""
                UPDATE user_profiles
                SET role = 'developer'
                WHERE email = 'dev@ingsistemas.gt' AND (role IS NULL OR role != 'developer')
            """))
            
            # Actualizar rol del product owner
            conn.execute(text("""
                UPDATE user_profiles
                SET role = 'product_owner'
                WHERE email = 'pm@ingsistemas.gt' AND (role IS NULL OR role != 'product_owner')
            """))
            
            # Actualizar rol del miembro regular
            conn.execute(text("""
                UPDATE user_profiles
                SET role = 'member'
                WHERE email = 'member@ingsistemas.gt' AND (role IS NULL OR role != 'member')
            """))
            
            conn.commit()
            logger.info("Roles de usuarios predefinidos actualizados correctamente")
            
    except Exception as e:
        logger.error(f"Error al verificar/agregar la columna role o actualizar roles: {e}")

def create_tables():
    """Crear tablas en la base de datos"""
    try:
        # Usar SQLModel para crear las tablas
        from app.models import (
            BaseModel, UserProfile, Project, ProjectMember,
            UserStory, Sprint, SprintBacklogItem, SprintMetric,
            Board, List, Card, Task, Comment, Label, CardLabel
        )
        
        # Si se solicita resetear la base de datos, eliminar tablas primero
        if settings.DATABASE_RESET:
            logger.warning("Reseteando base de datos por configuración DATABASE_RESET=true")
            SQLModel.metadata.drop_all(engine)
            
        # Crear tablas
        metadata = SQLModel.metadata
        metadata.create_all(engine)
        
        # Después de crear las tablas, asegurar que el campo role existe
        add_role_column_if_not_exists()
        
        return True
    except Exception as e:
        logger.error(f"Error al crear tablas: {e}")
        raise

if __name__ == '__main__':
    create_tables() 