from supabase import create_client, Client
from app.core.config import settings
import httpx
from typing import Optional

# Intenta crear el cliente Supabase con manejo de errores
try:
    supabase: Client = create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )
except TypeError as e:
    if "got an unexpected keyword argument 'proxy'" in str(e):
        # Si el error es sobre 'proxy', usamos un enfoque alternativo
        print("Usando implementación alternativa para Supabase debido a problemas de compatibilidad")
        supabase = None
    else:
        raise e

async def get_user_by_id(user_id: str):
    """Obtiene un usuario de Supabase por su ID"""
    if supabase:
        return supabase.auth.admin.get_user_by_id(user_id)
    else:
        # Implementación alternativa directa con httpx
        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}"
        }
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                return response.json()
            return None

async def validate_jwt_token(token: str) -> Optional[dict]:
    """Valida un token JWT de Supabase"""
    if supabase:
        try:
            return supabase.auth.get_user(token)
        except Exception as e:
            return None
    else:
        # Implementación alternativa directa con httpx
        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {token}"
        }
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    return {"data": response.json()}
                return None
            except Exception as e:
                return None 