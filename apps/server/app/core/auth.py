from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import validate_jwt_token, get_user_by_id
from typing import Optional
from pydantic import BaseModel

# Modelo para representar los datos del usuario autenticado
class AuthUser(BaseModel):
    id: str
    email: str
    user_metadata: Optional[dict] = None

# Configuración del bearer token para autenticación
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> AuthUser:
    """
    Valida el token JWT y devuelve el usuario autenticado.
    Lanza una excepción 401 si el token no es válido.
    """
    token = credentials.credentials
    user_response = await validate_jwt_token(token)
    
    if not user_response or not user_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear y devolver el usuario autenticado
    auth_user = AuthUser(
        id=user_response.user.id,
        email=user_response.user.email,
        user_metadata=user_response.user.user_metadata
    )
    
    return auth_user

# Dependencia opcional para rutas que pueden tener autenticación opcional
async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[AuthUser]:
    """
    Intenta obtener el usuario actual, pero no falla si no hay token o es inválido.
    Útil para endpoints que funcionan con y sin autenticación.
    """
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
    except Exception:
        return None 