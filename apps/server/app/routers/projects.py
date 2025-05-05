from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.db import get_db
from app.models.project import Project
from app.models.user import UserProfile
from app.core.auth import get_current_user, AuthUser
from typing import List, Optional
from pydantic import BaseModel
import uuid

router = APIRouter(
    prefix="/projects",
    tags=["projects"],
    responses={404: {"description": "No encontrado"}},
)

# Esquema para creación de proyecto
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

# Esquema para respuesta de proyecto
class ProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    owner_id: str
    
# Esquema para actualización de proyecto
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar todos los proyectos a los que el usuario tiene acceso"""
    # Buscar el perfil del usuario
    user_profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    # Si es admin, obtener todos los proyectos
    if user_profile.role == "admin":
        projects = db.exec(select(Project)).all()
        return [
            ProjectResponse(
                id=project.id,
                name=project.name,
                description=project.description,
                owner_id=project.owner_id
            )
            for project in projects
        ]
    
    # Si no es admin, obtener proyectos donde es dueño o miembro
    # Primero los proyectos donde es dueño
    owner_projects = db.exec(
        select(Project).where(Project.owner_id == user_profile.id)
    ).all()
    
    # TODO: Implementar la búsqueda de proyectos donde es miembro a través de ProjectMember
    
    return [
        ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            owner_id=project.owner_id
        )
        for project in owner_projects
    ]

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un nuevo proyecto"""
    # Buscar el perfil del usuario
    user_profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    # Crear el proyecto
    new_project = Project(
        id=str(uuid.uuid4()),
        name=project_data.name,
        description=project_data.description,
        owner_id=user_profile.id
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return ProjectResponse(
        id=new_project.id,
        name=new_project.name,
        description=new_project.description,
        owner_id=new_project.owner_id
    )

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener un proyecto por su ID"""
    # Buscar el perfil del usuario
    user_profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    # Buscar el proyecto
    project = db.exec(
        select(Project).where(Project.id == project_id)
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Verificar si el usuario tiene permiso para ver el proyecto
    if user_profile.role != "admin" and project.owner_id != user_profile.id:
        # TODO: Verificar si es miembro del proyecto
        # Por ahora solo el dueño y los admin pueden verlo
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este proyecto"
        )
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id
    )

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar un proyecto"""
    # Buscar el perfil del usuario
    user_profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    # Buscar el proyecto
    project = db.exec(
        select(Project).where(Project.id == project_id)
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Verificar si el usuario tiene permiso para actualizar el proyecto
    if user_profile.role != "admin" and project.owner_id != user_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar este proyecto"
        )
    
    # Actualizar los campos del proyecto
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        owner_id=project.owner_id
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar un proyecto"""
    # Buscar el perfil del usuario
    user_profile = db.exec(
        select(UserProfile).where(UserProfile.auth_id == current_user.id)
    ).first()
    
    if not user_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    # Buscar el proyecto
    project = db.exec(
        select(Project).where(Project.id == project_id)
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Verificar si el usuario tiene permiso para eliminar el proyecto
    if user_profile.role != "admin" and project.owner_id != user_profile.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este proyecto"
        )
    
    # Eliminar el proyecto
    db.delete(project)
    db.commit()
    
    return None 