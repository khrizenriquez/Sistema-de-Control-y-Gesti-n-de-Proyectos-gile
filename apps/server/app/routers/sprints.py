from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.db import get_db
from app.models.agile import Sprint, UserStory, SprintBacklogItem
from app.models.project import Project
from app.core.auth import get_current_user, AuthUser
from typing import List as TypeList, Optional
from pydantic import BaseModel
from sqlalchemy.sql import text
import uuid
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/sprints",
    tags=["sprints"],
    responses={404: {"description": "No encontrado"}},
)

class SprintCreate(BaseModel):
    name: str
    project_id: str
    goal: Optional[str] = None
    duration_weeks: Optional[int] = 2  # Duración en semanas (por defecto 2 semanas)
    start_date: Optional[datetime] = None

class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None

class SprintResponse(BaseModel):
    id: str
    name: str
    project_id: str
    goal: Optional[str]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    status: str
    duration_days: Optional[int]
    stories_count: int
    completed_stories_count: int
    created_at: datetime

@router.post("/", response_model=SprintResponse)
async def create_sprint(
    sprint_data: SprintCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un nuevo sprint"""
    
    # Verificar que el proyecto existe
    project_query = text("SELECT id FROM projects WHERE id = :project_id")
    project_result = db.execute(project_query, {"project_id": sprint_data.project_id})
    
    if not project_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Verificar permisos del usuario en el proyecto
    user_query = text("""
        SELECT id FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    user_id = user_record[0]
    
    # Verificar que el usuario tiene permisos en el proyecto
    permission_query = text("""
        SELECT 1 FROM (
            SELECT 1 FROM project_members 
            WHERE project_id = :project_id AND user_id = :user_id
            UNION
            SELECT 1 FROM projects 
            WHERE id = :project_id AND (owner_id = :user_id OR created_by = :user_id)
            UNION
            SELECT 1 FROM user_profiles 
            WHERE id = :user_id AND role = 'admin'
        ) access_check
    """)
    
    permission_result = db.execute(permission_query, {
        "project_id": sprint_data.project_id,
        "user_id": user_id
    })
    
    if not permission_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear sprints en este proyecto"
        )
    
    # Calcular fechas del sprint
    start_date = sprint_data.start_date or datetime.utcnow()
    duration_days = (sprint_data.duration_weeks or 2) * 7
    end_date = start_date + timedelta(days=duration_days)
    
    # Crear el sprint
    sprint_id = str(uuid.uuid4())
    
    create_sprint_query = text("""
        INSERT INTO sprints (id, name, project_id, goal, start_date, end_date, status, is_active, created_at, updated_at)
        VALUES (:id, :name, :project_id, :goal, :start_date, :end_date, 'planning', true, NOW(), NOW())
        RETURNING id, name, project_id, goal, start_date, end_date, status, created_at
    """)
    
    result = db.execute(create_sprint_query, {
        "id": sprint_id,
        "name": sprint_data.name,
        "project_id": sprint_data.project_id,
        "goal": sprint_data.goal,
        "start_date": start_date,
        "end_date": end_date
    })
    
    db.commit()
    
    sprint_record = result.fetchone()
    
    return {
        "id": sprint_record[0],
        "name": sprint_record[1],
        "project_id": sprint_record[2],
        "goal": sprint_record[3],
        "start_date": sprint_record[4],
        "end_date": sprint_record[5],
        "status": sprint_record[6],
        "duration_days": duration_days,
        "stories_count": 0,
        "completed_stories_count": 0,
        "created_at": sprint_record[7]
    }

@router.get("/project/{project_id}", response_model=TypeList[SprintResponse])
async def get_project_sprints(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todos los sprints de un proyecto"""
    
    # Verificar acceso al proyecto
    user_query = text("""
        SELECT id FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    user_id = user_record[0]
    
    permission_query = text("""
        SELECT 1 FROM (
            SELECT 1 FROM project_members 
            WHERE project_id = :project_id AND user_id = :user_id
            UNION
            SELECT 1 FROM projects 
            WHERE id = :project_id AND (owner_id = :user_id OR created_by = :user_id)
            UNION
            SELECT 1 FROM user_profiles 
            WHERE id = :user_id AND role = 'admin'
        ) access_check
    """)
    
    permission_result = db.execute(permission_query, {
        "project_id": project_id,
        "user_id": user_id
    })
    
    if not permission_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este proyecto"
        )
    
    # Obtener sprints con estadísticas
    sprints_query = text("""
        SELECT 
            s.id, s.name, s.project_id, s.goal, s.start_date, s.end_date, s.status, s.created_at,
            COUNT(sb.story_id) as stories_count,
            COUNT(CASE WHEN us.status = 'done' THEN 1 END) as completed_stories_count
        FROM sprints s
        LEFT JOIN sprint_backlog sb ON s.id = sb.sprint_id
        LEFT JOIN user_stories us ON sb.story_id = us.id
        WHERE s.project_id = :project_id
        GROUP BY s.id, s.name, s.project_id, s.goal, s.start_date, s.end_date, s.status, s.created_at
        ORDER BY s.created_at DESC
    """)
    
    result = db.execute(sprints_query, {"project_id": project_id})
    
    sprints = []
    for row in result:
        duration_days = None
        if row[4] and row[5]:  # start_date and end_date
            duration_days = (row[5] - row[4]).days
        
        sprints.append({
            "id": row[0],
            "name": row[1],
            "project_id": row[2],
            "goal": row[3],
            "start_date": row[4],
            "end_date": row[5],
            "status": row[6],
            "duration_days": duration_days,
            "stories_count": row[8],
            "completed_stories_count": row[9],
            "created_at": row[7]
        })
    
    return sprints

