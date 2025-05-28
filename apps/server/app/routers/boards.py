from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.database.db import get_db
from app.models.agile import Board, List, Card
from app.models.project import Project, ProjectMember
from app.models.user import UserProfile
from app.core.auth import get_current_user, AuthUser
from app.routers.notifications import create_notification
from typing import List as TypeList, Optional
from pydantic import BaseModel
from sqlalchemy.sql import text
import uuid
import datetime
import json

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
    project_name: Optional[str] = None
    created_at: str
    
class BoardListResponse(BaseModel):
    id: str
    name: str
    project_id: str
    project_name: str
    created_at: str
    template: str

# Esquemas adicionales para Listas y Tarjetas
class ListCreate(BaseModel):
    name: str
    position: Optional[int] = None

class ListResponse(BaseModel):
    id: str
    name: str
    board_id: str
    position: int
    created_at: str

class CardCreate(BaseModel):
    title: str
    description: Optional[str] = None
    position: Optional[int] = None
    due_date: Optional[str] = None
    assignee_id: Optional[str] = None
    cover_color: Optional[str] = None

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None
    due_date: Optional[str] = None
    list_id: Optional[str] = None
    assignee_id: Optional[str] = None
    cover_color: Optional[str] = None

class CardResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    list_id: str
    position: int
    due_date: Optional[str]
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
    cover_color: Optional[str] = None
    created_at: str
    updated_at: str

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: str
    card_id: str
    user_id: str
    user_name: str
    user_email: str
    content: str
    created_at: str
    updated_at: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar: Optional[str] = None

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
    
    # Si es product_owner, verificar
    if user_role == "product_owner":
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
        
        if member_record and member_record[0] == "product_owner":
            return True
            
        # También permitir si es product_owner en otro proyecto creado por el mismo admin que creó este proyecto
        admin_query = text("""
            -- Verificar si este usuario es product_owner para algún otro proyecto creado por el mismo admin
            -- que creó el proyecto actual
            SELECT 1 
            FROM project_members pm
            JOIN projects p1 ON pm.project_id = p1.id
            JOIN projects p2 ON p1.created_by = p2.created_by
            WHERE pm.user_id = :user_id 
              AND pm.role = 'product_owner'
              AND p2.id = :project_id
        """)
        admin_result = db.execute(admin_query, {
            "project_id": project_id,
            "user_id": local_user_id
        })
        
        if admin_result.fetchone():
            return True
    
    return False

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
        WHERE id = :project_id
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
        # Admin: Ver tableros de proyectos creados por este admin
        boards_query = text("""
            SELECT b.id, b.name, b.project_id, p.name as project_name, b.created_at, 
                   COALESCE((SELECT COUNT(*) FROM lists WHERE board_id = b.id), 0) as list_count
            FROM boards b
            JOIN projects p ON b.project_id = p.id
            WHERE p.created_by = :user_id
            GROUP BY b.id, p.name
            ORDER BY b.created_at DESC
        """)
        result = db.execute(boards_query, {"user_id": local_user_id})
    elif user_role == "product_owner":
        # Product Owner: Ver tableros de proyectos donde es miembro como product_owner o que fueron creados por administradores que lo añadieron como product_owner
        boards_query = text("""
            SELECT DISTINCT b.id, b.name, b.project_id, p.name as project_name, b.created_at,
                   COALESCE((SELECT COUNT(*) FROM lists WHERE board_id = b.id), 0) as list_count
            FROM boards b
            JOIN projects p ON b.project_id = p.id
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
            ORDER BY b.created_at DESC
        """)
        result = db.execute(boards_query, {"user_id": local_user_id})
    else:
        # Developer/Member: Ver tableros de proyectos donde es miembro O donde tiene tarjetas asignadas
        boards_query = text("""
            SELECT DISTINCT b.id, b.name, b.project_id, p.name as project_name, b.created_at,
                   COALESCE((SELECT COUNT(*) FROM lists WHERE board_id = b.id), 0) as list_count
            FROM boards b
            JOIN projects p ON b.project_id = p.id
            LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = :user_id
            LEFT JOIN lists l ON b.id = l.board_id
            LEFT JOIN cards c ON l.id = c.list_id AND c.assignee_id = :user_id
            WHERE (
                pm.user_id = :user_id  -- Es miembro del proyecto
                OR 
                c.assignee_id = :user_id  -- Tiene tarjetas asignadas en este tablero
            )
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
        SELECT b.id, b.name, b.project_id, p.name as project_name, b.created_at
        FROM boards b
        JOIN projects p ON b.project_id = p.id
        WHERE b.id = :board_id
    """)
    board_result = db.execute(board_query, {"board_id": board_id})
    board_record = board_result.fetchone()
    
    if not board_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tablero no encontrado"
        )
    
    # Verificar permisos - El usuario debe ser admin, product_owner del proyecto,
    # miembro del proyecto, o tener tarjetas asignadas para ver el tablero
    
    board_accessible = await is_board_accessible(board_id, current_user, db)
    if not board_accessible:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para ver este tablero"
        )
    
    return {
        "id": board_record[0],
        "name": board_record[1],
        "project_id": board_record[2],
        "project_name": board_record[3],
        "created_at": board_record[4].isoformat()
    }

