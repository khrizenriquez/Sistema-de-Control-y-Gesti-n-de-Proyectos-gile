#!/usr/bin/env python3
import psycopg2
import os

# Database connection information
db_config = {
    "host": os.environ.get("POSTGRES_HOST", "localhost"),
    "port": os.environ.get("POSTGRES_PORT", "5432"),
    "database": os.environ.get("POSTGRES_DB", "agiledb"),
    "user": os.environ.get("POSTGRES_USER", "agileuser"),
    "password": os.environ.get("POSTGRES_PASSWORD", "agilepassword")
}

# Environment variables can override
if "DATABASE_URL" in os.environ:
    # Formato esperado: postgresql+asyncpg://user:password@host:port/dbname
    database_url = os.environ["DATABASE_URL"]
    
    # Extraer los componentes del DATABASE_URL
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
    
    # Extraer nombre de la base de datos
    if "?" in db_name:
        db_name = db_name.split("?", 1)[0]
    
    db_config["database"] = db_name

try:
    # Connect to the database
    print(f"Connecting to database: {db_config['database']} on {db_config['host']}:{db_config['port']} as {db_config['user']}")
    conn = psycopg2.connect(
        host=db_config["host"],
        port=db_config["port"],
        database=db_config["database"],
        user=db_config["user"],
        password=db_config["password"]
    )
    cur = conn.cursor()
    
    # Check user_profiles
    cur.execute("SELECT COUNT(*) FROM user_profiles")
    count = cur.fetchone()[0]
    print(f"Count of user_profiles: {count}")
    
    # Show all users
    if count > 0:
        cur.execute("SELECT id, email, first_name, last_name, role, is_active FROM user_profiles")
        users = cur.fetchall()
        print("\nUsers in database:")
        for user in users:
            print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[2]} {user[3]}, Role: {user[4]}, Active: {user[5]}")
    
    # Check projects table
    cur.execute("SELECT COUNT(*) FROM projects")
    count = cur.fetchone()[0]
    print(f"\nCount of projects: {count}")
    
    # Check project_members table
    cur.execute("SELECT COUNT(*) FROM project_members")
    count = cur.fetchone()[0]
    print(f"Count of project_members: {count}")
    
    # Close connection
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error checking database: {e}") 