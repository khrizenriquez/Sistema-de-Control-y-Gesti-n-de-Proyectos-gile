from supabase import create_client, Client
from app.core.config import settings
import httpx
from typing import Optional, Dict, Any
import json

# Intentamos importar supabase con manejo de excepciones
try:
    # Verificar que las credenciales están disponibles
    if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
        print("⚠️ Variables de Supabase no configuradas correctamente.")
        supabase = None
    else:
        # Crear cliente Supabase (versión 1.0.4)
        supabase: Optional[Client] = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )
        print(f"✅ Cliente Supabase inicializado correctamente con URL: {settings.SUPABASE_URL}")
except Exception as e:
    print(f"Error al inicializar Supabase: {e}")
    supabase = None

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Obtiene un usuario de Supabase por su ID"""
    # Usar httpx directamente ya que supabase-py 1.0.4 no tiene admin.get_user_by_id
    url = f"{settings.SUPABASE_URL}/auth/v1/admin/users/{user_id}"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            print(f"Respuesta de get_user_by_id: Código {response.status_code}")
            
            if response.status_code == 200:
                return response.json()
            print(f"Error en get_user_by_id: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error en get_user_by_id: {e}")
        return None

async def validate_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Valida un token JWT de Supabase"""
    # Usar httpx directamente
    url = f"{settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            print(f"Respuesta de validate_jwt_token: Código {response.status_code}")
            
            if response.status_code == 200:
                user_data = response.json()
                # Formatear en un formato consistente para nuestro código
                return {
                    "data": {
                        "user": user_data
                    }
                }
            
            print(f"Error en validate_jwt_token: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error en validate_jwt_token: {e}")
        return None

async def update_user_metadata(user_id: str, metadata: Dict[str, Any]) -> Optional[dict]:
    """Actualiza los metadatos de un usuario en Supabase Auth"""
    # Usar httpx directamente
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
            print(f"Respuesta de update_user_metadata: Código {response.status_code}")
            
            if response.status_code == 200:
                return response.json()
            
            print(f"Error en update_user_metadata: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error en update_user_metadata: {e}")
        return None

async def create_user(email: str, password: str, user_metadata: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
    """Crea un nuevo usuario en Supabase Auth"""
    # Usar httpx directamente ya que supabase-py 1.0.4 no tiene admin.create_user
    url = f"{settings.SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json" 
    }
    payload = {
        "email": email,
        "password": password,
        "email_confirm": True
    }
    
    # Agregar user_metadata si está presente
    if user_metadata:
        payload["user_metadata"] = user_metadata
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            print(f"Respuesta de create_user: Código {response.status_code}")
            
            if response.status_code == 200 or response.status_code == 201:
                return response.json()
            
            print(f"Error en create_user: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"Error en create_user: {e}")
        return None

def sign_up_with_email_password(email: str, password: str, user_metadata: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
    """
    Registra un nuevo usuario usando el cliente de Supabase 
    (para uso directo en endpoints sin async)
    """
    if not supabase:
        print("⚠️ Cliente Supabase no disponible")
        return None
        
    try:
        # Intentar registrar usando supabase-py
        signup_data = supabase.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": user_metadata
            } if user_metadata else {}
        })
        
        print(f"Respuesta de sign_up: {signup_data}")
        return signup_data
    except Exception as e:
        print(f"Error en sign_up_with_email_password: {e}")
        return None 