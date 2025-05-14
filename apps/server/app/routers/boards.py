from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.db import get_db
from app.models.agile import Board, List, Card
from app.models.project import Project, ProjectMember
from app.models.user import UserProfile
from app.core.auth import get_current_user, AuthUser
from typing import List as TypeList, Optional
from pydantic import BaseModel
from sqlalchemy.sql import text
import uuid

router = APIRouter(
    prefix="/boards",
    tags=["boards"],
    responses={404: {"description": "No encontrado"}},
)

# Esquemas para las peticiones y respuestas
class BoardCreate(BaseModel):
    name: str
    project_id: str
    template: Optional[str] = "kanban"  # kanban o scrum

class BoardResponse(BaseModel):
    id: str
    name: str
    project_id: str
    created_at: str
    
class BoardListResponse(BaseModel):
    id: str
    name: str
    project_id: str
    project_name: str
    created_at: str
    template: str

async def is_product_owner_or_admin(
    project_id: str,
    current_user: AuthUser,
    db: Session
) -> bool:
    """Verifica si el usuario es product_owner o admin del proyecto"""
    
    # Obtener el rol y el ID del usuario
    user_query = text("""
        SELECT id, role FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    user_result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
    user_record = user_result.fetchone()
    
    if not user_record:
        return False
    
    local_user_id = user_record[0]
    user_role = user_record[1]
    
    # Si es admin, permitir acceso
    if user_role == "admin":
        return True
    
    # Verificar si es product_owner del proyecto
    member_query = text("""
        SELECT role FROM project_members
        WHERE project_id = :project_id AND user_id = :user_id
        LIMIT 1
    """)
    member_result = db.execute(member_query, {
        "project_id": project_id, 
        "user_id": local_user_id
    })
    member_record = member_result.fetchone()
    
    if not member_record or member_record[0] != "product_owner":
        return False
    
    return True

@router.post("/", response_model=BoardResponse)
async def create_board(
    board_data: BoardCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear un nuevo tablero (requiere ser product_owner o admin)"""
    
    # Verificar permisos
    is_authorized = await is_product_owner_or_admin(
        board_data.project_id, 
        current_user, 
        db
    )
    
    if not is_authorized:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los Product Owners o Administradores pueden crear tableros"
        )
    
    # Verificar que el proyecto existe
    project_query = text("""
        SELECT id FROM projects
        WHERE id = :project_id AND is_active = true
    """)
    project_result = db.execute(project_query, {"project_id": board_data.project_id})
    if not project_result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proyecto no encontrado"
        )
    
    # Crear el tablero
    board_id = str(uuid.uuid4())
    
    create_board_query = text("""
        INSERT INTO boards (id, name, project_id, created_at, updated_at, is_active)
        VALUES (:id, :name, :project_id, NOW(), NOW(), true)
        RETURNING id, name, project_id, created_at
    """)
    
    result = db.execute(create_board_query, {
        "id": board_id,
        "name": board_data.name,
        "project_id": board_data.project_id
    })
    
    # Crear listas por defecto según el template
    if board_data.template == "kanban":
        lists = ["To Do", "In Progress", "Done"]
    else:  # scrum
        lists = ["Backlog", "Sprint", "In Progress", "Review", "Done"]
    
    for i, list_name in enumerate(lists):
        list_id = str(uuid.uuid4())
        create_list_query = text("""
            INSERT INTO lists (id, name, board_id, position, created_at, updated_at, is_active)
            VALUES (:id, :name, :board_id, :position, NOW(), NOW(), true)
        """)
        
        db.execute(create_list_query, {
            "id": list_id,
            "name": list_name,
            "board_id": board_id,
            "position": i
        })
    
    db.commit()
    
    board_record = result.fetchone()
    
    return {
        "id": board_record[0],
        "name": board_record[1],
        "project_id": board_record[2],
        "created_at": board_record[3].isoformat()
    }

@router.get("/", response_model=TypeList[BoardListResponse])
async def list_boards(
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Listar tableros según el rol del usuario"""
    
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
        # Admin: Ver todos los tableros creados por Product Managers que han sido creados por este admin
        boards_query = text("""
            SELECT b.id, b.name, b.project_id, p.name as project_name, b.created_at, 
                   COALESCE((SELECT COUNT(*) FROM lists WHERE board_id = b.id), 0) as list_count
            FROM boards b
            JOIN projects p ON b.project_id = p.id
            JOIN project_members pm ON p.id = pm.project_id
            JOIN user_profiles up ON pm.user_id = up.id
            WHERE up.creator_id = :admin_id AND pm.role = 'product_owner'
            GROUP BY b.id, p.name
            ORDER BY b.created_at DESC
        """)
        result = db.execute(boards_query, {"admin_id": local_user_id})
    elif user_role == "product_owner":
        # Product Owner: Ver solo sus tableros
        boards_query = text("""
            SELECT b.id, b.name, b.project_id, p.name as project_name, b.created_at,
                   COALESCE((SELECT COUNT(*) FROM lists WHERE board_id = b.id), 0) as list_count
            FROM boards b
            JOIN projects p ON b.project_id = p.id
            JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = :user_id
            WHERE pm.role = 'product_owner'
            ORDER BY b.created_at DESC
        """)
        result = db.execute(boards_query, {"user_id": local_user_id})
    else:
        # Developer/Member: Ver tableros de proyectos donde es miembro
        boards_query = text("""
            SELECT b.id, b.name, b.project_id, p.name as project_name, b.created_at,
                   COALESCE((SELECT COUNT(*) FROM lists WHERE board_id = b.id), 0) as list_count
            FROM boards b
            JOIN projects p ON b.project_id = p.id
            JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = :user_id
            ORDER BY b.created_at DESC
        """)
        result = db.execute(boards_query, {"user_id": local_user_id})
    
    boards = []
    for row in result:
        list_count = row[5] if len(row) > 5 else 0
        template = "kanban" if list_count <= 3 else "scrum"
        
        board = {
            "id": row[0],
            "name": row[1],
            "project_id": row[2],
            "project_name": row[3],
            "created_at": row[4].isoformat(),
            "template": template
        }
        boards.append(board)
    
    return boards

@router.get("/{board_id}", response_model=BoardResponse)
async def get_board(
    board_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener un tablero por su ID"""
    
    # Obtener el tablero
    board_query = text("""
        SELECT b.id, b.name, b.project_id, b.created_at
        FROM boards b
        WHERE b.id = :board_id AND b.is_active = true
    """)
    board_result = db.execute(board_query, {"board_id": board_id})
    board_record = board_result.fetchone()
    
    if not board_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tablero no encontrado"
        )
    
    # Verificar permisos - El usuario debe ser admin, product_owner del proyecto,
    # o miembro del proyecto para ver el tablero
    
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
    
    project_id = board_record[2]
    
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
                detail="No tienes permiso para ver este tablero"
            )
    
    return {
        "id": board_record[0],
        "name": board_record[1],
        "project_id": board_record[2],
        "created_at": board_record[3].isoformat()
    }

# Más endpoints según sea necesario para la gestión completa de tableros 