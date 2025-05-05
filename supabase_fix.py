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
        # Implementación alternativa con httpx
        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}"
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    return response.json()
                return None
        except Exception as e:
            print(f"Error al obtener usuario con httpx: {e}")
            return None

async def validate_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Valida un token JWT de Supabase"""
    if supabase:
        try:
            return supabase.auth.get_user(token)
        except Exception as e:
            print(f"Error al validar token: {e}")
            return None
    else:
        # Implementación alternativa con httpx
        url = f"{settings.SUPABASE_URL}/auth/v1/user"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {token}"
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=headers)
                if response.status_code == 200:
                    return {"data": response.json()}
                return None
        except Exception as e:
            print(f"Error al validar token con httpx: {e}")
            return None

async def update_user_metadata(user_id: str, metadata: Dict[str, Any]) -> Optional[dict]:
    """Actualiza los metadatos de un usuario en Supabase Auth"""
    if supabase:
        try:
            return supabase.auth.admin.update_user_by_id(user_id, {"user_metadata": metadata})
        except Exception as e:
            print(f"Error al actualizar metadatos de usuario en Supabase: {e}")
            return None
    else:
        # Implementación alternativa directa con httpx
        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "user_metadata": metadata
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(url, headers=headers, json=payload)
                if response.status_code == 200:
                    return response.json()
                print(f"Error al actualizar metadatos: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error en la solicitud HTTP: {e}")
            return None
            
async def create_user_in_supabase(email: str, password: str, metadata: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Crea un nuevo usuario en Supabase Auth"""
    if supabase:
        try:
            response = supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": metadata
            })
            print(f"Usuario creado en Supabase: {email}")
            return response
        except Exception as e:
            print(f"Error al crear usuario en Supabase: {e}")
            return None
    else:
        # Implementación alternativa con httpx
        url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
        headers = {
            "apikey": settings.SUPABASE_KEY,
            "Authorization": f"Bearer {settings.SUPABASE_KEY}",
            "Content-Type": "application/json"
        }
        payload = {
            "email": email,
            "password": password,
            "email_confirm": True,
            "user_metadata": metadata
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload)
                if response.status_code == 200 or response.status_code == 201:
                    print(f"Usuario creado en Supabase: {email}")
                    return response.json()
                print(f"Error al crear usuario: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error en la solicitud HTTP para crear usuario: {e}")
            return None 