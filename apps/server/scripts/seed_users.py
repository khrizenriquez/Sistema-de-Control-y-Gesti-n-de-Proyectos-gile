#!/usr/bin/env python3

"""
Script para insertar usuarios de prueba directamente en la base de datos.
"""

import sys
import os
import uuid
from datetime import datetime
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Obtener configuración desde variables de entorno
db_config = {
    "host": os.environ.get("POSTGRES_HOST", "db"),
    "port": os.environ.get("POSTGRES_PORT", "5432"),
    "database": os.environ.get("POSTGRES_DB", "agiledb"),
    "user": os.environ.get("POSTGRES_USER", "agileuser"),
    "password": os.environ.get("POSTGRES_PASSWORD", "agilepassword")
}

# También se puede usar la variable DATABASE_URL completa si está disponible
if "DATABASE_URL" in os.environ:
    # Formato esperado: postgresql+asyncpg://user:password@host:port/dbname
    database_url = os.environ["DATABASE_URL"]
    
    # Extraer los componentes del DATABASE_URL
    # Reemplazamos el prefijo postgresql+asyncpg:// por nada para procesarlo
    url_without_prefix = database_url.replace("postgresql+asyncpg://", "")
    
    # Extraer usuario y contraseña (antes de @)
    user_pass, host_port_db = url_without_prefix.split("@", 1)
    
    # Extraer usuario y contraseña
    if ":" in user_pass:
        user, password = user_pass.split(":", 1)
        db_config["user"] = user
        db_config["password"] = password
    
    # Extraer host, puerto y nombre de la base de datos
    host_port, db_name = host_port_db.split("/", 1)
    
    # Extraer host y puerto
    if ":" in host_port:
        host, port = host_port.split(":", 1)
        db_config["host"] = host
        db_config["port"] = port
    else:
        db_config["host"] = host_port
    
    # Extraer nombre de la base de datos (eliminar cualquier parámetro adicional)
    if "?" in db_name:
        db_name = db_name.split("?", 1)[0]
    
    db_config["database"] = db_name

def create_test_users():
    """Crear usuarios de prueba con diferentes roles"""
    
    # Generar IDs únicos
    admin_id = str(uuid.uuid4())
    developer_id = str(uuid.uuid4())
    product_owner_id = str(uuid.uuid4())
    member_id = str(uuid.uuid4())
    
    # Crear proyecto demo
    project_id = str(uuid.uuid4())
    
    # Timestamp actual para created_at y updated_at
    now = datetime.utcnow()
    
    conn = None
    try:
        # Conectar a la base de datos
        conn = psycopg2.connect(**db_config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = conn.cursor()
        
        # Verificar si ya existen usuarios
        cur.execute("SELECT COUNT(*) FROM user_profiles")
        user_count = cur.fetchone()[0]
        
        if user_count > 0:
            print("Ya existen usuarios en la base de datos. No se crearán nuevos usuarios.")
            return
        
        # Insertar usuarios
        users = [
            (admin_id, "supabase-auth-id-1", "Admin", "Usuario", "admin@ingsistemas.gt", "admin", now, now),
            (developer_id, "supabase-auth-id-2", "Desarrollador", "Ejemplo", "dev@ingsistemas.gt", "developer", now, now),
            (product_owner_id, "supabase-auth-id-3", "Project", "Manager", "pm@ingsistemas.gt", "product_owner", now, now),
            (member_id, "supabase-auth-id-4", "Miembro", "Regular", "member@ingsistemas.gt", "member", now, now)
        ]
        
        cur.executemany(
            "INSERT INTO user_profiles (id, auth_id, first_name, last_name, email, role, created_at, updated_at) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            users
        )
        
        # Insertar proyecto demo
        cur.execute(
            "INSERT INTO projects (id, name, description, owner_id, created_at, updated_at) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (project_id, "Proyecto Demo", "Un proyecto de demostración", admin_id, now, now)
        )
        
        # Insertar miembros del proyecto con diferentes roles
        project_members = [
            (project_id, admin_id, "admin"),
            (project_id, developer_id, "developer"),
            (project_id, product_owner_id, "product_owner"),
            (project_id, member_id, "member")
        ]
        
        cur.executemany(
            "INSERT INTO project_members (project_id, user_id, role) VALUES (%s, %s, %s)",
            project_members
        )
        
        # Crear tres historias de usuario básicas
        for i, title in enumerate([
            "Como usuario quiero iniciar sesión",
            "Como admin quiero gestionar usuarios",
            "Como usuario quiero ver mi tablero"
        ], 1):
            story_id = str(uuid.uuid4())
            cur.execute(
                "INSERT INTO user_stories (id, title, description, project_id, status, priority, story_points, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (
                    story_id,
                    title,
                    f"Descripción de {title}",
                    project_id,
                    "backlog",
                    i,
                    i + 1,
                    now,
                    now
                )
            )
        
        # Commit y cerrar
        conn.commit()
        print("Usuarios de prueba creados exitosamente:")
        print("- Admin (admin@ingsistemas.gt, rol: admin)")
        print("- Desarrollador (dev@ingsistemas.gt, rol: developer)")
        print("- Product Owner (pm@ingsistemas.gt, rol: product_owner)")
        print("- Miembro (member@ingsistemas.gt, rol: member)")
        
    except Exception as e:
        print(f"Error al crear usuarios de prueba: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_test_users() 