from supabase import create_client, Client
from app.core.config import settings

# Crear cliente Supabase
supabase: Client = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_KEY
)

async def get_user_by_id(user_id: str):
    """Obtiene un usuario de Supabase por su ID"""
    return supabase.auth.admin.get_user_by_id(user_id)

async def validate_jwt_token(token: str):
    """Valida un token JWT de Supabase"""
    try:
        return supabase.auth.get_user(token)
    except Exception as e:
        return None 