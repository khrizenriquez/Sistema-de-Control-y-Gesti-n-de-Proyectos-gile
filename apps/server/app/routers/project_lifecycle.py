"""
Endpoints para gestión del ciclo de vida de proyectos
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.database.db import get_db
from app.core.auth import get_current_user, AuthUser
from app.services.project_lifecycle import ProjectLifecycleService
from app.models.project import ProjectStatus, ProjectPriority
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from sqlalchemy.sql import text

router = APIRouter(
    prefix="/projects",
    tags=["project-lifecycle"],
    responses={404: {"description": "No encontrado"}},
)

# Schemas para requests

class ProjectStatusUpdate(BaseModel):
    status: ProjectStatus
    reason: Optional[str] = None
    completion_notes: Optional[str] = None

class ProjectDatesUpdate(BaseModel):
    start_date: Optional[datetime] = None
    planned_end_date: Optional[datetime] = None

class MilestoneCreate(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: datetime

class MilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    is_completed: Optional[bool] = None

# Schemas para responses

class ProjectHealthResponse(BaseModel):
    project_id: str
    status: str
    completion_percentage: float
    is_overdue: bool
    days_remaining: Optional[int]
    risk_level: str
    risk_factors: List[str]
    stats: Dict[str, Any]
    overdue_sprints: int
    overdue_milestones: int

class ProjectSummaryResponse(BaseModel):
    id: str
    name: str
    status: str
    completion_percentage: float
    planned_end_date: Optional[datetime]
    health: ProjectHealthResponse

# Endpoints para manejo del estado del proyecto

@router.post("/{project_id}/start")
async def start_project(
    project_id: str,
    start_date: Optional[datetime] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Iniciar un proyecto (cambiar de PLANNING a ACTIVE)"""
    
    # Verificar permisos
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin", "project_manager"])
    
    service = ProjectLifecycleService(db)
    
    try:
        success = await service.start_project(project_id, user_id, start_date)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        return {"message": "Proyecto iniciado exitosamente"}
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{project_id}/complete")
async def complete_project(
    project_id: str,
    completion_data: Optional[ProjectStatusUpdate] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Completar un proyecto exitosamente"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin", "project_manager"])
    
    service = ProjectLifecycleService(db)
    
    try:
        completion_notes = completion_data.completion_notes if completion_data else None
        success = await service.complete_project(project_id, user_id, completion_notes)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        return {"message": "Proyecto completado exitosamente"}
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{project_id}/pause")
async def pause_project(
    project_id: str,
    pause_data: Optional[ProjectStatusUpdate] = None,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pausar un proyecto temporalmente"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin", "project_manager"])
    
    service = ProjectLifecycleService(db)
    
    try:
        reason = pause_data.reason if pause_data else None
        success = await service.pause_project(project_id, user_id, reason)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        return {"message": "Proyecto pausado exitosamente"}
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{project_id}/resume")
async def resume_project(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reanudar un proyecto pausado"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin", "project_manager"])
    
    service = ProjectLifecycleService(db)
    
    try:
        success = await service.resume_project(project_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        return {"message": "Proyecto reanudado exitosamente"}
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{project_id}/cancel")
async def cancel_project(
    project_id: str,
    cancel_data: ProjectStatusUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancelar un proyecto"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin"])
    
    if not cancel_data.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere una razón para cancelar el proyecto"
        )
    
    service = ProjectLifecycleService(db)
    
    try:
        success = await service.cancel_project(project_id, user_id, cancel_data.reason)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        return {"message": "Proyecto cancelado exitosamente"}
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{project_id}/archive")
async def archive_project(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Archivar un proyecto completado o cancelado"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin"])
    
    service = ProjectLifecycleService(db)
    
    try:
        success = await service.archive_project(project_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        return {"message": "Proyecto archivado exitosamente"}
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Endpoints para manejo de fechas

@router.put("/{project_id}/dates")
async def update_project_dates(
    project_id: str,
    dates_data: ProjectDatesUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar fechas del proyecto"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin", "project_manager"])
    
    service = ProjectLifecycleService(db)
    
    try:
        success = await service.update_project_dates(
            project_id, 
            user_id, 
            dates_data.start_date, 
            dates_data.planned_end_date
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        return {"message": "Fechas del proyecto actualizadas exitosamente"}
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# Endpoints para monitoreo y salud del proyecto

@router.get("/{project_id}/health", response_model=ProjectHealthResponse)
async def get_project_health(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener estado de salud del proyecto"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_access(project_id, user_id, db)
    
    service = ProjectLifecycleService(db)
    health_data = await service.get_project_health_status(project_id)
    
    if not health_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    return health_data

@router.post("/{project_id}/update-completion")
async def update_project_completion(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Recalcular y actualizar el porcentaje de completación del proyecto"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_access(project_id, user_id, db)
    
    service = ProjectLifecycleService(db)
    completion_percentage = await service.update_completion_percentage(project_id)
    
    return {
        "project_id": project_id,
        "completion_percentage": completion_percentage,
        "message": "Porcentaje de completación actualizado"
    }

@router.get("/attention-required", response_model=List[ProjectSummaryResponse])
async def get_projects_requiring_attention(
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener proyectos que requieren atención inmediata"""
    
    user_id = await _get_user_id(current_user, db)
    user_role = await _get_user_role(current_user, db)
    
    # Solo admins y project managers pueden ver esta información
    if user_role not in ["admin", "project_manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para acceder a esta información"
        )
    
    service = ProjectLifecycleService(db)
    projects = await service.get_projects_requiring_attention()
    
    return projects

# Endpoints para gestión de hitos

@router.post("/{project_id}/milestones")
async def create_milestone(
    project_id: str,
    milestone_data: MilestoneCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un nuevo hito para el proyecto"""
    from app.models.project import ProjectMilestone
    import uuid
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin", "project_manager"])
    
    milestone = ProjectMilestone(
        id=str(uuid.uuid4()),
        project_id=project_id,
        name=milestone_data.name,
        description=milestone_data.description,
        due_date=milestone_data.due_date
    )
    
    db.add(milestone)
    db.commit()
    db.refresh(milestone)
    
    return {
        "id": milestone.id,
        "name": milestone.name,
        "description": milestone.description,
        "due_date": milestone.due_date,
        "is_completed": milestone.is_completed,
        "message": "Hito creado exitosamente"
    }

@router.get("/{project_id}/milestones")
async def get_project_milestones(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todos los hitos del proyecto"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_access(project_id, user_id, db)
    
    query = text("""
        SELECT id, name, description, due_date, completed_at, is_completed, created_at
        FROM project_milestones 
        WHERE project_id = :project_id
        ORDER BY due_date ASC
    """)
    
    result = db.execute(query, {"project_id": project_id})
    milestones = []
    
    for row in result.fetchall():
        milestones.append({
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "due_date": row[3],
            "completed_at": row[4],
            "is_completed": row[5],
            "created_at": row[6],
            "is_overdue": not row[5] and row[3] < datetime.utcnow() if row[3] else False
        })
    
    return milestones

@router.put("/{project_id}/milestones/{milestone_id}")
async def update_milestone(
    project_id: str,
    milestone_id: str,
    milestone_data: MilestoneUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar un hito del proyecto"""
    
    user_id = await _get_user_id(current_user, db)
    await _check_project_permissions(project_id, user_id, db, required_roles=["admin", "project_manager"])
    
    # Verificar que el hito existe y pertenece al proyecto
    milestone_query = text("""
        SELECT id FROM project_milestones 
        WHERE id = :milestone_id AND project_id = :project_id
    """)
    
    milestone_result = db.execute(milestone_query, {
        "milestone_id": milestone_id,
        "project_id": project_id
    })
    
    if not milestone_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hito no encontrado"
        )
    
    # Construir query de actualización dinámicamente
    updates = []
    params = {"milestone_id": milestone_id}
    
    if milestone_data.name is not None:
        updates.append("name = :name")
        params["name"] = milestone_data.name
    
    if milestone_data.description is not None:
        updates.append("description = :description")
        params["description"] = milestone_data.description
    
    if milestone_data.due_date is not None:
        updates.append("due_date = :due_date")
        params["due_date"] = milestone_data.due_date
    
    if milestone_data.is_completed is not None:
        updates.append("is_completed = :is_completed")
        params["is_completed"] = milestone_data.is_completed
        
        if milestone_data.is_completed:
            updates.append("completed_at = NOW()")
        else:
            updates.append("completed_at = NULL")
    
    if updates:
        updates.append("updated_at = NOW()")
        update_query = text(f"""
            UPDATE project_milestones 
            SET {', '.join(updates)}
            WHERE id = :milestone_id
        """)
        
        db.execute(update_query, params)
        db.commit()
    
    return {"message": "Hito actualizado exitosamente"}

# Funciones auxiliares

async def _get_user_id(current_user: AuthUser, db: Session) -> str:
    """Obtener ID del usuario actual"""
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
    
    return user_record[0]

async def _get_user_role(current_user: AuthUser, db: Session) -> str:
    """Obtener rol del usuario actual"""
    user_query = text("""
        SELECT role FROM user_profiles 
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
    
    return user_record[0]

async def _check_project_access(project_id: str, user_id: str, db: Session):
    """Verificar que el usuario tiene acceso al proyecto"""
    access_query = text("""
        SELECT 1 FROM (
            SELECT project_id FROM project_members 
            WHERE project_id = :project_id AND user_id = :user_id AND is_active = true
            UNION
            SELECT id as project_id FROM projects 
            WHERE id = :project_id AND (owner_id = :user_id OR created_by = :user_id OR project_manager_id = :user_id)
            UNION
            SELECT p.id as project_id FROM projects p
            JOIN user_profiles up ON up.id = :user_id
            WHERE p.id = :project_id AND up.role = 'admin'
        ) access_check
    """)
    
    access_result = db.execute(access_query, {"project_id": project_id, "user_id": user_id})
    
    if not access_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a este proyecto"
        )

async def _check_project_permissions(project_id: str, user_id: str, db: Session, required_roles: List[str]):
    """Verificar permisos específicos del usuario en el proyecto"""
    # Primero verificar acceso básico
    await _check_project_access(project_id, user_id, db)
    
    # Verificar roles específicos
    permission_query = text("""
        SELECT 1 FROM (
            SELECT pm.role FROM project_members pm
            WHERE pm.project_id = :project_id AND pm.user_id = :user_id AND pm.is_active = true
            AND pm.role = ANY(:required_roles)
            UNION
            SELECT 'admin' as role FROM projects p
            WHERE p.id = :project_id AND (p.owner_id = :user_id OR p.project_manager_id = :user_id)
            UNION
            SELECT up.role FROM user_profiles up
            WHERE up.id = :user_id AND up.role = 'admin'
        ) permission_check
    """)
    
    permission_result = db.execute(permission_query, {
        "project_id": project_id, 
        "user_id": user_id,
        "required_roles": required_roles
    })
    
    if not permission_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"No tienes los permisos necesarios para esta acción. Roles requeridos: {', '.join(required_roles)}"
        ) 