# Endpoints para Listas
@router.get("/{board_id}/lists", response_model=TypeList[ListResponse])
async def get_board_lists(
    board_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las listas de un tablero ordenadas por posición"""
    
    # Verificar que el tablero existe y el usuario tiene acceso
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tablero no encontrado o no tienes permiso para acceder"
        )
    
    # Obtener listas ordenadas por posición
    lists_query = text("""
        SELECT id, name, board_id, position, created_at
        FROM lists
        WHERE board_id = :board_id
        ORDER BY position ASC
    """)
    
    result = db.execute(lists_query, {"board_id": board_id})
    
    lists = []
    for row in result:
        list_item = {
            "id": row[0],
            "name": row[1],
            "board_id": row[2],
            "position": row[3],
            "created_at": row[4].isoformat()
        }
        lists.append(list_item)
    
    return lists

@router.post("/{board_id}/lists", response_model=ListResponse)
async def create_board_list(
    board_id: str,
    list_data: ListCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear una nueva lista en un tablero"""
    
    # Verificar que el tablero existe y el usuario tiene acceso
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tablero no encontrado o no tienes permiso para acceder"
        )
    
    # Si no se especifica posición, obtener la siguiente posición disponible
    if list_data.position is None:
        position_query = text("""
            SELECT COALESCE(MAX(position) + 1, 0)
            FROM lists
            WHERE board_id = :board_id
        """)
        result = db.execute(position_query, {"board_id": board_id})
        position = result.scalar() or 0
    else:
        position = list_data.position
    
    # Crear la lista
    list_id = str(uuid.uuid4())
    
    create_list_query = text("""
        INSERT INTO lists (id, name, board_id, position, created_at, updated_at, is_active)
        VALUES (:id, :name, :board_id, :position, NOW(), NOW(), true)
        RETURNING id, name, board_id, position, created_at
    """)
    
    result = db.execute(create_list_query, {
        "id": list_id,
        "name": list_data.name,
        "board_id": board_id,
        "position": position
    })
    
    db.commit()
    
    list_record = result.fetchone()
    
    return {
        "id": list_record[0],
        "name": list_record[1],
        "board_id": list_record[2],
        "position": list_record[3],
        "created_at": list_record[4].isoformat()
    }

