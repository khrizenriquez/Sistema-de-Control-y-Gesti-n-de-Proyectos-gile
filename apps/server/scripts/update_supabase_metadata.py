#!/usr/bin/env python3

"""
Script para actualizar los metadatos de roles en Supabase Auth
"""

import os
import asyncio
import psycopg2
from psycopg2.extras import RealDictCursor
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Importar la función de actualización de metadatos de manera segura
try:
    from app.core.supabase import update_user_metadata
    logger.info("Módulo de Supabase importado correctamente")
except ImportError as e:
    logger.error(f"Error importando módulo Supabase: {e}")
    update_user_metadata = None

async def update_user_roles_in_supabase():
    """Actualiza los roles de usuarios en Supabase Auth basado en los roles de la base de datos"""
    logger.info("Iniciando actualización de roles en Supabase Auth metadata...")
    
    # Verificar que la función de actualización esté disponible
    if update_user_metadata is None:
        logger.error("No se pudo importar la función update_user_metadata. Abortando.")
        return
    
    # Obtener configuración desde variables de entorno
    db_config = {
        "host": os.environ.get("POSTGRES_HOST", "db"),
        "port": os.environ.get("POSTGRES_PORT", "5432"), 
        "database": os.environ.get("POSTGRES_DB", "agiledb"),
        "user": os.environ.get("POSTGRES_USER", "agileuser"),
        "password": os.environ.get("POSTGRES_PASSWORD", "agilepassword")
    }
    
    # Verificar variables de Supabase
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.error("Variables SUPABASE_URL y/o SUPABASE_KEY no definidas. Omitiendo actualización de metadatos.")
        return
    
    logger.info(f"Usando Supabase URL: {supabase_url[:10]}...")
    
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
                
            logger.info(f"Se encontraron {len(users)} usuarios para actualizar")
        
        # Actualizar los metadatos en Supabase Auth
        for user in users:
            if user['auth_id'] and user['role']:
                logger.info(f"Actualizando rol de {user['email']} a {user['role']} en Supabase Auth...")
                try:
                    result = await update_user_metadata(user['auth_id'], {"role": user['role']})
                    if result:
                        logger.info(f"✅ Rol actualizado correctamente para {user['email']}")
                    else:
                        logger.error(f"❌ Error al actualizar rol para {user['email']}")
                except Exception as e:
                    logger.error(f"❌ Excepción al actualizar {user['email']}: {str(e)}")
        
        logger.info("Actualización de roles en Supabase Auth completada")
    except Exception as e:
        logger.error(f"Error al actualizar roles en Supabase Auth: {str(e)}")
    finally:
        if conn:
            conn.close()

# Ejecutar la función asíncrona
if __name__ == "__main__":
    # Verificar variables de entorno necesarias para Supabase
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_KEY"):
        logger.error("Variables SUPABASE_URL y/o SUPABASE_KEY no definidas. Omitiendo actualización de metadatos.")
        exit(0)
    
    try:
        asyncio.run(update_user_roles_in_supabase())
    except Exception as e:
        logger.error(f"Error ejecutando actualización de metadatos: {str(e)}")
        exit(1) 