#!/usr/bin/env python3

"""
Script para sincronizar los roles de usuarios entre la base de datos local y Supabase Auth.
Este script actualiza los metadatos de usuario en Supabase para asegurar 
que los roles sean consistentes con la base de datos.
"""

import os
import asyncio
import psycopg2
from psycopg2.extras import RealDictCursor
import httpx
import json
import logging

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuración de la base de datos
db_config = {
    "host": os.environ.get("POSTGRES_HOST", "db"),
    "port": os.environ.get("POSTGRES_PORT", "5432"), 
    "database": os.environ.get("POSTGRES_DB", "agiledb"),
    "user": os.environ.get("POSTGRES_USER", "agileuser"),
    "password": os.environ.get("POSTGRES_PASSWORD", "agilepassword")
}

# Configuración de Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

async def update_user_metadata(user_id, metadata):
    """Actualiza los metadatos de un usuario en Supabase Auth"""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        logger.error("Variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY no configuradas")
        return False
    
    url = f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.put(
                url,
                headers=headers,
                json={"user_metadata": metadata}
            )
            
            if response.status_code in (200, 201):
                logger.info(f"Metadatos actualizados correctamente para usuario ID: {user_id}")
                return True
            else:
                logger.error(f"Error al actualizar metadatos. Status: {response.status_code}, Response: {response.text}")
                return False
    except Exception as e:
        logger.error(f"Excepción al actualizar metadatos: {str(e)}")
        return False

async def sync_roles():
    """Sincroniza los roles de usuarios entre la base de datos local y Supabase Auth"""
    conn = None
    
    try:
        # Conectar a la base de datos
        logger.info(f"Conectando a PostgreSQL: {db_config['host']}:{db_config['port']}/{db_config['database']}")
        conn = psycopg2.connect(
            host=db_config["host"],
            port=db_config["port"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"]
        )
        
        # Obtener todos los usuarios con sus roles
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT auth_id, email, role FROM user_profiles WHERE auth_id IS NOT NULL AND auth_id != ''")
            users = cursor.fetchall()
            
            if not users:
                logger.warning("No se encontraron usuarios con auth_id válido en la base de datos")
                return
                
            logger.info(f"Se encontraron {len(users)} usuarios para sincronizar")
            
            for user in users:
                if user['auth_id'] and user['role']:
                    logger.info(f"Sincronizando rol de {user['email']} a {user['role']} en Supabase Auth...")
                    try:
                        # Obtenemos los metadatos actuales si es necesario
                        # Actualizamos el rol
                        result = await update_user_metadata(user['auth_id'], {"role": user['role']})
                        if result:
                            logger.info(f"✅ Rol sincronizado correctamente para {user['email']}")
                        else:
                            logger.error(f"❌ Error al sincronizar rol para {user['email']}")
                    except Exception as e:
                        logger.error(f"❌ Excepción al sincronizar {user['email']}: {str(e)}")
        
        logger.info("Sincronización de roles completada")
    except Exception as e:
        logger.error(f"Error durante la sincronización: {str(e)}")
    finally:
        if conn:
            conn.close()

async def main():
    """Función principal"""
    logger.info("Iniciando sincronización de roles entre base de datos local y Supabase Auth...")
    await sync_roles()
    logger.info("Proceso completado")

if __name__ == "__main__":
    asyncio.run(main()) 