# Endpoints para Tarjetas
@router.get("/lists/{list_id}/cards", response_model=TypeList[CardResponse])
async def get_list_cards(
    list_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las tarjetas de una lista ordenadas por posición"""
    
    # Verificar que la lista existe y el usuario tiene acceso al tablero
    list_query = text("""
        SELECT l.board_id
        FROM lists l
        WHERE l.id = :list_id
    """)
    
    result = db.execute(list_query, {"list_id": list_id})
    list_record = result.fetchone()
    
    if not list_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lista no encontrada"
        )
    
    board_id = list_record[0]
    
    # Verificar acceso al tablero
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este tablero"
        )
    
    # Obtener tarjetas ordenadas por posición con información del asignado
    cards_query = text("""
        SELECT c.id, c.title, c.description, c.list_id, c.position, c.due_date, c.created_at, c.updated_at, c.cover_color, c.assignee_id
        FROM cards c
        WHERE c.list_id = :list_id
        ORDER BY c.position ASC
    """)
    
    result = db.execute(cards_query, {"list_id": list_id})
    
    cards = []
    for row in result:
        # Obtener datos del usuario asignado si existe
        assignee_id = row[9]
        assignee_name = None
        assignee_email = None
        
        if assignee_id:
            assignee_query = text("""
                SELECT email, first_name, last_name 
                FROM user_profiles 
                WHERE id = :assignee_id
            """)
            assignee_result = db.execute(assignee_query, {"assignee_id": assignee_id})
            assignee_record = assignee_result.fetchone()
            
            if assignee_record:
                assignee_email = assignee_record[0]
                assignee_name = f"{assignee_record[1]} {assignee_record[2]}".strip() if assignee_record[1] else assignee_email
        
        card = {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "list_id": row[3],
            "position": row[4],
            "due_date": row[5].isoformat() if row[5] else None,
            "created_at": row[6].isoformat(),
            "updated_at": row[7].isoformat(),
            "cover_color": row[8],
            "assignee_id": assignee_id,
            "assignee_name": assignee_name,
            "assignee_email": assignee_email
        }
        cards.append(card)
    
    return cards

@router.post("/lists/{list_id}/cards", response_model=CardResponse)
async def create_card(
    list_id: str,
    card_data: CardCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear una nueva tarjeta en una lista"""
    
    # Verificar que la lista existe y el usuario tiene acceso al tablero
    list_query = text("""
        SELECT l.board_id
        FROM lists l
        WHERE l.id = :list_id
    """)
    
    result = db.execute(list_query, {"list_id": list_id})
    list_record = result.fetchone()
    
    if not list_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lista no encontrada"
        )
    
    board_id = list_record[0]
    
    # Verificar acceso al tablero
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este tablero"
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
    
    # Si es miembro regular (no developer, admin o product_owner), solo puede ver
    if user_role == "member":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Los miembros regulares no pueden crear tarjetas"
        )
    
    # Verificar si el assignee_id es válido y pertenece al mismo proyecto
    assignee_id = card_data.assignee_id
    assignee_name = None
    assignee_email = None
    
    if assignee_id:
        # Verificar que el usuario asignado existe
        assignee_query = text("""
            SELECT up.id, up.role, pm.role as project_role, 
                up.email, up.first_name, up.last_name
            FROM user_profiles up
            LEFT JOIN project_members pm ON up.id = pm.user_id
            LEFT JOIN projects p ON pm.project_id = p.id
            LEFT JOIN boards b ON p.id = b.project_id
            LEFT JOIN lists l ON b.id = l.board_id
            WHERE up.id = :assignee_id AND l.id = :list_id
            LIMIT 1
        """)
        
        assignee_result = db.execute(assignee_query, {
            "assignee_id": assignee_id,
            "list_id": list_id
        })
        assignee_record = assignee_result.fetchone()
        
        if not assignee_record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El usuario asignado no existe o no pertenece a este proyecto"
            )
        
        # Verificar que el usuario asignado es developer o tiene acceso adecuado
        assignee_role = assignee_record[1]
        project_role = assignee_record[2]
        assignee_email = assignee_record[3]
        assignee_name = f"{assignee_record[4]} {assignee_record[5]}".strip() if assignee_record[4] else assignee_email
        
        if assignee_role != "developer" and project_role != "developer":
            # Si el usuario actual es admin o product_owner, permitir asignar a cualquiera del proyecto
            if user_role not in ["admin", "product_owner"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Solo se pueden asignar tarjetas a desarrolladores"
                )
    else:
        assignee_email = None
        assignee_name = None
    
    # Si no se especifica posición, obtener la siguiente posición disponible
    if card_data.position is None:
        position_query = text("""
            SELECT COALESCE(MAX(position) + 1, 0)
            FROM cards
            WHERE list_id = :list_id
        """)
        result = db.execute(position_query, {"list_id": list_id})
        position = result.scalar() or 0
    else:
        position = card_data.position
    
    # Crear la tarjeta
    card_id = str(uuid.uuid4())
    
    due_date = None
    if card_data.due_date:
        due_date = card_data.due_date
    
    # Si el usuario es developer y no especificó assignee_id, asignarse a sí mismo
    if user_role == "developer" and not assignee_id:
        assignee_id = local_user_id
        
        # Obtener datos del usuario actual
        user_details_query = text("""
            SELECT email, first_name, last_name 
            FROM user_profiles 
            WHERE id = :user_id
        """)
        user_details = db.execute(user_details_query, {"user_id": local_user_id}).fetchone()
        if user_details:
            assignee_email = user_details[0]
            assignee_name = f"{user_details[1]} {user_details[2]}".strip() if user_details[1] else assignee_email
    
    create_card_query = text("""
        INSERT INTO cards (id, title, description, list_id, position, due_date, created_at, updated_at, is_active, cover_color)
        VALUES (:id, :title, :description, :list_id, :position, :due_date, NOW(), NOW(), true, :cover_color)
        RETURNING id, title, description, list_id, position, due_date, created_at, updated_at, cover_color
    """)
    
    result = db.execute(create_card_query, {
        "id": card_id,
        "title": card_data.title,
        "description": card_data.description,
        "list_id": list_id,
        "position": position,
        "due_date": due_date,
        "cover_color": card_data.cover_color
    })
    
    db.commit()
    
    card_record = result.fetchone()
    
    return {
        "id": card_record[0],
        "title": card_record[1],
        "description": card_record[2],
        "list_id": card_record[3],
        "position": card_record[4],
        "due_date": card_record[5].isoformat() if card_record[5] else None,
        "assignee_id": assignee_id,
        "assignee_name": assignee_name,
        "assignee_email": assignee_email,
        "cover_color": card_record[8],
        "created_at": card_record[6].isoformat(),
        "updated_at": card_record[7].isoformat()
    }

