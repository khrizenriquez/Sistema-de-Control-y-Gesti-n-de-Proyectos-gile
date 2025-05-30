"""
Servicio para gestión del ciclo de vida de proyectos ágiles
"""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from sqlalchemy.sql import text
import json
import uuid

from app.models.project import Project, ProjectStatus, ProjectMilestone, ProjectActivity
from app.models.agile import Sprint, UserStory, Task
from app.models.user import UserProfile


class ProjectLifecycleService:
    """Servicio para gestionar el ciclo de vida completo de proyectos"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def start_project(self, project_id: str, user_id: str, start_date: Optional[datetime] = None) -> bool:
        """Iniciar un proyecto (cambiar de PLANNING a ACTIVE)"""
        project = await self._get_project(project_id)
        if not project:
            return False
        
        if project.status != ProjectStatus.PLANNING:
            raise ValueError(f"El proyecto debe estar en estado PLANNING para iniciarse. Estado actual: {project.status}")
        
        project.status = ProjectStatus.ACTIVE
        project.start_date = start_date or datetime.utcnow()
        project.updated_at = datetime.utcnow()
        
        # Registrar actividad
        activity_data = {
            "start_date": project.start_date.strftime('%Y-%m-%d')
        }
        
        await self._log_activity(
            project_id=project_id,
            user_id=user_id,
            activity_type="project_started",
            description=f"Proyecto iniciado el {project.start_date.strftime('%Y-%m-%d')}",
            extra_data=json.dumps(activity_data)
        )
        
        self.db.commit()
        return True
    
    async def complete_project(self, project_id: str, user_id: str, completion_notes: Optional[str] = None) -> bool:
        """Completar un proyecto exitosamente"""
        project = await self._get_project(project_id)
        if not project:
            return False
        
        if project.status not in [ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD]:
            raise ValueError(f"Solo se pueden completar proyectos activos o pausados. Estado actual: {project.status}")
        
        # Verificar que todos los sprints estén completados o cancelados
        active_sprints = await self._get_active_sprints(project_id)
        if active_sprints:
            raise ValueError("No se puede completar el proyecto mientras haya sprints activos")
        
        # Calcular métricas finales
        completion_stats = await self._calculate_completion_stats(project_id)
        
        project.status = ProjectStatus.COMPLETED
        project.actual_end_date = datetime.utcnow()
        project.completion_percentage = 100.0
        project.updated_at = datetime.utcnow()
        
        # Registrar actividad
        activity_data = {
            "completion_notes": completion_notes,
            "stats": completion_stats
        }
        
        await self._log_activity(
            project_id=project_id,
            user_id=user_id,
            activity_type="project_completed",
            description=f"Proyecto completado exitosamente el {project.actual_end_date.strftime('%Y-%m-%d')}",
            extra_data=json.dumps(activity_data)
        )
        
        self.db.commit()
        return True
    
    async def pause_project(self, project_id: str, user_id: str, reason: Optional[str] = None) -> bool:
        """Pausar un proyecto temporalmente"""
        project = await self._get_project(project_id)
        if not project:
            return False
        
        if project.status != ProjectStatus.ACTIVE:
            raise ValueError(f"Solo se pueden pausar proyectos activos. Estado actual: {project.status}")
        
        project.status = ProjectStatus.ON_HOLD
        project.updated_at = datetime.utcnow()
        
        await self._log_activity(
            project_id=project_id,
            user_id=user_id,
            activity_type="project_paused",
            description=f"Proyecto pausado el {datetime.utcnow().strftime('%Y-%m-%d')}",
            extra_data=json.dumps({"reason": reason}) if reason else None
        )
        
        self.db.commit()
        return True
    
    async def resume_project(self, project_id: str, user_id: str) -> bool:
        """Reanudar un proyecto pausado"""
        project = await self._get_project(project_id)
        if not project:
            return False
        
        if project.status != ProjectStatus.ON_HOLD:
            raise ValueError(f"Solo se pueden reanudar proyectos pausados. Estado actual: {project.status}")
        
        project.status = ProjectStatus.ACTIVE
        project.updated_at = datetime.utcnow()
        
        await self._log_activity(
            project_id=project_id,
            user_id=user_id,
            activity_type="project_resumed",
            description="Proyecto reanudado"
        )
        
        self.db.commit()
        return True
    
    async def cancel_project(self, project_id: str, user_id: str, reason: str) -> bool:
        """Cancelar un proyecto"""
        project = await self._get_project(project_id)
        if not project:
            return False
        
        if project.status in [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED, ProjectStatus.ARCHIVED]:
            raise ValueError(f"No se puede cancelar un proyecto en estado {project.status}")
        
        project.status = ProjectStatus.CANCELLED
        project.actual_end_date = datetime.utcnow()
        project.updated_at = datetime.utcnow()
        
        await self._log_activity(
            project_id=project_id,
            user_id=user_id,
            activity_type="project_cancelled",
            description=f"Proyecto cancelado el {datetime.utcnow().strftime('%Y-%m-%d')}",
            extra_data=json.dumps({"reason": reason})
        )
        
        self.db.commit()
        return True
    
    async def archive_project(self, project_id: str, user_id: str) -> bool:
        """Archivar un proyecto completado o cancelado"""
        project = await self._get_project(project_id)
        if not project:
            return False
        
        if not project.can_be_archived():
            raise ValueError("Solo se pueden archivar proyectos completados o cancelados")
        
        project.status = ProjectStatus.ARCHIVED
        project.archived_at = datetime.utcnow()
        project.updated_at = datetime.utcnow()
        
        await self._log_activity(
            project_id=project_id,
            user_id=user_id,
            activity_type="project_archived",
            description="Proyecto archivado"
        )
        
        self.db.commit()
        return True
    
    async def mark_obsolete(self, project_id: str, user_id: str, reason: str) -> bool:
        """Marcar un proyecto como obsoleto (solo admins)"""
        project = await self._get_project(project_id)
        if not project:
            return False
        
        if project.status in [ProjectStatus.ARCHIVED]:
            raise ValueError("No se puede marcar como obsoleto un proyecto archivado")
        
        project.status = ProjectStatus.OBSOLETE
        project.updated_at = datetime.utcnow()
        
        await self._log_activity(
            project_id=project_id,
            user_id=user_id,
            activity_type="project_marked_obsolete",
            description=f"Proyecto marcado como obsoleto el {datetime.utcnow().strftime('%Y-%m-%d')}",
            extra_data=json.dumps({"reason": reason})
        )
        
        # Enviar notificaciones a todos los miembros del proyecto
        await self._notify_project_obsolete(project_id, reason)
        
        self.db.commit()
        return True
    
    async def update_project_dates(
        self, 
        project_id: str, 
        user_id: str,
        start_date: Optional[datetime] = None,
        planned_end_date: Optional[datetime] = None
    ) -> bool:
        """Actualizar fechas del proyecto"""
        project = await self._get_project(project_id)
        if not project:
            return False
        
        changes = []
        
        if start_date and start_date != project.start_date:
            project.start_date = start_date
            changes.append(f"Fecha de inicio: {start_date.strftime('%Y-%m-%d')}")
        
        if planned_end_date and planned_end_date != project.planned_end_date:
            project.planned_end_date = planned_end_date
            changes.append(f"Fecha planificada de fin: {planned_end_date.strftime('%Y-%m-%d')}")
        
        if changes:
            project.updated_at = datetime.utcnow()
            
            await self._log_activity(
                project_id=project_id,
                user_id=user_id,
                activity_type="dates_updated",
                description=f"Fechas actualizadas: {', '.join(changes)}"
            )
            
            self.db.commit()
        
        return True
    
    async def update_completion_percentage(self, project_id: str) -> float:
        """Calcular y actualizar el porcentaje de completación del proyecto"""
        project = await self._get_project(project_id)
        if not project:
            return 0.0
        
        stats = await self._calculate_completion_stats(project_id)
        completion_percentage = stats.get("completion_percentage", 0.0)
        
        project.completion_percentage = completion_percentage
        project.updated_at = datetime.utcnow()
        
        self.db.commit()
        return completion_percentage
    
    async def get_project_health_status(self, project_id: str) -> Dict[str, Any]:
        """Obtener estado de salud del proyecto"""
        project = await self._get_project(project_id)
        if not project:
            return {}
        
        stats = await self._calculate_completion_stats(project_id)
        
        # Verificar estado de fechas
        is_overdue = project.is_overdue()
        days_remaining = project.days_remaining()
        
        # Verificar sprints atrasados
        overdue_sprints = await self._get_overdue_sprints(project_id)
        
        # Verificar hitos atrasados
        overdue_milestones = await self._get_overdue_milestones(project_id)
        
        # Calcular nivel de riesgo
        risk_level = "low"
        risk_factors = []
        
        if is_overdue:
            risk_level = "high"
            risk_factors.append("Proyecto atrasado")
        elif days_remaining and days_remaining < 7:
            risk_level = "medium"
            risk_factors.append("Menos de 7 días para finalizar")
        
        if overdue_sprints:
            risk_level = "high" if risk_level != "high" else risk_level
            risk_factors.append(f"{len(overdue_sprints)} sprint(s) atrasado(s)")
        
        if overdue_milestones:
            risk_level = "high" if risk_level != "high" else risk_level
            risk_factors.append(f"{len(overdue_milestones)} hito(s) atrasado(s)")
        
        return {
            "project_id": project_id,
            "status": project.status,
            "completion_percentage": project.completion_percentage,
            "is_overdue": is_overdue,
            "days_remaining": days_remaining,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "stats": stats,
            "overdue_sprints": len(overdue_sprints),
            "overdue_milestones": len(overdue_milestones)
        }
    
    async def get_projects_requiring_attention(self) -> List[Dict[str, Any]]:
        """Obtener proyectos que requieren atención inmediata"""
        query = text("""
            SELECT id, name, status, planned_end_date, completion_percentage
            FROM projects 
            WHERE is_active = true 
            AND status IN ('active', 'on_hold')
            AND (
                planned_end_date < NOW()  -- Proyectos atrasados
                OR planned_end_date < NOW() + INTERVAL '7 days'  -- Próximos a vencer
                OR completion_percentage < 20 AND planned_end_date < NOW() + INTERVAL '30 days'  -- Poco progreso y pronto a vencer
            )
            ORDER BY planned_end_date ASC
        """)
        
        result = self.db.execute(query)
        projects = []
        
        for row in result.fetchall():
            project_health = await self.get_project_health_status(row[0])
            projects.append({
                "id": row[0],
                "name": row[1],
                "status": row[2],
                "planned_end_date": row[3],
                "completion_percentage": row[4],
                "health": project_health
            })
        
        return projects
    
    # Métodos privados auxiliares
    
    async def _get_project(self, project_id: str) -> Optional[Project]:
        """Obtener proyecto por ID"""
        query = select(Project).where(Project.id == project_id)
        result = self.db.exec(query)
        return result.first()
    
    async def _get_active_sprints(self, project_id: str) -> List[Sprint]:
        """Obtener sprints activos del proyecto"""
        query = select(Sprint).where(
            Sprint.project_id == project_id,
            Sprint.status == "active"
        )
        result = self.db.exec(query)
        return result.all()
    
    async def _get_overdue_sprints(self, project_id: str) -> List[Sprint]:
        """Obtener sprints atrasados del proyecto"""
        query = text("""
            SELECT * FROM sprints 
            WHERE project_id = :project_id 
            AND status = 'active' 
            AND end_date < NOW()
        """)
        result = self.db.execute(query, {"project_id": project_id})
        return result.fetchall()
    
    async def _get_overdue_milestones(self, project_id: str) -> List[ProjectMilestone]:
        """Obtener hitos atrasados del proyecto"""
        query = select(ProjectMilestone).where(
            ProjectMilestone.project_id == project_id,
            ProjectMilestone.is_completed == False,
            ProjectMilestone.due_date < datetime.utcnow()
        )
        result = self.db.exec(query)
        return result.all()
    
    async def _calculate_completion_stats(self, project_id: str) -> Dict[str, Any]:
        """Calcular estadísticas de completación del proyecto"""
        # Obtener estadísticas de user stories
        stories_query = text("""
            SELECT 
                COUNT(*) as total_stories,
                COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_stories,
                COALESCE(SUM(story_points), 0) as total_points,
                COALESCE(SUM(CASE WHEN status = 'done' THEN story_points ELSE 0 END), 0) as completed_points
            FROM user_stories 
            WHERE project_id = :project_id
        """)
        
        stories_result = self.db.execute(stories_query, {"project_id": project_id})
        stories_stats = stories_result.fetchone()
        
        # Obtener estadísticas de tareas
        tasks_query = text("""
            SELECT 
                COUNT(*) as total_tasks,
                COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks
            FROM tasks t
            JOIN user_stories us ON t.story_id = us.id
            WHERE us.project_id = :project_id
        """)
        
        tasks_result = self.db.execute(tasks_query, {"project_id": project_id})
        tasks_stats = tasks_result.fetchone()
        
        # Calcular porcentajes
        story_completion = 0.0
        if stories_stats[0] > 0:
            story_completion = (stories_stats[1] / stories_stats[0]) * 100
        
        task_completion = 0.0
        if tasks_stats[0] > 0:
            task_completion = (tasks_stats[1] / tasks_stats[0]) * 100
        
        points_completion = 0.0
        if stories_stats[2] > 0:
            points_completion = (stories_stats[3] / stories_stats[2]) * 100
        
        # Promedio ponderado de completación
        completion_percentage = (story_completion * 0.5 + task_completion * 0.3 + points_completion * 0.2)
        
        return {
            "total_stories": stories_stats[0],
            "completed_stories": stories_stats[1],
            "total_tasks": tasks_stats[0],
            "completed_tasks": tasks_stats[1],
            "total_story_points": stories_stats[2],
            "completed_story_points": stories_stats[3],
            "story_completion_percentage": round(story_completion, 2),
            "task_completion_percentage": round(task_completion, 2),
            "points_completion_percentage": round(points_completion, 2),
            "completion_percentage": round(completion_percentage, 2)
        }
    
    async def _log_activity(
        self,
        project_id: str,
        user_id: str,
        activity_type: str,
        description: str,
        extra_data: Optional[str] = None
    ):
        """Registrar actividad del proyecto"""
        activity = ProjectActivity(
            id=str(uuid.uuid4()),
            project_id=project_id,
            user_id=user_id,
            activity_type=activity_type,
            description=description,
            extra_data=extra_data
        )
        
        self.db.add(activity)
        # No hacemos commit aquí, lo hace el método que llama 
    
    async def _calculate_completion_percentage(self, project_id: str) -> float:
        """Calcular porcentaje de completación basado en user stories completadas"""
        stories_query = text("""
            SELECT 
                COUNT(*) as total_stories,
                COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_stories
            FROM user_stories 
            WHERE project_id = :project_id
        """)
        
        result = self.db.execute(stories_query, {"project_id": project_id})
        row = result.fetchone()
        
        if row and row[0] > 0:  # Si hay historias
            return (row[1] / row[0]) * 100.0
        return 0.0
    
    async def _notify_project_obsolete(self, project_id: str, reason: str):
        """Notificar a todos los miembros del proyecto que fue marcado como obsoleto"""
        try:
            # Obtener información del proyecto
            project_query = text("""
                SELECT name, client_name FROM projects WHERE id = :project_id
            """)
            project_result = self.db.execute(project_query, {"project_id": project_id})
            project_data = project_result.fetchone()
            
            if not project_data:
                return
            
            project_name = project_data[0]
            client_name = project_data[1]
            
            # Obtener todos los miembros activos del proyecto
            members_query = text("""
                SELECT DISTINCT up.id, up.email, up.first_name, up.last_name, up.email_notifications
                FROM user_profiles up
                JOIN project_members pm ON up.id = pm.user_id
                WHERE pm.project_id = :project_id 
                AND pm.is_active = true
                AND up.is_active = true
            """)
            
            members_result = self.db.execute(members_query, {"project_id": project_id})
            members = members_result.fetchall()
            
            # Crear notificación y enviar email a cada miembro
            for member in members:
                member_id, email, first_name, last_name, email_notifications = member
                
                # Crear contenido de notificación
                member_name = f"{first_name} {last_name}".strip() if first_name else email
                content = f"El proyecto '{project_name}' ha sido marcado como obsoleto."
                if client_name:
                    content += f" Cliente: {client_name}."
                content += f" Razón: {reason}. Ya no se podrán crear nuevos tableros en este proyecto."
                
                # Crear notificación in-app
                from app.routers.notifications import create_notification
                await create_notification(
                    db=self.db,
                    user_id=member_id,
                    content=content,
                    notification_type="project_obsolete",
                    entity_id=project_id,
                    data={
                        "project_name": project_name,
                        "client_name": client_name,
                        "reason": reason
                    }
                )
                
        except Exception as e:
            # Log el error pero no fallar la operación principal
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error enviando notificaciones de proyecto obsoleto: {e}") 