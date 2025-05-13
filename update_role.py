#!/usr/bin/env python3

import os
import asyncio
import httpx
import sys
import json

async def update_admin_role():
    """Actualiza el rol del usuario admin@ingsistemas.gt en Supabase"""
    
    # Obtener configuración desde variables de entorno
    try:
        from dotenv import load_dotenv
        # Intenta cargar variables de entorno desde el archivo .env
        load_dotenv()
    except ImportError:
        print("python-dotenv no está instalado, usando variables de entorno directamente")
    
    # Obtener credenciales desde variables de entorno
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Error: Variables de entorno SUPABASE_URL y SUPABASE_KEY son requeridas")
        print("Por favor, configura estas variables en el archivo .env o como variables de entorno")
        sys.exit(1)
    
    print(f"Usando Supabase URL: {supabase_url}")
    
    # Email del usuario administrador
    admin_email = "admin@ingsistemas.gt"
    
    try:
        async with httpx.AsyncClient() as client:
            # Obtener todos los usuarios
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
            
            # Analizar la respuesta
            response_data = response.json()
            print(f"Tipo de respuesta: {type(response_data)}")
            print(f"Contenido de la respuesta: {json.dumps(response_data, indent=2)[:500]} ... (truncado)")
            
            # Si la respuesta es un diccionario, buscar los usuarios
            if isinstance(response_data, dict) and "users" in response_data:
                users = response_data["users"]
            else:
                users = response_data if isinstance(response_data, list) else []
            
            print(f"Usuarios encontrados: {len(users)}")
            
            # Mostrar todos los usuarios
            print("Lista de usuarios:")
            for i, user in enumerate(users):
                if not isinstance(user, dict):
                    print(f"Usuario {i+1}: {user} (no es un diccionario)")
                    continue
                
                email = user.get("email", "Sin email")
                user_id = user.get("id", "Sin ID")
                app_metadata = user.get("app_metadata", {})
                user_metadata = user.get("user_metadata", {})
                
                print(f"Usuario {i+1}:")
                print(f"  ID: {user_id}")
                print(f"  Email: {email}")
                print(f"  App Metadata: {app_metadata}")
                print(f"  User Metadata: {user_metadata}")
                print("---")
            
            admin_user = None
            
            # Buscar el usuario con el email correcto
            for user in users:
                if isinstance(user, dict) and user.get("email") == admin_email:
                    admin_user = user
                    break
            
            if not admin_user:
                print(f"No se encontró el usuario {admin_email}")
                
                # Preguntar si quiere actualizar un usuario diferente
                print("\n¿Desea actualizar un usuario diferente? Introduzca el número del usuario (1, 2, etc.) o 'n' para cancelar:")
                choice = input()
                
                if choice.lower() == 'n':
                    return
                
                try:
                    choice_index = int(choice) - 1
                    if 0 <= choice_index < len(users):
                        admin_user = users[choice_index]
                        if not isinstance(admin_user, dict):
                            print("El usuario seleccionado no es válido")
                            return
                        admin_email = admin_user.get("email", "desconocido")
                    else:
                        print("Índice fuera de rango")
                        return
                except ValueError:
                    print("Entrada inválida")
                    return
            
            user_id = admin_user.get("id")
            if not user_id:
                print("Error: No se pudo obtener el ID del usuario")
                return
                
            print(f"Usuario seleccionado: {admin_email} (ID: {user_id})")
            
            # Actualizar los metadatos del usuario para incluir el rol admin
            update_url = f"{supabase_url}/auth/v1/admin/users/{user_id}"
            user_data = {
                "app_metadata": {"role": "admin"},
                "user_metadata": {"role": "admin"}
            }
            
            print(f"Actualizando metadatos para el usuario {admin_email}...")
            update_response = await client.put(
                update_url, 
                headers=headers, 
                json=user_data
            )
            
            if update_response.status_code == 200:
                response_data = update_response.json()
                print(f"✅ Rol actualizado correctamente para {admin_email}")
                if "user_metadata" in response_data:
                    print(f"Nuevos metadatos: {response_data['user_metadata']}")
                else:
                    print(f"Respuesta completa: {json.dumps(response_data, indent=2)}")
            else:
                print(f"❌ Error al actualizar el rol: {update_response.status_code}")
                print(update_response.text)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(update_admin_role()) 