@router.get("/cards/{card_id}", response_model=CardResponse)
async def get_card(
    card_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener una tarjeta por su ID"""
    
    # Obtener la tarjeta y verificar acceso
    card_query = text("""
        SELECT c.id, c.title, c.description, c.list_id, c.position, c.due_date, c.created_at, c.updated_at,
               l.board_id
        FROM cards c
        JOIN lists l ON c.list_id = l.id
        WHERE c.id = :card_id
    """)
    
    result = db.execute(card_query, {"card_id": card_id})
    card_record = result.fetchone()
    
    if not card_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta no encontrada"
        )
    
    board_id = card_record[8]
    
    # Verificar acceso al tablero
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a esta tarjeta"
        )
    
    return {
        "id": card_record[0],
        "title": card_record[1],
        "description": card_record[2],
        "list_id": card_record[3],
        "position": card_record[4],
        "due_date": card_record[5].isoformat() if card_record[5] else None,
        "assignee_id": None,
        "assignee_name": None,
        "assignee_email": None,
        "cover_color": None,
        "created_at": card_record[6].isoformat(),
        "updated_at": card_record[7].isoformat()
    }

@router.put("/cards/{card_id}", response_model=CardResponse)
async def update_card(
    card_id: str,
    card_data: CardUpdate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar una tarjeta existente"""
    
    # Primero verificar que la tarjeta existe
    get_card_query = text("""
        SELECT c.id, c.list_id, c.title, c.assignee_id
        FROM cards c
        WHERE c.id = :card_id
    """)
    
    result = db.execute(get_card_query, {"card_id": card_id})
    card_record = result.fetchone()
    
    if not card_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta no encontrada"
        )
    
    current_list_id = card_record[1]
    card_title = card_record[2]
    previous_assignee_id = card_record[3]
    target_list_id = card_data.list_id or current_list_id
    
    # Verificar acceso al tablero
    list_query = text("""
        SELECT l.board_id
        FROM lists l
        WHERE l.id = :list_id
    """)
    
    result = db.execute(list_query, {"list_id": current_list_id})
    list_record = result.fetchone()
    
    if not list_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lista no encontrada"
        )
    
    board_id = list_record[0]
    
    # Verificar acceso al tablero
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este tablero"
        )
    
    # Si se está moviendo a otra lista, verificar que la lista destino existe y pertenece al mismo tablero
    if target_list_id != current_list_id:
        target_list_query = text("""
            SELECT l.board_id
            FROM lists l
            WHERE l.id = :list_id
        """)
        
        result = db.execute(target_list_query, {"list_id": target_list_id})
        target_list_record = result.fetchone()
        
        if not target_list_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lista destino no encontrada"
            )
        
        target_board_id = target_list_record[0]
        
        if target_board_id != board_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede mover la tarjeta a un tablero diferente"
            )
    
    # Obtener información del usuario actual para notificaciones
    current_user_query = text("""
        SELECT id, CONCAT(first_name, ' ', last_name) as full_name
        FROM user_profiles 
        WHERE auth_id = :auth_id OR email = :email
        LIMIT 1
    """)
    
    current_user_result = db.execute(current_user_query, {
        "auth_id": current_user.id, 
        "email": current_user.email
    })
    current_user_record = current_user_result.fetchone()
    current_user_id = current_user_record[0]
    current_user_name = current_user_record[1]

    # Variables para guardar información del asignado
    assignee_id = card_data.assignee_id
    assignee_name = None
    assignee_email = None
    
    # Crear notificación si hay cambio de asignado
    if card_data.assignee_id is not None and card_data.assignee_id != previous_assignee_id:
        if card_data.assignee_id:
            # Se ha asignado a alguien nuevo
            notification_content = f"{current_user_name} te ha asignado la tarjeta '{card_title}'"
            notification_data = {
                "card_id": card_id,
                "board_id": board_id,
                "assigner_id": current_user_id,
                "assigner_name": current_user_name
            }
            
            # Crear notificación para el usuario asignado
            await create_notification(
                db=db,
                user_id=card_data.assignee_id,
                content=notification_content,
                notification_type="card_assigned",
                entity_id=card_id,
                data=notification_data
            )
            
            # Obtener los datos del usuario asignado para la respuesta
            assignee_query = text("""
                SELECT email, first_name, last_name 
                FROM user_profiles 
                WHERE id = :assignee_id
            """)
            assignee_result = db.execute(assignee_query, {"assignee_id": card_data.assignee_id})
            assignee_record = assignee_result.fetchone()
            
            if assignee_record:
                assignee_email = assignee_record[0]
                assignee_name = f"{assignee_record[1]} {assignee_record[2]}".strip() if assignee_record[1] else assignee_email
    
    # Construir la consulta de actualización
    set_clauses = []
    params = {"card_id": card_id}
    
    if card_data.title is not None:
        set_clauses.append("title = :title")
        params["title"] = card_data.title
    
    if card_data.description is not None:
        set_clauses.append("description = :description")
        params["description"] = card_data.description
    
    if card_data.position is not None:
        set_clauses.append("position = :position")
        params["position"] = card_data.position
    
    if card_data.due_date is not None:
        set_clauses.append("due_date = :due_date")
        params["due_date"] = card_data.due_date
    
    if card_data.list_id is not None:
        set_clauses.append("list_id = :list_id")
        params["list_id"] = card_data.list_id
    
    if card_data.assignee_id is not None:
        set_clauses.append("assignee_id = :assignee_id")
        params["assignee_id"] = card_data.assignee_id

    if card_data.cover_color is not None:
        set_clauses.append("cover_color = :cover_color")
        params["cover_color"] = card_data.cover_color
    
    if not set_clauses:
        # Si no hay campos para actualizar, devolver la tarjeta sin cambios
        get_card_query = text("""
            SELECT c.id, c.title, c.description, c.list_id, c.position, c.due_date, c.created_at, c.updated_at, c.cover_color, c.assignee_id
            FROM cards c
            WHERE c.id = :card_id
        """)
        
        result = db.execute(get_card_query, {"card_id": card_id})
        card = result.fetchone()
        
        # Si no tenemos el nombre y correo del asignado pero tenemos un assignee_id, obtenerlos
        if card[9] and not assignee_name:
            assignee_query = text("""
                SELECT email, first_name, last_name 
                FROM user_profiles 
                WHERE id = :assignee_id
            """)
            assignee_result = db.execute(assignee_query, {"assignee_id": card[9]})
            assignee_record = assignee_result.fetchone()
            
            if assignee_record:
                assignee_email = assignee_record[0]
                assignee_name = f"{assignee_record[1]} {assignee_record[2]}".strip() if assignee_record[1] else assignee_email
        
        return {
            "id": card[0],
            "title": card[1],
            "description": card[2],
            "list_id": card[3],
            "position": card[4],
            "due_date": card[5].isoformat() if card[5] else None,
            "assignee_id": card[9],
            "assignee_name": assignee_name,
            "assignee_email": assignee_email,
            "cover_color": card[8],
            "created_at": card[6].isoformat(),
            "updated_at": card[7].isoformat()
        }
    
    # Verificar si estamos intentando asignar un usuario que no existe
    if 'assignee_id' in params and params['assignee_id'] is not None:
        verify_user_query = text("""
            SELECT 1 FROM user_profiles WHERE id = :user_id
        """)
        verify_result = db.execute(verify_user_query, {"user_id": params['assignee_id']})
        if not verify_result.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El usuario con ID {params['assignee_id']} no existe"
            )
    
    # Ejecutar la actualización
    update_query = text(f"""
        UPDATE cards
        SET {', '.join(set_clauses)}, updated_at = NOW()
        WHERE id = :card_id
        RETURNING id, title, description, list_id, position, due_date, created_at, updated_at, cover_color, assignee_id
    """)
    
    result = db.execute(update_query, params)
    db.commit()
    
    updated_card = result.fetchone()
    
    # Crear notificación si se modificó el título o descripción de la card y hay un usuario asignado
    if updated_card[9] and updated_card[9] != current_user_id:  # Si hay un asignado y no es el usuario actual
        # Verificar si se cambió título o descripción
        title_changed = card_data.title is not None and card_data.title != card_title
        description_changed = card_data.description is not None
        
        if title_changed or description_changed:
            # Determinar qué se modificó
            changes = []
            if title_changed:
                changes.append("el título")
            if description_changed:
                changes.append("la descripción")
            
            changes_text = " y ".join(changes)
            notification_content = f"{current_user_name} ha modificado {changes_text} de la tarjeta '{updated_card[1]}' que te está asignada"
            
            notification_data = {
                "card_id": card_id,
                "board_id": board_id,
                "modifier_id": current_user_id,
                "modifier_name": current_user_name,
                "changes": changes
            }
            
            # Crear notificación para el usuario asignado
            await create_notification(
                db=db,
                user_id=updated_card[9],  # assignee_id
                content=notification_content,
                notification_type="card_updated",
                entity_id=card_id,
                data=notification_data
            )
    
    # Si no tenemos el nombre y correo del asignado pero tenemos un assignee_id, obtenerlos
    if updated_card[9] and not assignee_name:
        assignee_query = text("""
            SELECT email, first_name, last_name 
            FROM user_profiles 
            WHERE id = :assignee_id
        """)
        assignee_result = db.execute(assignee_query, {"assignee_id": updated_card[9]})
        assignee_record = assignee_result.fetchone()
        
        if assignee_record:
            assignee_email = assignee_record[0]
            assignee_name = f"{assignee_record[1]} {assignee_record[2]}".strip() if assignee_record[1] else assignee_email
    
    return {
        "id": updated_card[0],
        "title": updated_card[1],
        "description": updated_card[2],
        "list_id": updated_card[3],
        "position": updated_card[4],
        "due_date": updated_card[5].isoformat() if updated_card[5] else None,
        "assignee_id": updated_card[9],
        "assignee_name": assignee_name,
        "assignee_email": assignee_email,
        "cover_color": updated_card[8],
        "created_at": updated_card[6].isoformat(),
        "updated_at": updated_card[7].isoformat()
    }

