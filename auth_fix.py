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
    
    # Verifica si la respuesta es None
    if not user_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verifica si la respuesta contiene 'data' o directamente los datos del usuario
    if isinstance(user_response, dict):
        if 'data' in user_response and isinstance(user_response['data'], dict):
            user_data = user_response['data']
            # Si dentro de data hay un campo 'user', usa ese campo
            if 'user' in user_data and isinstance(user_data['user'], dict):
                user_info = user_data['user']
            else:
                # Si no hay campo 'user', usa 'data' directamente
                user_info = user_data
        else:
            # Si no hay 'data', usa la respuesta directamente
            user_info = user_response
    else:
        # Manejar el caso cuando no es un diccionario (debería ser poco común)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato de respuesta inesperado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verifica que existan los campos necesarios
    if not user_info.get('id') or not user_info.get('email'):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Información de usuario incompleta",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear y devolver el usuario autenticado
    auth_user = AuthUser(
        id=user_info.get('id'),
        email=user_info.get('email'),
        user_metadata=user_info.get('user_metadata')
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