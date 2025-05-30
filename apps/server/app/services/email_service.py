import logging
from typing import Optional, Dict, Any
from mailjet_rest import Client
from app.core.config import settings
import time
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Métricas para Apitally
email_metrics = {
    "emails_sent": 0,
    "emails_failed": 0,
    "emails_sent_by_type": {},
    "total_send_time": 0.0,
    "last_email_timestamp": None
}

class EmailTemplate(BaseModel):
    """Template de email"""
    subject: str
    html_content: str
    text_content: Optional[str] = None

class EmailService:
    """Servicio para envío de emails con Mailjet"""
    
    def __init__(self):
        self.mailjet = None
        self.enabled = settings.ENABLE_EMAIL_NOTIFICATIONS
        
        if self.enabled and settings.MAILJET_API_KEY and settings.MAILJET_SECRET_KEY:
            try:
                self.mailjet = Client(
                    auth=(settings.MAILJET_API_KEY, settings.MAILJET_SECRET_KEY),
                    version='v3.1'
                )
                logger.info("✅ Mailjet configurado correctamente")
            except Exception as e:
                logger.error(f"❌ Error configurando Mailjet: {e}")
                self.enabled = False
        else:
            logger.info("ℹ️ Servicio de email deshabilitado o no configurado")
    
    async def send_notification_email(
        self,
        to_email: str,
        to_name: str,
        notification_type: str,
        subject: str,
        content: str,
        entity_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Enviar email de notificación
        
        Args:
            to_email: Email del destinatario
            to_name: Nombre del destinatario
            notification_type: Tipo de notificación (card_assigned, card_comment, etc.)
            subject: Asunto del email
            content: Contenido de la notificación
            entity_data: Datos adicionales de la entidad (board, card, etc.)
            
        Returns:
            bool: True si se envió correctamente, False en caso contrario
        """
        if not self.enabled or not self.mailjet:
            logger.debug("Servicio de email deshabilitado")
            return False
        
        start_time = time.time()
        
        try:
            # Generar template HTML
            html_content = self._generate_html_template(
                to_name=to_name,
                notification_type=notification_type,
                content=content,
                entity_data=entity_data
            )
            
            # Configurar mensaje
            data = {
                'Messages': [
                    {
                        "From": {
                            "Email": settings.FROM_EMAIL,
                            "Name": settings.FROM_NAME
                        },
                        "To": [
                            {
                                "Email": to_email,
                                "Name": to_name
                            }
                        ],
                        "Subject": subject,
                        "TextPart": content,  # Versión texto plano
                        "HTMLPart": html_content,  # Versión HTML
                        "CustomID": f"{notification_type}_{int(time.time())}"
                    }
                ]
            }
            
            # Enviar email
            result = self.mailjet.send.create(data=data)
            
            # Calcular tiempo de envío
            send_time = time.time() - start_time
            
            # Registrar métricas
            self._update_metrics(
                success=result.status_code == 200,
                notification_type=notification_type,
                send_time=send_time
            )
            
            if result.status_code == 200:
                logger.info(f"✅ Email enviado correctamente a {to_email} ({notification_type})")
                return True
            else:
                logger.error(f"❌ Error enviando email: {result.status_code} - {result.json()}")
                return False
                
        except Exception as e:
            send_time = time.time() - start_time
            self._update_metrics(success=False, notification_type=notification_type, send_time=send_time)
            logger.error(f"❌ Excepción enviando email a {to_email}: {e}")
            return False
    
    def _generate_html_template(
        self,
        to_name: str,
        notification_type: str,
        content: str,
        entity_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generar template HTML para el email"""
        
        # Determinar color y icono según el tipo
        type_config = {
            "card_assigned": {"color": "#3B82F6", "icon": "📋", "title": "Nueva asignación"},
            "card_comment": {"color": "#10B981", "icon": "💬", "title": "Nuevo comentario"},
            "card_updated": {"color": "#F59E0B", "icon": "✏️", "title": "Tarjeta actualizada"},
            "project_invitation": {"color": "#8B5CF6", "icon": "👥", "title": "Invitación a proyecto"},
            "project_obsolete": {"color": "#EF4444", "icon": "⚠️", "title": "Proyecto marcado como obsoleto"},
            "default": {"color": "#6B7280", "icon": "🔔", "title": "Notificación"}
        }
        
        config = type_config.get(notification_type, type_config["default"])
        
        # Generar enlace si hay datos de entidad
        action_link = ""
        if entity_data:
            if "card_id" in entity_data and "board_id" in entity_data:
                action_link = f'<p style="margin: 20px 0;"><a href="http://localhost:3000/boards/{entity_data["board_id"]}" style="background-color: {config["color"]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Ver tarjeta</a></p>'
        
        html_template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>{config['title']}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header -->
                <div style="background-color: {config['color']}; color: white; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px; font-weight: 600;">
                        {config['icon']} {config['title']}
                    </h1>
                </div>
                
                <!-- Content -->
                <div style="padding: 32px;">
                    <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 18px;">
                        Hola {to_name},
                    </h2>
                    
                    <p style="color: #4b5563; line-height: 1.6; margin: 0 0 24px 0; font-size: 16px;">
                        {content}
                    </p>
                    
                    {action_link}
                    
                    <hr style="border: none; height: 1px; background-color: #e5e7eb; margin: 24px 0;">
                    
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                        Este mensaje fue enviado automáticamente por el Sistema de Gestión de Proyectos Ágiles.
                        <br>
                        <a href="http://localhost:3000/profile" style="color: {config['color']};">Configurar preferencias de email</a>
                    </p>
                </div>
                
                <!-- Footer -->
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2024 Sistema de Gestión de Proyectos Ágiles
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html_template
    
    def _update_metrics(self, success: bool, notification_type: str, send_time: float):
        """Actualizar métricas para Apitally"""
        global email_metrics
        
        if success:
            email_metrics["emails_sent"] += 1
        else:
            email_metrics["emails_failed"] += 1
        
        # Contar por tipo
        type_key = f"type_{notification_type}"
        if type_key not in email_metrics["emails_sent_by_type"]:
            email_metrics["emails_sent_by_type"][type_key] = 0
        email_metrics["emails_sent_by_type"][type_key] += 1
        
        # Tiempo total
        email_metrics["total_send_time"] += send_time
        email_metrics["last_email_timestamp"] = time.time()
    
    def get_metrics(self) -> Dict[str, Any]:
        """Obtener métricas para Apitally"""
        avg_send_time = 0
        if email_metrics["emails_sent"] > 0:
            avg_send_time = email_metrics["total_send_time"] / email_metrics["emails_sent"]
        
        return {
            **email_metrics,
            "average_send_time": avg_send_time,
            "success_rate": email_metrics["emails_sent"] / max(email_metrics["emails_sent"] + email_metrics["emails_failed"], 1) * 100
        }

# Instancia global del servicio
email_service = EmailService() 