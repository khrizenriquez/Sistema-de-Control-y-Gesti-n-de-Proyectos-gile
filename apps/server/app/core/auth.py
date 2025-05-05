from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.supabase import validate_jwt_token, get_user_by_id
from typing import Optional, Any, Dict
from pydantic import BaseModel

# Modelo para representar los datos del usuario autenticado
class AuthUser(BaseModel):
    id: str
    email: str
    role: str = "member"
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
    
    print(f"Validando token JWT con respuesta: {user_response}")
    
    # Verifica si la respuesta es None o vacía
    if not user_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extraer información del usuario de la respuesta
    user_info = extract_user_info(user_response)
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se pudo extraer información del usuario de la respuesta",
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
        role=user_info.get('role', "member"),
        user_metadata=user_info.get('user_metadata')
    )
    
    return auth_user

def extract_user_info(response: Any) -> Dict[str, Any]:
    """
    Extrae la información del usuario de la respuesta de Supabase.
    Maneja diferentes formatos de respuesta.
    """
    # Para depuración
    print(f"Extrayendo información de usuario de: {type(response)}")
    
    # Si no es un dict, convertir a string y retornar error
    if not isinstance(response, dict):
        print(f"Respuesta no es un diccionario: {response}")
        return None
    
    # Para la nueva API de Supabase (v1.0+)
    if hasattr(response, 'user') and response.user:
        user = response.user
        return {
            'id': user.id,
            'email': user.email,
            'role': user.user_metadata.get('role', 'member') if user.user_metadata else 'member',
            'user_metadata': user.user_metadata
        }
    
    # Para respuestas en formato dict
    if isinstance(response, dict):
        # Si tiene 'user' directo en la respuesta
        if 'user' in response and isinstance(response['user'], dict):
            user = response['user']
            return {
                'id': user.get('id'),
                'email': user.get('email'),
                'role': (user.get('user_metadata') or {}).get('role', 'member'),
                'user_metadata': user.get('user_metadata')
            }
        
        # Si tiene 'data.user'
        if 'data' in response and isinstance(response['data'], dict):
            data = response['data']
            if 'user' in data and isinstance(data['user'], dict):
                user = data['user']
                return {
                    'id': user.get('id'),
                    'email': user.get('email'),
                    'role': (user.get('user_metadata') or {}).get('role', 'member'),
                    'user_metadata': user.get('user_metadata')
                }
            # Si data contiene directamente los datos del usuario
            if 'id' in data and 'email' in data:
                return {
                    'id': data.get('id'),
                    'email': data.get('email'),
                    'role': (data.get('user_metadata') or {}).get('role', 'member'),
                    'user_metadata': data.get('user_metadata')
                }
        
        # Si la respuesta tiene directamente los datos del usuario
        if 'id' in response and 'email' in response:
            return {
                'id': response.get('id'),
                'email': response.get('email'),
                'role': (response.get('user_metadata') or {}).get('role', 'member'),
                'user_metadata': response.get('user_metadata')
            }
    
    # Si llegamos aquí, no pudimos extraer la información
    print(f"No se pudo extraer información de usuario de la respuesta: {response}")
    return None

# Dependencia opcional para rutas que pueden tener autenticación opcional
async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[AuthUser]:
    """
    Intenta obtener el usuario actual, pero no falla si no hay token o es inválido.
    Útil para endpoints que funcionan con y sin autenticación.
    """
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
    except Exception as e:
        print(f"Error obteniendo usuario opcional: {e}")
        return None 