from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.database.db import get_db
from app.core.auth import get_current_user, AuthUser
from typing import List as TypeList, Optional
from pydantic import BaseModel
from sqlalchemy.sql import text
import uuid
import json
from app.services.email_service import email_service

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    responses={404: {"description": "No encontrado"}},
)

class NotificationResponse(BaseModel):
    id: str
    user_id: str
    content: str
    type: str
    entity_id: str
    created_at: str
    read: bool
    data: Optional[dict] = None

async def create_notification(
    db: Session,
    user_id: str,
    content: str,
    notification_type: str,
    entity_id: str,
    data: Optional[dict] = None
) -> str:
    """Crear una notificación para un usuario y opcionalmente enviar por email"""
    notification_id = str(uuid.uuid4())
    
    # Convertir data a JSON string, o None si data es None
    data_json = json.dumps(data) if data is not None else None
    
    # Crear notificación en la base de datos
    create_notification_query = text("""
        INSERT INTO notifications (id, user_id, content, type, entity_id, data, created_at, updated_at, is_active, read)
        VALUES (:id, :user_id, :content, :type, :entity_id, :data, NOW(), NOW(), true, false)
    """)
    
    db.execute(create_notification_query, {
        "id": notification_id,
        "user_id": user_id,
        "content": content,
        "type": notification_type,
        "entity_id": entity_id,
        "data": data_json
    })
    
    db.commit()
    
    # Enviar email si las notificaciones por email están habilitadas para este usuario
    try:
        # Obtener datos del usuario
        user_query = text("""
            SELECT email, first_name, last_name, email_notifications
            FROM user_profiles 
            WHERE id = :user_id
        """)
        user_result = db.execute(user_query, {"user_id": user_id})
        user_record = user_result.fetchone()
        
        if user_record and user_record[3]:  # email_notifications = True
            user_email = user_record[0]
            user_name = f"{user_record[1]} {user_record[2]}".strip() if user_record[1] else user_email
            
            # Generar asunto del email
            subject_map = {
                "card_assigned": "📋 Te han asignado una nueva tarjeta",
                "card_comment": "💬 Nuevo comentario en tu tarjeta",
                "card_updated": "✏️ Tu tarjeta ha sido actualizada",
                "project_invitation": "👥 Invitación a nuevo proyecto",
                "project_obsolete": "⚠️ Proyecto marcado como obsoleto",
            }
            subject = subject_map.get(notification_type, "🔔 Nueva notificación")
            
            # Enviar email (no await para no bloquear la respuesta)
            await email_service.send_notification_email(
                to_email=user_email,
                to_name=user_name,
                notification_type=notification_type,
                subject=subject,
                content=content,
                entity_data=data
            )
            
    except Exception as e:
        # Log del error pero no fallar la notificación
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error enviando email de notificación: {e}")
    
    return notification_id

@router.get("/", response_model=TypeList[NotificationResponse])
async def get_user_notifications(
    mark_as_read: Optional[bool] = False,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener todas las notificaciones del usuario actual"""
    
    # Obtener el ID del usuario local
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
    
    local_user_id = user_record[0]
    
    # Obtener las notificaciones del usuario ordenadas por fecha de creación (más recientes primero)
    notifications_query = text("""
        SELECT id, user_id, content, type, entity_id, data, created_at, read
        FROM notifications
        WHERE user_id = :user_id
        ORDER BY created_at DESC
    """)
    
    result = db.execute(notifications_query, {"user_id": local_user_id})
    
    notifications = []
    notification_ids = []
    for row in result:
        notification_ids.append(row[0])
        
        # Deserializar el campo data si existe
        data_field = None
        if row[5] is not None:  # row[5] es el campo data
            try:
                data_field = json.loads(row[5])
            except (json.JSONDecodeError, TypeError):
                data_field = None
        
        notifications.append({
            "id": row[0],
            "user_id": row[1],
            "content": row[2],
            "type": row[3],
            "entity_id": row[4],
            "data": data_field,
            "created_at": row[6].isoformat(),
            "read": row[7]
        })
    
    # Si se solicita marcar como leídas, actualizar todas las notificaciones
    if mark_as_read and notification_ids:
        mark_read_query = text("""
            UPDATE notifications
            SET read = true
            WHERE id = ANY(:notification_ids)
        """)
        
        db.execute(mark_read_query, {"notification_ids": notification_ids})
        db.commit()
        
        # Actualizar el estado de lectura en la respuesta
        for notification in notifications:
            notification["read"] = True
    
    return notifications

@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_as_read(
    notification_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marcar una notificación como leída"""
    
    # Obtener el ID del usuario local
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
    
    local_user_id = user_record[0]
    
    # Verificar que la notificación existe y pertenece al usuario
    notification_query = text("""
        SELECT id FROM notifications
        WHERE id = :notification_id AND user_id = :user_id
    """)
    
    result = db.execute(notification_query, {
        "notification_id": notification_id,
        "user_id": local_user_id
    })
    
    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada o no pertenece a este usuario"
        )
    
    # Marcar como leída
    update_query = text("""
        UPDATE notifications
        SET read = true
        WHERE id = :notification_id
    """)
    
    db.execute(update_query, {"notification_id": notification_id})
    db.commit()
    
    return {"message": "Notificación marcada como leída"}

@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar una notificación"""
    
    # Obtener el ID del usuario local
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
    
    local_user_id = user_record[0]
    
    # Verificar que la notificación existe y pertenece al usuario
    notification_query = text("""
        SELECT id FROM notifications
        WHERE id = :notification_id AND user_id = :user_id
    """)
    
    result = db.execute(notification_query, {
        "notification_id": notification_id,
        "user_id": local_user_id
    })
    
    if not result.fetchone():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada o no pertenece a este usuario"
        )
    
    # Eliminar la notificación
    delete_query = text("""
        DELETE FROM notifications
        WHERE id = :notification_id
    """)
    
    db.execute(delete_query, {"notification_id": notification_id})
    db.commit()
    
    return {"message": "Notificación eliminada correctamente"}

@router.put("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    current_user: AuthUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marcar todas las notificaciones del usuario como leídas"""
    
    # Obtener el ID del usuario local
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
    
    local_user_id = user_record[0]
    
    # Marcar todas las notificaciones del usuario como leídas
    update_query = text("""
        UPDATE notifications
        SET read = true
        WHERE user_id = :user_id AND read = false
    """)
    
    result = db.execute(update_query, {"user_id": local_user_id})
    count = result.rowcount
    db.commit()
    
    return {"message": f"{count} notificaciones marcadas como leídas"} 