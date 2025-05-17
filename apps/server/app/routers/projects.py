from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.db import get_db
from app.models.project import Project, ProjectMember
from app.models.user import UserProfile
from app.core.auth import get_current_user, AuthUser
from typing import List as TypeList, Optional
from pydantic import BaseModel
from sqlalchemy.sql import text
import uuid
from datetime import datetime

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
    created_at: str
    created_by: str
    
# Esquema para actualización de proyecto
class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

@router.get("/", response_model=TypeList[ProjectResponse])
async def list_projects(
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar proyectos según el rol del usuario"""
    
    # Obtener el rol y el ID del usuario
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
            detail="Usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Diferentes queries según rol
    if user_role == "admin":
        # Admin: Ver todos los proyectos que ha creado
        projects_query = text("""
            SELECT p.id, p.name, p.description, p.created_at, up.email as creator
            FROM projects p
            JOIN user_profiles up ON p.created_by = up.id
            WHERE p.created_by = :user_id AND p.is_active = true
            ORDER BY p.created_at DESC
        """)
        result = db.execute(projects_query, {"user_id": local_user_id})
    elif user_role == "product_owner":
        # Product Owner: Ver proyectos donde es miembro como product_owner
        # Y también ver proyectos creados por el administrador que añadió al usuario como product_owner
        projects_query = text("""
            SELECT DISTINCT p.id, p.name, p.description, p.created_at, up.email as creator
            FROM projects p
            JOIN user_profiles up ON p.created_by = up.id
            LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = :user_id
            WHERE (
                (pm.user_id = :user_id AND pm.role = 'product_owner') -- Proyectos donde es miembro como product_owner
                OR 
                p.created_by IN (
                    -- Obtener los admin_ids que tienen a este product_owner como miembro en algún proyecto
                    SELECT DISTINCT p2.created_by
                    FROM projects p2
                    JOIN project_members pm2 ON p2.id = pm2.project_id
                    WHERE pm2.user_id = :user_id AND pm2.role = 'product_owner'
                )
            ) 
            AND p.is_active = true
            ORDER BY p.created_at DESC
        """)
        result = db.execute(projects_query, {"user_id": local_user_id})
    else:
        # Developer/Member: Ver proyectos donde es miembro
        projects_query = text("""
            SELECT p.id, p.name, p.description, p.created_at, up.email as creator
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            JOIN user_profiles up ON p.created_by = up.id
            WHERE pm.user_id = :user_id AND p.is_active = true
            ORDER BY p.created_at DESC
        """)
        result = db.execute(projects_query, {"user_id": local_user_id})
    
    projects = []
    for row in result:
        project = {
            "id": row[0],
            "name": row[1],
            "description": row[2],
            "created_at": row[3].isoformat(),
            "created_by": row[4]
        }
        projects.append(project)
    
    return projects

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un nuevo proyecto (requiere ser admin)"""
    
    # Obtener el rol y el ID del usuario
    user_query = text("""
        SELECT id, role, email FROM user_profiles 
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
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    user_email = user_record[2]
    
    # Verificar que el usuario es admin
    if user_role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los administradores pueden crear proyectos"
        )
    
    # Crear el proyecto
    project_id = str(uuid.uuid4())
    current_time = datetime.now()
    
    create_project_query = text("""
        INSERT INTO projects (id, name, description, created_at, updated_at, is_active, created_by, owner_id)
        VALUES (:id, :name, :description, :created_at, :updated_at, true, :created_by, :owner_id)
        RETURNING id, name, description, created_at, created_by
    """)
    
    result = db.execute(create_project_query, {
        "id": project_id,
        "name": project_data.name,
        "description": project_data.description,
        "created_at": current_time,
        "updated_at": current_time,
        "created_by": local_user_id,
        "owner_id": local_user_id  # Asignar el mismo usuario como propietario
    })
    
    db.commit()
    
    project_record = result.fetchone()
    
    return {
        "id": project_record[0],
        "name": project_record[1],
        "description": project_record[2],
        "created_at": project_record[3].isoformat(),
        "created_by": user_email
    }

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener un proyecto por su ID"""
    
    # Obtener el proyecto
    project_query = text("""
        SELECT p.id, p.name, p.description, p.created_at, up.email as creator
        FROM projects p
        JOIN user_profiles up ON p.created_by = up.id
        WHERE p.id = :project_id AND p.is_active = true
    """)
    project_result = db.execute(project_query, {"project_id": project_id})
    project_record = project_result.fetchone()
    
    if not project_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Obtener el rol y el ID del usuario
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
            detail="Usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Si no es admin, verificar si es miembro del proyecto
    if user_role != "admin":
        member_query = text("""
            SELECT 1 FROM project_members
            WHERE project_id = :project_id AND user_id = :user_id
        """)
        member_result = db.execute(member_query, {
            "project_id": project_id, 
            "user_id": local_user_id
        })
        
        if not member_result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para ver este proyecto"
            )
    
    return {
        "id": project_record[0],
        "name": project_record[1],
        "description": project_record[2],
        "created_at": project_record[3].isoformat(),
        "created_by": project_record[4]
    }

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

@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
async def add_project_member(
    project_id: str,
    member_email: str,
    role: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Añadir un miembro al proyecto"""
    
    # Verificar que el rol es válido
    valid_roles = ["product_owner", "developer", "member"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rol no válido. Debe ser uno de: {', '.join(valid_roles)}"
        )
    
    # Obtener el rol y el ID del usuario actual
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
            detail="Usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Verificar que el usuario tiene permisos para añadir miembros
    # Solo admins o product owners del proyecto pueden añadir miembros
    if user_role != "admin":
        # Verificar si es product_owner del proyecto
        member_query = text("""
            SELECT 1 FROM project_members
            WHERE project_id = :project_id AND user_id = :user_id AND role = 'product_owner'
        """)
        member_result = db.execute(member_query, {
            "project_id": project_id, 
            "user_id": local_user_id
        })
        
        if not member_result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los administradores o product owners del proyecto pueden añadir miembros"
            )
    
    # Obtener el ID del usuario a añadir por su email
    member_user_query = text("""
        SELECT id FROM user_profiles 
        WHERE email = :email
        LIMIT 1
    """)
    member_user_result = db.execute(member_user_query, {"email": member_email})
    member_user_record = member_user_result.fetchone()
    
    if not member_user_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con email {member_email} no encontrado"
        )
    
    member_user_id = member_user_record[0]
    
    # Verificar que no existe ya como miembro
    existing_query = text("""
        SELECT 1 FROM project_members
        WHERE project_id = :project_id AND user_id = :user_id
    """)
    existing_result = db.execute(existing_query, {
        "project_id": project_id, 
        "user_id": member_user_id
    })
    
    if existing_result.fetchone():
        # Actualizar su rol
        update_query = text("""
            UPDATE project_members
            SET role = :role
            WHERE project_id = :project_id AND user_id = :user_id
        """)
        
        db.execute(update_query, {
            "project_id": project_id,
            "user_id": member_user_id,
            "role": role
        })
        
        db.commit()
        
        return {"message": f"Rol de usuario actualizado a {role}"}
    
    # Añadir como miembro
    current_time = datetime.now()
    
    add_query = text("""
        INSERT INTO project_members (id, project_id, user_id, role, created_at)
        VALUES (:id, :project_id, :user_id, :role, :created_at)
    """)
    
    db.execute(add_query, {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "user_id": member_user_id,
        "role": role,
        "created_at": current_time
    })
    
    db.commit()
    
    return {"message": f"Usuario añadido como {role}"}

@router.get("/{project_id}/members", response_model=TypeList[dict])
async def get_project_members(
    project_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener los miembros de un proyecto"""
    # Obtener el ID y rol del usuario
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
            detail="Usuario no encontrado"
        )
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Verificar que el proyecto existe
    project_query = text("""
        SELECT id FROM projects
        WHERE id = :project_id AND is_active = true
    """)
    project_result = db.execute(project_query, {"project_id": project_id})
    project_record = project_result.fetchone()
    
    if not project_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Verificar que el usuario tiene acceso al proyecto
    if user_role != "admin":
        access_query = text("""
            SELECT 1 FROM project_members
            WHERE project_id = :project_id AND user_id = :user_id
        """)
        access_result = db.execute(access_query, {
            "project_id": project_id,
            "user_id": local_user_id
        })
        
        if not access_result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a este proyecto"
            )
    
    # Obtener los miembros del proyecto
    members_query = text("""
        SELECT pm.id, pm.user_id, up.email, pm.role, pm.created_at
        FROM project_members pm
        JOIN user_profiles up ON pm.user_id = up.id
        WHERE pm.project_id = :project_id
        ORDER BY pm.created_at DESC
    """)
    members_result = db.execute(members_query, {"project_id": project_id})
    
    members = []
    for row in members_result:
        member = {
            "id": row[0],
            "user_id": row[1],
            "email": row[2],
            "role": row[3],
            "added_at": row[4].isoformat()
        }
        members.append(member)
    
    return members 