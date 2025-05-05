#!/usr/bin/env python3

"""
Script para actualizar manualmente el rol de admin@ingsistemas.gt en Supabase Auth
"""

import os
import asyncio
import httpx
import json

async def update_admin_role():
    """Actualiza el rol del usuario admin@ingsistemas.gt en Supabase"""
    
    # Obtener configuración desde variables de entorno o archivo .env
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("python-dotenv no está instalado, usando variables de entorno directamente")
    
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: Variables SUPABASE_URL y SUPABASE_KEY son requeridas")
        return
    
    print(f"Usando Supabase URL: {supabase_url}")
    
    # Email del usuario administrador
    admin_email = "admin@ingsistemas.gt"
    
    # 1. Primero, buscar el usuario por email para obtener su ID
    try:
        async with httpx.AsyncClient() as client:
            # Obtener todos los usuarios (necesitamos el rol de service_role para hacer esto)
            headers = {
                "apikey": supabase_key,
                "Authorization": f"Bearer {supabase_key}"
            }
            
            # Buscar el usuario por email
            search_url = f"{supabase_url}/auth/v1/admin/users"
            response = await client.get(search_url, headers=headers)
            
            if response.status_code != 200:
                print(f"Error al buscar usuarios: {response.status_code}")
                print(response.text)
                return
            
            users = response.json()
            admin_user = None
            
            # Buscar el usuario con el email correcto
            for user in users:
                if user.get("email") == admin_email:
                    admin_user = user
                    break
            
            if not admin_user:
                print(f"No se encontró el usuario {admin_email}")
                return
            
            user_id = admin_user.get("id")
            print(f"Usuario encontrado: {admin_email} (ID: {user_id})")
            
            # 2. Actualizar los metadatos del usuario para incluir el rol admin
            update_url = f"{supabase_url}/auth/v1/admin/users/{user_id}"
            user_data = {
                "app_metadata": {"role": "admin"},
                "user_metadata": {"role": "admin"}
            }
            
            update_response = await client.put(
                update_url, 
                headers=headers, 
                json=user_data
            )
            
            if update_response.status_code == 200:
                print(f"✅ Rol actualizado correctamente para {admin_email}")
                print(f"Nuevos metadatos: {update_response.json().get('user_metadata')}")
            else:
                print(f"❌ Error al actualizar el rol: {update_response.status_code}")
                print(update_response.text)
    
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(update_admin_role()) 