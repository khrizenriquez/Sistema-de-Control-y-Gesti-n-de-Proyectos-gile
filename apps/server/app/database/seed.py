import asyncio
from sqlmodel import Session, select
from app.database.db import sync_engine, get_sync_session
from app.models import (
    UserProfile, Project, ProjectMember, UserStory, Sprint,
    Board, List, Card, Task
)
import uuid
import logging

logger = logging.getLogger(__name__)

def check_data_exists():
    """Verificar si ya existen datos en las tablas principales"""
    with Session(sync_engine) as session:
        # Verificar si hay usuarios
        user_count = session.exec(select(UserProfile)).first()
        if user_count:
            return True
        return False

async def seed_data():
    """Función principal para sembrar datos, puede ser llamada desde otros lugares"""
    if check_data_exists():
        logger.info("Ya existen datos en la base de datos. Saltando el proceso de seeding.")
        return False
    
    try:
        create_test_data()
        return True
    except Exception as e:
        logger.error(f"Error al crear datos de prueba: {str(e)}")
        return False

def create_test_data():
    """Crear datos de prueba para desarrollo"""
    with Session(sync_engine) as session:
        # Crear perfiles de usuario
        admin = UserProfile(
            auth_id="supabase-auth-id-1",  # ID ficticio, se actualizaría con un ID real de Supabase
            first_name="Admin",
            last_name="Usuario",
            email="admin@ingsistemas.gt"
        )
        
        developer = UserProfile(
            auth_id="supabase-auth-id-2",  # ID ficticio
            first_name="Desarrollador",
            last_name="Ejemplo",
            email="dev@ingsistemas.gt"
        )
        
        pm = UserProfile(
            auth_id="supabase-auth-id-3",  # ID ficticio
            first_name="Project",
            last_name="Manager",
            email="pm@ingsistemas.gt"
        )
        
        member = UserProfile(
            auth_id="supabase-auth-id-4",  # ID ficticio
            first_name="Miembro",
            last_name="Regular",
            email="member@ingsistemas.gt"
        )
        
        session.add(admin)
        session.add(developer)
        session.add(pm)
        session.add(member)
        session.commit()
        
        # Crear proyecto
        project = Project(
            name="Proyecto Demo",
            description="Un proyecto de demostración",
            owner_id=admin.id
        )
        session.add(project)
        session.commit()
        
        # Añadir miembros al proyecto
        admin_member = ProjectMember(project_id=project.id, user_id=admin.id, role="admin")
        dev_member = ProjectMember(project_id=project.id, user_id=developer.id, role="developer")
        pm_member = ProjectMember(project_id=project.id, user_id=pm.id, role="product_owner")
        regular_member = ProjectMember(project_id=project.id, user_id=member.id, role="member")
        
        session.add(admin_member)
        session.add(dev_member)
        session.add(pm_member)
        session.add(regular_member)
        session.commit()
        
        # Crear historias de usuario
        stories = [
            UserStory(
                title="Como usuario quiero iniciar sesión",
                description="Necesito poder ingresar al sistema con mis credenciales",
                project_id=project.id,
                status="backlog",
                priority=1,
                story_points=3
            ),
            UserStory(
                title="Como admin quiero gestionar usuarios",
                description="Necesito poder crear, editar y eliminar usuarios",
                project_id=project.id,
                status="backlog",
                priority=2,
                story_points=5
            ),
            UserStory(
                title="Como usuario quiero ver mi tablero",
                description="Necesito visualizar mi tablero de tareas asignadas",
                project_id=project.id,
                status="backlog",
                priority=3,
                story_points=2
            )
        ]
        
        for story in stories:
            session.add(story)
        session.commit()
        
        # Crear sprint
        sprint = Sprint(
            name="Sprint 1",
            project_id=project.id,
            goal="Implementar funcionalidades básicas"
        )
        session.add(sprint)
        session.commit()
        
        # Crear tablero
        board = Board(
            name="Tablero principal",
            project_id=project.id
        )
        session.add(board)
        session.commit()
        
        # Crear listas para el tablero
        lists = [
            List(name="Por hacer", board_id=board.id, position=0),
            List(name="En progreso", board_id=board.id, position=1),
            List(name="Revisión", board_id=board.id, position=2),
            List(name="Hecho", board_id=board.id, position=3)
        ]
        
        for list_item in lists:
            session.add(list_item)
        session.commit()
        
        # Crear tarjetas
        card1 = Card(
            title="Diseñar interfaz de login",
            description="Crear mockups y diseño responsive",
            list_id=lists[0].id,
            position=0
        )
        
        card2 = Card(
            title="Implementar API de autenticación",
            description="Desarrollar endpoints para login/registro",
            list_id=lists[0].id,
            position=1
        )
        
        session.add(card1)
        session.add(card2)
        session.commit()
        
        # Crear tareas para las tarjetas
        task1 = Task(
            title="Diseñar pantalla login",
            card_id=card1.id,
            assignee_id=developer.id,
            estimate=4
        )
        
        task2 = Task(
            title="Implementar validación de formulario",
            card_id=card1.id,
            assignee_id=developer.id,
            estimate=2
        )
        
        session.add(task1)
        session.add(task2)
        session.commit()
        
        logger.info("Datos de prueba creados exitosamente")
        print("Datos de prueba creados exitosamente")

if __name__ == "__main__":
    # Para llamar directamente desde línea de comandos
    create_test_data() 