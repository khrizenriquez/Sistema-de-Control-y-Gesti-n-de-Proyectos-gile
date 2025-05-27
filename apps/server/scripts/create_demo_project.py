#!/usr/bin/env python3

"""
Script para crear un proyecto de demostración y asignar usuarios
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import os
import uuid
from datetime import datetime

# Configuración de la base de datos
db_config = {
    "host": os.environ.get("POSTGRES_HOST", "db"),
    "port": os.environ.get("POSTGRES_PORT", "5432"), 
    "database": os.environ.get("POSTGRES_DB", "agiledb"),
    "user": os.environ.get("POSTGRES_USER", "agileuser"),
    "password": os.environ.get("POSTGRES_PASSWORD", "agilepassword")
}

def create_demo_project():
    """Crea un proyecto de demostración y asigna miembros"""
    conn = None
    
    try:
        # Conectar a la base de datos
        print(f"Conectando a PostgreSQL: {db_config['host']}:{db_config['port']}/{db_config['database']}")
        conn = psycopg2.connect(
            host=db_config["host"],
            port=db_config["port"],
            database=db_config["database"],
            user=db_config["user"],
            password=db_config["password"]
        )
        
        # Crear transacción
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Verificar si ya existen proyectos
        cursor.execute("SELECT COUNT(*) as count FROM projects")
        project_count = cursor.fetchone()['count']
        
        if project_count > 0:
            print(f"Ya existen {project_count} proyectos en la base de datos. No se creará ningún proyecto de demostración.")
            conn.close()
            return
        
        # Obtener usuario admin
        cursor.execute("SELECT id, email FROM user_profiles WHERE role = 'admin' LIMIT 1")
        admin = cursor.fetchone()
        
        if not admin:
            print("No se encontró un usuario administrador.")
            return
        
        admin_id = admin['id']
        admin_email = admin['email']
        
        # Obtener usuario product_owner
        cursor.execute("SELECT id, email FROM user_profiles WHERE role = 'product_owner' LIMIT 1")
        product_owner = cursor.fetchone()
        
        if not product_owner:
            print("No se encontró un usuario product_owner.")
            return
        
        po_id = product_owner['id']
        po_email = product_owner['email']
        
        # Obtener usuario developer
        cursor.execute("SELECT id, email FROM user_profiles WHERE role = 'developer' LIMIT 1")
        developer = cursor.fetchone()
        
        if not developer:
            print("No se encontró un usuario developer.")
            return
        
        dev_id = developer['id']
        dev_email = developer['email']
        
        # Crear proyecto
        project_id = str(uuid.uuid4())
        now = datetime.now()
        
        cursor.execute("""
            INSERT INTO projects (id, name, description, created_at, updated_at, is_active, created_by, owner_id)
            VALUES (%s, %s, %s, %s, %s, true, %s, %s)
        """, (
            project_id,
            "Proyecto Demo",
            "Este es un proyecto de demostración para probar la aplicación",
            now,
            now,
            admin_id,
            admin_id
        ))
        
        print(f"Proyecto 'Proyecto Demo' creado por {admin_email} con ID: {project_id}")
        
        # Añadir el usuario product_owner al proyecto
        member_id1 = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO project_members (id, user_id, project_id, role, created_at, updated_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, true)
        """, (
            member_id1,
            po_id,
            project_id,
            "product_owner",
            now,
            now
        ))
        
        print(f"Usuario product_owner {po_email} añadido al proyecto con rol: product_owner")
        
        # Añadir el usuario developer al proyecto
        member_id2 = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO project_members (id, user_id, project_id, role, created_at, updated_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, true)
        """, (
            member_id2,
            dev_id,
            project_id,
            "developer",
            now,
            now
        ))
        
        print(f"Usuario developer {dev_email} añadido al proyecto con rol: developer")
        
        # Crear un segundo proyecto
        project_id2 = str(uuid.uuid4())
        
        cursor.execute("""
            INSERT INTO projects (id, name, description, created_at, updated_at, is_active, created_by, owner_id)
            VALUES (%s, %s, %s, %s, %s, true, %s, %s)
        """, (
            project_id2,
            "Proyecto Ágil",
            "Proyecto para desarrollo de metodologías ágiles",
            now,
            now,
            admin_id,
            admin_id
        ))
        
        print(f"Proyecto 'Proyecto Ágil' creado por {admin_email} con ID: {project_id2}")
        
        # Añadir el usuario product_owner al segundo proyecto
        member_id3 = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO project_members (id, user_id, project_id, role, created_at, updated_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, true)
        """, (
            member_id3,
            po_id,
            project_id2,
            "product_owner",
            now,
            now
        ))
        
        print(f"Usuario product_owner {po_email} añadido al segundo proyecto con rol: product_owner")
        
        # Confirmar transacción
        conn.commit()
        
        print("Proyectos de demostración creados correctamente.")
        
    except Exception as e:
        print(f"Error al crear proyectos de demostración: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    create_demo_project() 