@router.post("/{sprint_id}/start")
async def start_sprint(
    sprint_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Iniciar un sprint"""
    
    # Verificar que el sprint existe
    sprint_query = text("""
        SELECT s.id, s.project_id, s.status 
        FROM sprints s 
        WHERE s.id = :sprint_id
    """)
    sprint_result = db.execute(sprint_query, {"sprint_id": sprint_id})
    sprint_record = sprint_result.fetchone()
    
    if not sprint_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint no encontrado"
        )
    
    if sprint_record[2] != "planning":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden iniciar sprints en estado 'planning'"
        )
    
    # Verificar permisos
    user_query = text("""
        SELECT id FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    user_id = user_record[0]
    
    permission_query = text("""
        SELECT 1 FROM (
            SELECT 1 FROM project_members 
            WHERE project_id = :project_id AND user_id = :user_id AND role IN ('product_owner', 'scrum_master')
            UNION
            SELECT 1 FROM projects 
            WHERE id = :project_id AND (owner_id = :user_id OR created_by = :user_id)
            UNION
            SELECT 1 FROM user_profiles 
            WHERE id = :user_id AND role = 'admin'
        ) access_check
    """)
    
    permission_result = db.execute(permission_query, {
        "project_id": sprint_record[1],
        "user_id": user_id
    })
    
    if not permission_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo Product Owners, Scrum Masters o Administradores pueden iniciar sprints"
        )
    
    # Finalizar cualquier sprint activo en el mismo proyecto
    finalize_active_query = text("""
        UPDATE sprints 
        SET status = 'completed', updated_at = NOW()
        WHERE project_id = :project_id AND status = 'active'
    """)
    db.execute(finalize_active_query, {"project_id": sprint_record[1]})
    
    # Iniciar el sprint
    start_sprint_query = text("""
        UPDATE sprints 
        SET status = 'active', updated_at = NOW()
        WHERE id = :sprint_id
    """)
    db.execute(start_sprint_query, {"sprint_id": sprint_id})
    
    db.commit()
    
    return {"message": "Sprint iniciado exitosamente"}

@router.post("/{sprint_id}/complete")
async def complete_sprint(
    sprint_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Completar un sprint"""
    
    # Similar al start_sprint pero cambiando estado a 'completed'
    sprint_query = text("""
        SELECT s.id, s.project_id, s.status 
        FROM sprints s 
        WHERE s.id = :sprint_id
    """)
    sprint_result = db.execute(sprint_query, {"sprint_id": sprint_id})
    sprint_record = sprint_result.fetchone()
    
    if not sprint_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint no encontrado"
        )
    
    if sprint_record[2] != "active":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden completar sprints activos"
        )
    
    # Completar el sprint
    complete_sprint_query = text("""
        UPDATE sprints 
        SET status = 'completed', updated_at = NOW()
        WHERE id = :sprint_id
    """)
    db.execute(complete_sprint_query, {"sprint_id": sprint_id})
    
    db.commit()
    
    return {"message": "Sprint completado exitosamente"}

@router.post("/{sprint_id}/stories/{story_id}")
async def add_story_to_sprint(
    sprint_id: str,
    story_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Agregar una historia de usuario al sprint"""
    
    # Verificar que ambos existen
    verify_query = text("""
        SELECT s.id, s.project_id, us.id, us.project_id
        FROM sprints s, user_stories us
        WHERE s.id = :sprint_id AND us.id = :story_id
    """)
    
    verify_result = db.execute(verify_query, {
        "sprint_id": sprint_id,
        "story_id": story_id
    })
    verify_record = verify_result.fetchone()
    
    if not verify_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint o historia no encontrada"
        )
    
    if verify_record[1] != verify_record[3]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El sprint y la historia deben pertenecer al mismo proyecto"
        )
    
    # Agregar al backlog del sprint
    add_to_backlog_query = text("""
        INSERT INTO sprint_backlog (sprint_id, story_id)
        VALUES (:sprint_id, :story_id)
        ON CONFLICT DO NOTHING
    """)
    
    db.execute(add_to_backlog_query, {
        "sprint_id": sprint_id,
        "story_id": story_id
    })
    
    # Actualizar estado de la historia
    update_story_query = text("""
        UPDATE user_stories 
        SET status = 'sprint', updated_at = NOW()
        WHERE id = :story_id
    """)
    
    db.execute(update_story_query, {"story_id": story_id})
    
    db.commit()
    
    return {"message": "Historia agregada al sprint exitosamente"} 