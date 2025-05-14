#!/usr/bin/env python3
"""
Script para corregir la tabla projects añadiendo la columna created_by
"""
from sqlalchemy import text
import sys
import os

# Agregar la ruta del proyecto para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    # Importar el motor de base de datos
    from apps.server.app.database.db import engine

    # Conectar a la base de datos y ejecutar la migración
    with engine.connect() as conn:
        # Verificar si la columna created_by existe
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='projects' AND column_name='created_by'"))
        if result.rowcount == 0:
            print("🔧 La columna 'created_by' no existe. Añadiéndola a la tabla 'projects'...")
            
            # Agregar la columna created_by a la tabla projects
            conn.execute(text("ALTER TABLE projects ADD COLUMN created_by UUID REFERENCES user_profiles(id)"))
            
            # Commit de la transacción
            conn.commit()
            print("✅ La columna 'created_by' ha sido añadida correctamente.")
        else:
            print("✅ La columna 'created_by' ya existe en la tabla 'projects'.")

except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("Asegúrate de ejecutar este script desde el directorio raíz del proyecto.")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error durante la migración: {e}")
    sys.exit(1) 