@router.delete("/cards/{card_id}", response_model=dict)
async def delete_card(
    card_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar una tarjeta"""
    
    # Verificar que la tarjeta existe y obtener el tablero
    card_query = text("""
        SELECT c.id, l.board_id
        FROM cards c
        JOIN lists l ON c.list_id = l.id
        WHERE c.id = :card_id
    """)
    
    result = db.execute(card_query, {"card_id": card_id})
    card_record = result.fetchone()
    
    if not card_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta no encontrada"
        )
    
    board_id = card_record[1]
    
    # Verificar acceso al tablero
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para eliminar esta tarjeta"
        )
    
    # Eliminar la tarjeta
    delete_query = text("""
        DELETE FROM cards
        WHERE id = :card_id
    """)
    
    db.execute(delete_query, {"card_id": card_id})
    db.commit()
    
    return {"message": "Tarjeta eliminada correctamente"}

@router.post("/cards/{card_id}/comments", response_model=CommentResponse)
async def add_comment(
    card_id: str,
    comment_data: CommentCreate,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Añadir un comentario a una tarjeta"""
    
    # Verificar que la tarjeta existe
    card_query = text("""
        SELECT c.id, l.board_id, c.title, c.assignee_id
        FROM cards c
        JOIN lists l ON c.list_id = l.id
        WHERE c.id = :card_id
    """)
    
    result = db.execute(card_query, {"card_id": card_id})
    card_record = result.fetchone()
    
    if not card_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta no encontrada"
        )
    
    board_id = card_record[1]
    card_title = card_record[2]
    assignee_id = card_record[3]
    
    # Verificar acceso al tablero
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este tablero"
        )
    
    # Obtener el usuario actual
    local_user_id = None
    user_name = None
    user_email = None
    
    if current_user.sub_type == "local":
        local_user_id = current_user.subject
        
        # Obtener datos del usuario actual
        user_query = text("""
            SELECT email, first_name, last_name 
            FROM user_profiles 
            WHERE id = :user_id
        """)
        
        user_result = db.execute(user_query, {"user_id": local_user_id})
        user_record = user_result.fetchone()
        
        if user_record:
            user_email = user_record[0]
            user_name = f"{user_record[1]} {user_record[2]}".strip() if user_record[1] else user_email
    
    if not local_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo identificar al usuario"
        )
    
    # Crear el comentario
    comment_id = str(uuid.uuid4())
    
    create_comment_query = text("""
        INSERT INTO comments (id, card_id, user_id, content, created_at, updated_at)
        VALUES (:id, :card_id, :user_id, :content, NOW(), NOW())
        RETURNING id, card_id, user_id, content, created_at, updated_at
    """)
    
    result = db.execute(create_comment_query, {
        "id": comment_id,
        "card_id": card_id,
        "user_id": local_user_id,
        "content": comment_data.content
    })
    
    # Crear notificación si hay un usuario asignado a la tarjeta y es diferente del usuario que comenta
    if assignee_id and assignee_id != local_user_id:
        notification_content = f"{user_name} ha comentado en la tarjeta '{card_title}' que te está asignada"
        notification_data = {
            "card_id": card_id,
            "board_id": board_id,
            "commenter_id": local_user_id,
            "commenter_name": user_name,
            "comment_id": comment_id,
            "comment_content": comment_data.content
        }
        
        # Crear notificación para el usuario asignado
        await create_notification(
            db=db,
            user_id=assignee_id,
            content=notification_content,
            notification_type="card_comment",
            entity_id=card_id,
            data=notification_data
        )
    
    db.commit()
    
    comment_record = result.fetchone()
    
    return {
        "id": comment_record[0],
        "card_id": comment_record[1],
        "user_id": comment_record[2],
        "user_name": user_name,
        "user_email": user_email,
        "content": comment_record[3],
        "created_at": comment_record[4].isoformat(),
        "updated_at": comment_record[5].isoformat()
    }

