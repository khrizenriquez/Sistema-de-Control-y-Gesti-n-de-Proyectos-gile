#!/usr/bin/env python3
import psycopg2
import os
from dotenv import load_dotenv
import sys

# Add the app directory to the path so we can import from it
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Load environment variables
load_dotenv()

# Set default database connection values
host = "localhost"  # Use localhost rather than container name
port = "5432"
user = "postgres"
password = "postgres"
db_name = "agile_db"

try:
    # Try to import settings from the app
    from app.core.config import settings
    database_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    
    # Override with environment variables if needed
    if os.environ.get("DB_HOST"):
        host = os.environ.get("DB_HOST")
    else:
        # Replace container name with localhost
        database_url = database_url.replace("db:", "localhost:")
    
    print(f"Using database URL: {database_url}")
    
    # Parse the connection string
    url_without_prefix = database_url.replace("postgresql://", "")
    
    if "@" in url_without_prefix:
        user_pass, host_port_db = url_without_prefix.split("@", 1)
        
        # User and password
        if ":" in user_pass:
            user, password = user_pass.split(":", 1)
        
        # Host, port and database
        if "/" in host_port_db:
            host_port, db_name = host_port_db.split("/", 1)
            
            # Host and port
            if ":" in host_port:
                host, port = host_port.split(":", 1)
            else:
                host = host_port
            
            # Database name
            if "?" in db_name:
                db_name = db_name.split("?", 1)[0]
except ImportError:
    print("Could not import settings, using default connection values")

try:
    # Connect to the database
    print(f"Connecting to database: {db_name} on {host}:{port} as {user}")
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=db_name,
        user=user,
        password=password
    )
    cur = conn.cursor()
    
    # 1. List all users
    print("\n=== ALL USERS ===")
    cur.execute("SELECT id, email, first_name, last_name, role, is_active FROM user_profiles ORDER BY role, email")
    users = cur.fetchall()
    for user in users:
        print(f"ID: {user[0]}, Email: {user[1]}, Name: {user[2]} {user[3]}, Role: {user[4]}, Active: {user[5]}")
    
    # 2. List all admins
    print("\n=== ALL ADMINS ===")
    cur.execute("SELECT id, email, first_name, last_name FROM user_profiles WHERE role = 'admin'")
    admins = cur.fetchall()
    for admin in admins:
        print(f"ID: {admin[0]}, Email: {admin[1]}, Name: {admin[2]} {admin[3]}")
    
    # 3. List users by admin (admin's created projects and their members)
    print("\n=== USERS BY ADMIN ===")
    cur.execute("""
        SELECT 
            a.id as admin_id, 
            a.email as admin_email, 
            u.id as user_id,
            u.email as user_email,
            u.role as user_role,
            p.name as project_name
        FROM user_profiles a
        JOIN projects p ON a.id = p.created_by
        JOIN project_members pm ON p.id = pm.project_id
        JOIN user_profiles u ON pm.user_id = u.id
        WHERE a.role = 'admin'
        ORDER BY a.email, p.name, u.email
    """)
    admin_users = cur.fetchall()
    
    current_admin = None
    for row in admin_users:
        admin_id, admin_email, user_id, user_email, user_role, project_name = row
        if current_admin != admin_email:
            print(f"\nAdmin: {admin_email} (ID: {admin_id})")
            current_admin = admin_email
        print(f"  - User: {user_email} (ID: {user_id}, Role: {user_role}, Project: {project_name})")
    
    # 4. List users for specific admin (admin@ingsistemas.gt)
    print("\n=== USERS FOR ADMIN@INGSISTEMAS.GT ===")
    cur.execute("""
        SELECT 
            a.id as admin_id, 
            a.email as admin_email, 
            u.id as user_id,
            u.email as user_email,
            u.role as user_role,
            u.first_name,
            u.last_name,
            p.name as project_name
        FROM user_profiles a
        JOIN projects p ON a.id = p.created_by
        JOIN project_members pm ON p.id = pm.project_id
        JOIN user_profiles u ON pm.user_id = u.id
        WHERE a.role = 'admin' AND a.email = 'admin@ingsistemas.gt'
        ORDER BY p.name, u.email
    """)
    specific_admin_users = cur.fetchall()
    
    if specific_admin_users:
        admin_id, admin_email = specific_admin_users[0][0], specific_admin_users[0][1]
        print(f"Admin: {admin_email} (ID: {admin_id})")
        for row in specific_admin_users:
            user_id, user_email, user_role = row[2], row[3], row[4]
            first_name, last_name = row[5], row[6]
            project_name = row[7]
            full_name = f"{first_name} {last_name}".strip()
            print(f"  - User: {user_email} ({full_name}, Role: {user_role}, Project: {project_name})")
    else:
        print("No users found for admin@ingsistemas.gt")
    
    # Close connection
    cur.close()
    conn.close()

except Exception as e:
    print(f"Error checking database: {e}") 