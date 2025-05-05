from supabase import create_client, Client
from app.core.config import settings
import httpx
from typing import Optional, Dict, Any

# Intentamos importar supabase con manejo de excepciones
try:
    # Versión simplificada sin opciones adicionales
    supabase: Optional[Client] = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )
except Exception as e:
    print(f"Error al inicializar Supabase: {e}")
    supabase = None

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Obtiene un usuario de Supabase por su ID"""
    if supabase:
        try:
            return supabase.auth.admin.get_user_by_id(user_id)
        except Exception as e:
            print(f"Error al obtener usuario por ID: {e}")
            return None
    else:
        print("Supabase no está inicializado")
        return None

async def validate_jwt_token(token: str) -> Optional[dict]:
    """Valida un token JWT de Supabase"""
    if supabase:
        try:
            return supabase.auth.get_user(token)
        except Exception as e:
            return None
    else:
        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "Authorization": f"Bearer {token}",
            "apiKey": settings.SUPABASE_KEY
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    return response.json()
                else:
                    return None
            except Exception as e:
                print(f"Error validando JWT: {e}")
                return None

async def update_user_metadata(user_id: str, metadata: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Actualiza los metadatos de un usuario en Supabase Auth"""
    if supabase:
        try:
            # Usar el método en la versión actual de la biblioteca sin el parámetro proxy
            response = supabase.auth.admin.update_user_by_id(
                user_id,
                {"user_metadata": metadata}
            )
            return response
        except Exception as e:
            print(f"Error al actualizar metadatos de usuario en Supabase Auth: {e}")
            return None
    else:
        print("Supabase no está inicializado")
        return None 