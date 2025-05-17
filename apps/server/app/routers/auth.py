from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from sqlalchemy import text
from app.database.db import get_db
from app.models.user import UserProfile
from app.core.auth import get_current_user, AuthUser
from app.core.supabase import create_user, sign_up_with_email_password, supabase, update_user_metadata
from pydantic import BaseModel
import uuid
import httpx

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "No encontrado"}},
)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: str = "member"
    bio: str = None
    avatar_url: str = None

class RegisterResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: str

@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
):
    """Inicia sesión con email y contraseña"""
    try:
        # Verificar si tenemos acceso directo a Supabase
        if supabase:
            try:
                # Intentar login con el cliente Supabase
                print(f"Intentando login con Supabase: {login_data.email}")
                login_response = supabase.auth.sign_in_with_password({
                    "email": login_data.email,
                    "password": login_data.password
                })
                
                # Extraer token de la respuesta
                if hasattr(login_response, 'session') and login_response.session:
                    print(f"Login exitoso con cliente Supabase para {login_data.email}")
                    return TokenResponse(
                        access_token=login_response.session.access_token,
                        token_type="bearer"
                    )
                else:
                    print(f"Respuesta de login sin sesión: {login_response}")
            except Exception as e:
                print(f"Error en login con cliente Supabase: {e}")
        
        # Si el cliente no está disponible o falló, usar httpx directamente
        print("Intentando login directo con la API REST de Supabase")
        url = f"{supabase.supabase_url}/auth/v1/token?grant_type=password"
        headers = {
            "apikey": supabase.supabase_key,
            "Content-Type": "application/json"
        }
        payload = {
            "email": login_data.email,
            "password": login_data.password
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers, json=payload)
            print(f"Respuesta de login directo: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                return TokenResponse(
                    access_token=data.get("access_token"),
                    token_type="bearer"
                )
            
            # Manejar errores comunes
            if response.status_code == 400:
                print(f"Error de autenticación: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Credenciales inválidas"
                )
            elif response.status_code == 422:
                print(f"Error en formato de datos: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Formato de datos inválido"
                )
            else:
                print(f"Error inesperado en login: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error en el servidor de autenticación"
                )
    
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error inesperado en login: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al iniciar sesión: {str(e)}"
        )

@router.post("/register", response_model=RegisterResponse)
async def register_user(
    user_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Registra un nuevo usuario en el sistema"""
    try:
        # Validar rol
        valid_roles = ["developer", "product_owner", "member", "admin"]
        if user_data.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Rol inválido. Debe ser uno de: {', '.join(valid_roles)}"
            )
        
        # Crear el usuario en Supabase Auth
        user_metadata = {
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "role": user_data.role
        }
        
        # Intentar crear el usuario en Supabase Auth
        print(f"Intentando crear usuario en Supabase: {user_data.email}")
        
        # Primero intentar con el método admin (asíncrono)
        auth_user = await create_user(
            email=user_data.email,
            password=user_data.password,
            user_metadata=user_metadata
        )
        
        # Si falla, intentar con el método de registro normal
        if not auth_user:
            print("Intentando crear usuario con sign_up...")
            auth_user = sign_up_with_email_password(
                email=user_data.email,
                password=user_data.password,
                user_metadata=user_metadata
            )
        
        # Verificar que se haya creado el usuario en Supabase
        if not auth_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al crear usuario en Supabase Auth"
            )
        
        print(f"Usuario creado en Supabase: {auth_user}")
        
        # Extraer ID de Supabase de la respuesta
        auth_user_id = None
        
        # Intentar diferentes formas de obtener el ID según la estructura de la respuesta
        if isinstance(auth_user, dict):
            # Respuesta directa de la API httpx
            if "id" in auth_user:
                auth_user_id = auth_user["id"]
            # Respuesta anidada
            elif "user" in auth_user and isinstance(auth_user["user"], dict):
                auth_user_id = auth_user["user"].get("id")
            elif "data" in auth_user and isinstance(auth_user["data"], dict):
                if "user" in auth_user["data"] and isinstance(auth_user["data"]["user"], dict):
                    auth_user_id = auth_user["data"]["user"].get("id")
                else:
                    auth_user_id = auth_user["data"].get("id")
        # Para objetos de supabase-py
        elif hasattr(auth_user, "user") and auth_user.user:
            auth_user_id = auth_user.user.id
        
        # Si no se pudo obtener el ID, usar un UUID como fallback
        if not auth_user_id:
            print("⚠️ No se pudo obtener ID de Supabase, usando UUID como fallback")
            auth_user_id = str(uuid.uuid4())
        
        # Generar ID para el perfil en nuestra base de datos
        user_id = str(uuid.uuid4())
        
        # Crear perfil en la base de datos local
        query = text("""
        INSERT INTO user_profiles (id, auth_id, first_name, last_name, email, bio, avatar_url, role, created_at, updated_at, is_active)
        VALUES (:id, :auth_id, :first_name, :last_name, :email, :bio, :avatar_url, :role, NOW(), NOW(), true)
        RETURNING id
        """)
        
        db.execute(
            query, 
            {
                "id": user_id,
                "auth_id": auth_user_id,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "email": user_data.email,
                "bio": user_data.bio,
                "avatar_url": user_data.avatar_url,
                "role": user_data.role
            }
        )
        
        db.commit()
        
        return RegisterResponse(
            id=user_id,
            email=user_data.email,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role=user_data.role
        )
        
    except HTTPException as e:
        # Re-lanzar excepciones HTTP
        raise e
    except Exception as e:
        print(f"Error inesperado al registrar usuario: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar usuario: {str(e)}"
        )

@router.get("/me", response_model=AuthUser)
async def get_current_user_info(current_user: AuthUser = Depends(get_current_user)):
    """Endpoint para verificar la información del usuario actual"""
    return current_user

@router.get("/validate", response_model=dict)
async def validate_token(current_user: AuthUser = Depends(get_current_user)):
    """Endpoint para validar el token JWT"""
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email
    }

@router.post("/sync-roles", response_model=dict)
async def sync_user_role(current_user: AuthUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Sincroniza el rol del usuario actual desde la base de datos local con Supabase Auth"""
    try:
        # Obtener el rol del usuario desde la base de datos local
        user_query = text("""
            SELECT role FROM user_profiles
            WHERE auth_id = :auth_id OR email = :email
            LIMIT 1
        """)
        result = db.execute(user_query, {"auth_id": current_user.id, "email": current_user.email})
        user_record = result.fetchone()
        
        if not user_record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado en la base de datos local"
            )
        
        # Obtener el rol del usuario
        role = user_record[0]
        
        # Actualizar los metadatos en Supabase Auth
        updated_user = await update_user_metadata(current_user.id, {"role": role})
        
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al actualizar metadatos en Supabase Auth"
            )
        
        return {
            "success": True,
            "message": f"Rol sincronizado correctamente: {role}",
            "role": role
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al sincronizar rol: {str(e)}"
        ) 