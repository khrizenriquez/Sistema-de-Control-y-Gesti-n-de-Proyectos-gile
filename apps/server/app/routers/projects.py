from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.db import get_db
from app.models.project import Project, ProjectMember
from app.models.user import UserProfile
from app.core.auth import get_current_user, AuthUser
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.sql import text
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
    # Usar SQL directo para obtener el ID y rol del usuario
    user_query = text("""
        SELECT id, role FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Si es admin, obtener todos los proyectos donde es dueño (cada admin ve sus propios proyectos)
    if user_role == "admin":
        projects_query = text("""
            SELECT id, name, description, owner_id 
            FROM projects
            WHERE owner_id = :user_id
            ORDER BY created_at DESC
        """)
        result = db.execute(projects_query, {"user_id": local_user_id})
    else:
        # Si no es admin, obtener proyectos donde es dueño o miembro
        projects_query = text("""
            SELECT p.id, p.name, p.description, p.owner_id 
            FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE p.owner_id = :user_id OR pm.user_id = :user_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        """)
        result = db.execute(projects_query, {"user_id": local_user_id})
    
    projects = []
    for row in result:
        project = {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "owner_id": row[3]
        }
        projects.append(project)
    
    return projects

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un nuevo proyecto"""
    # Usar SQL directo para obtener el ID y rol del usuario
    user_query = text("""
        SELECT id, role FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    
    # Generar un ID para el proyecto
    project_id = str(uuid.uuid4())
    
    # Crear el proyecto usando SQL directo
    project_query = text("""
        INSERT INTO projects (id, name, description, owner_id, created_at, updated_at, is_active)
        VALUES (:id, :name, :description, :owner_id, NOW(), NOW(), true)
        RETURNING id, name, description, owner_id
    """)
    
    result = db.execute(project_query, {
        "id": project_id,
        "name": project_data.name,
        "description": project_data.description,
        "owner_id": local_user_id
    })
    
    db.commit()
    
    # Obtener el proyecto creado
    project_record = result.fetchone()
    
    if not project_record:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear proyecto"
        )
    
    # Convertir resultado a diccionario
    project = {
        "id": project_record[0],
        "name": project_record[1],
        "description": project_record[2],
        "owner_id": project_record[3]
    }
    
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener un proyecto por su ID"""
    # Usar SQL directo para obtener el ID y rol del usuario
    user_query = text("""
        SELECT id, role FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Buscar el proyecto
    project_query = text("""
        SELECT id, name, description, owner_id 
        FROM projects
        WHERE id = :project_id
    """)
    project_result = db.execute(project_query, {"project_id": project_id})
    project_record = project_result.fetchone()
    
    if not project_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Verificar si el usuario tiene permiso para ver el proyecto
    if user_role != "admin" and project_record[3] != local_user_id:
        # Verificar si es miembro del proyecto
        member_query = text("""
            SELECT 1 FROM project_members
            WHERE project_id = :project_id AND user_id = :user_id
        """)
        member_result = db.execute(member_query, {"project_id": project_id, "user_id": local_user_id})
        
        if not member_result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este proyecto"
            )
    
    # Convertir resultado a diccionario
    project = {
        "id": project_record[0],
        "name": project_record[1],
        "description": project_record[2],
        "owner_id": project_record[3]
    }
    
    return project

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar un proyecto"""
    # Usar SQL directo para obtener el ID y rol del usuario
    user_query = text("""
        SELECT id, role FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Buscar el proyecto
    project_query = text("""
        SELECT id, name, description, owner_id 
        FROM projects
        WHERE id = :project_id
    """)
    project_result = db.execute(project_query, {"project_id": project_id})
    project_record = project_result.fetchone()
    
    if not project_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Verificar si el usuario tiene permiso para actualizar el proyecto
    if user_role != "admin" and project_record[3] != local_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para actualizar este proyecto"
        )
    
    # Actualizar los campos del proyecto
    update_fields = {}
    update_sql = ["updated_at = NOW()"]
    
    if project_data.name is not None:
        update_fields["name"] = project_data.name
        update_sql.append("name = :name")
    
    if project_data.description is not None:
        update_fields["description"] = project_data.description
        update_sql.append("description = :description")
    
    if update_fields:
        update_query = text(f"""
            UPDATE projects
            SET {', '.join(update_sql)}
            WHERE id = :project_id
            RETURNING id, name, description, owner_id
        """)
        
        update_fields["project_id"] = project_id
        result = db.execute(update_query, update_fields)
        db.commit()
        
        updated_project = result.fetchone()
        
        # Convertir resultado a diccionario
        project = {
            "id": updated_project[0],
            "name": updated_project[1],
            "description": updated_project[2],
            "owner_id": updated_project[3]
        }
        
        return project
    
    # Si no hay cambios, devolver el proyecto sin modificar
    return {
        "id": project_record[0],
        "name": project_record[1],
        "description": project_record[2],
        "owner_id": project_record[3]
    }

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar un proyecto"""
    # Usar SQL directo para obtener el ID y rol del usuario
    user_query = text("""
        SELECT id, role FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Buscar el proyecto
    project_query = text("""
        SELECT id, owner_id 
        FROM projects
        WHERE id = :project_id
    """)
    project_result = db.execute(project_query, {"project_id": project_id})
    project_record = project_result.fetchone()
    
    if not project_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Verificar si el usuario tiene permiso para eliminar el proyecto
    # Solo el dueño o un admin pueden eliminar un proyecto
    if user_role != "admin" and project_record[1] != local_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar este proyecto"
        )
    
    # Eliminar el proyecto (borrado lógico, cambiar is_active a false)
    delete_query = text("""
        UPDATE projects
        SET is_active = false, updated_at = NOW()
        WHERE id = :project_id
    """)
    
    db.execute(delete_query, {"project_id": project_id})
    db.commit()
    
    return 