@router.get("/cards/{card_id}/comments", response_model=TypeList[CommentResponse])
async def get_card_comments(
    card_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todos los comentarios de una tarjeta"""
    
    # Verificar que la tarjeta existe
    card_query = text("""
        SELECT c.id, l.board_id
        FROM cards c
        JOIN lists l ON c.list_id = l.id
        WHERE c.id = :card_id
    """)
    
    result = db.execute(card_query, {"card_id": card_id})
    card_record = result.fetchone()
    
    if not card_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarjeta no encontrada"
        )
    
    board_id = card_record[1]
    
    # Verificar acceso al tablero
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para acceder a este tablero"
        )
    
    # Obtener los comentarios de la tarjeta
    comments_query = text("""
        SELECT c.id, c.card_id, c.user_id, c.content, c.created_at, c.updated_at,
               u.email, u.first_name, u.last_name
        FROM comments c
        JOIN user_profiles u ON c.user_id = u.id
        WHERE c.card_id = :card_id
        ORDER BY c.created_at DESC
    """)
    
    result = db.execute(comments_query, {"card_id": card_id})
    
    comments = []
    for row in result:
        user_email = row[6]
        user_name = f"{row[7]} {row[8]}".strip() if row[7] else user_email
        
        comment = {
            "id": row[0],
            "card_id": row[1],
            "user_id": row[2],
            "content": row[3],
            "created_at": row[4].isoformat(),
            "updated_at": row[5].isoformat(),
            "user_name": user_name,
            "user_email": user_email
        }
        comments.append(comment)
    
    return comments

@router.get("/{board_id}/developers", response_model=TypeList[UserResponse])
async def get_board_developers(
    board_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todos los desarrolladores disponibles para asignar en un tablero"""
    
    # Verificar que el tablero existe y el usuario tiene acceso
    board_exists = await is_board_accessible(board_id, current_user, db)
    if not board_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tablero no encontrado o no tienes permiso para acceder"
        )
    
    # Obtener el proyecto asociado al tablero
    board_query = text("""
        SELECT b.project_id
        FROM boards b
        WHERE b.id = :board_id
    """)
    
    result = db.execute(board_query, {"board_id": board_id})
    board_record = result.fetchone()
    
    if not board_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tablero no encontrado"
        )
    
    project_id = board_record[0]
    
    # Obtener el rol del usuario actual
    user_query = text("""
        SELECT id, role, email 
        FROM user_profiles 
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
    
    # Verificar también si tiene un rol específico en este proyecto
    project_role_query = text("""
        SELECT role
        FROM project_members
        WHERE project_id = :project_id AND user_id = :user_id
        LIMIT 1
    """)
    project_role_result = db.execute(project_role_query, {"project_id": project_id, "user_id": local_user_id})
    project_role_record = project_role_result.fetchone()
    
    # Si tiene un rol específico en el proyecto, usar ese rol en vez del rol global
    project_role = project_role_record[0] if project_role_record else None
    effective_role = project_role or user_role
    
    # Dependiendo del rol del usuario, mostrar diferentes usuarios para asignar
    if effective_role == "admin":
        # Los admins pueden ver y asignar a todos los desarrolladores del proyecto
        query = text("""
            SELECT DISTINCT up.id, up.first_name, up.last_name, up.email, COALESCE(pm.role, up.role) as role
            FROM user_profiles up
            LEFT JOIN project_members pm ON up.id = pm.user_id AND pm.project_id = :project_id
            WHERE 
                -- Usuario es miembro del proyecto con rol de developer
                (pm.project_id = :project_id AND pm.role = 'developer')
                -- O usuario tiene rol global de developer
                OR (up.role = 'developer')
                -- No mostrar al usuario actual
                AND up.id != :current_user_id
        """)
        
    elif effective_role == "product_owner":
        # Los product owners pueden ver y asignar a todos los developers del proyecto
        query = text("""
            SELECT DISTINCT up.id, up.first_name, up.last_name, up.email, COALESCE(pm.role, up.role) as role
            FROM user_profiles up
            LEFT JOIN project_members pm ON up.id = pm.user_id AND pm.project_id = :project_id
            WHERE 
                -- Usuario es miembro del proyecto con rol de developer
                (pm.project_id = :project_id AND pm.role = 'developer')
                -- O usuario tiene rol global de developer
                OR (up.role = 'developer')
                -- No mostrar al usuario actual
                AND up.id != :current_user_id
        """)
        
    else:  # developer o member
        # Los developers solo pueden ver a los product owners para asignar/escalar tareas
        query = text("""
            SELECT DISTINCT up.id, up.first_name, up.last_name, up.email, COALESCE(pm.role, up.role) as role
            FROM user_profiles up
            LEFT JOIN project_members pm ON up.id = pm.user_id AND pm.project_id = :project_id
            WHERE 
                -- Product owners del proyecto
                (pm.project_id = :project_id AND pm.role = 'product_owner')
                -- O usuarios con rol global de product_owner
                OR (up.role = 'product_owner')
                -- No incluir al usuario actual
                AND up.id != :current_user_id
        """)
    
    result = db.execute(query, {
        "project_id": project_id,
        "current_user_id": local_user_id
    })
    
    developers = []
    for row in result:
        developers.append({
            "id": row[0],
            "name": f"{row[1]} {row[2]}".strip() if row[1] else row[3],
            "email": row[3],
            "role": row[4],
            "avatar": None
        })
    
    # Añadir opción "Sin asignar" implícitamente en el frontend
    return developers

async def is_board_accessible(board_id: str, current_user: AuthUser, db: Session) -> bool:
    """Verificar si un usuario tiene acceso a un tablero"""
    
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
    
    # Admin tiene acceso a todo
    if user_role == "admin":
        return True
    
    # Verificar si el tablero existe y si el usuario es miembro del proyecto
    board_query = text("""
        SELECT b.id, b.project_id, p.created_by
        FROM boards b
        JOIN projects p ON b.project_id = p.id
        WHERE b.id = :board_id
    """)
    
    board_result = db.execute(board_query, {"board_id": board_id})
    board_record = board_result.fetchone()
    
    if not board_record:
        return False
    
    project_id = board_record[1]
    project_creator = board_record[2]
    
    # Product Owner: Verificar si es creador del proyecto o miembro
    if user_role == "product_owner":
        if project_creator == local_user_id:
            return True
        
        member_query = text("""
            SELECT 1 FROM project_members
            WHERE project_id = :project_id AND user_id = :user_id AND role = 'product_owner'
        """)
        
        member_result = db.execute(member_query, {"project_id": project_id, "user_id": local_user_id})
        
        if member_result.fetchone():
            return True
            
    # Para cualquier otro rol, verificar si es miembro del proyecto
    member_query = text("""
        SELECT 1 FROM project_members
        WHERE project_id = :project_id AND user_id = :user_id
    """)
    
    member_result = db.execute(member_query, {"project_id": project_id, "user_id": local_user_id})
    
    if member_result.fetchone():
        return True
    
    # Si no es miembro del proyecto, verificar si tiene tarjetas asignadas en este tablero
    assigned_cards_query = text("""
        SELECT 1 FROM cards c
        JOIN lists l ON c.list_id = l.id
        WHERE l.board_id = :board_id AND c.assignee_id = :user_id
        LIMIT 1
    """)
    
    assigned_result = db.execute(assigned_cards_query, {"board_id": board_id, "user_id": local_user_id})
    
    return assigned_result.fetchone() is not None 