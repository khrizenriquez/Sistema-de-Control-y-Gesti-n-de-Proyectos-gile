#!/usr/bin/env python
"""
Script para ejecutar migraciones de Alembic manualmente.
"""
import os
import sys
import subprocess
import argparse

# Asegurar que estamos en el directorio correcto
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(ROOT_DIR)

def run_migrations(args):
    """Ejecutar migraciones según los argumentos proporcionados"""
    
    if args.create:
        # Crear nueva migración
        cmd = ["alembic", "revision", "--autogenerate", "-m", args.create]
        print(f"Creando nueva migración: {args.create}")
    elif args.downgrade:
        # Downgrade a versión específica o número de pasos
        if args.downgrade.isdigit() and args.downgrade.startswith("-"):
            # Es un número de pasos
            cmd = ["alembic", "downgrade", args.downgrade]
            print(f"Bajando {args.downgrade[1:]} versiones")
        else:
            # Es un identificador específico
            cmd = ["alembic", "downgrade", args.downgrade]
            print(f"Bajando a versión: {args.downgrade}")
    elif args.history:
        # Mostrar historial de migraciones
        cmd = ["alembic", "history"]
        print("Mostrando historial de migraciones:")
    elif args.current:
        # Mostrar versión actual
        cmd = ["alembic", "current"]
        print("Versión actual de la base de datos:")
    else:
        # Por defecto, actualizar a la última versión
        cmd = ["alembic", "upgrade", "head"]
        print("Actualizando a la última versión")
    
    try:
        subprocess.run(cmd, check=True)
        print("Comando ejecutado exitosamente")
    except subprocess.CalledProcessError as e:
        print(f"Error ejecutando el comando: {e}")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ejecutar migraciones de Alembic")
    
    # Argumentos mutuamente excluyentes
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--create", "-c", help="Crear nueva migración con mensaje")
    group.add_argument("--downgrade", "-d", help="Bajar a versión específica o número de pasos (-1, -2, etc)")
    group.add_argument("--history", "-H", action="store_true", help="Mostrar historial de migraciones")
    group.add_argument("--current", action="store_true", help="Mostrar versión actual")
    
    args = parser.parse_args()
    run_migrations(args) 