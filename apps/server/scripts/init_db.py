#!/usr/bin/env python3

"""
Script to properly initialize the database with all needed tables.
This script will ensure all tables exist and will not overwrite existing data.
"""

import os
import logging
import psycopg2
import uuid
from datetime import datetime
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
db_config = {
    "host": os.environ.get("POSTGRES_HOST", "db"),
    "port": os.environ.get("POSTGRES_PORT", "5432"),
    "database": os.environ.get("POSTGRES_DB", "agiledb"),
    "user": os.environ.get("POSTGRES_USER", "agileuser"),
    "password": os.environ.get("POSTGRES_PASSWORD", "agilepassword")
}

# Extract DATABASE_URL if available
if "DATABASE_URL" in os.environ:
    database_url = os.environ["DATABASE_URL"]
    url_without_prefix = database_url.replace("postgresql+asyncpg://", "")
    
    user_pass, host_port_db = url_without_prefix.split("@", 1)
    
    if ":" in user_pass:
        user, password = user_pass.split(":", 1)
        db_config["user"] = user
        db_config["password"] = password
    
    host_port, db_name = host_port_db.split("/", 1)
    
    if ":" in host_port:
        host, port = host_port.split(":", 1)
        db_config["host"] = host
        db_config["port"] = port
    else:
        db_config["host"] = host_port
    
    if "?" in db_name:
        db_name = db_name.split("?", 1)[0]
    
    db_config["database"] = db_name

def wait_for_db():
    """Wait for the database to be available"""
    max_retries = 30
    retry_interval = 2
    
    for i in range(max_retries):
        try:
            conn = psycopg2.connect(**db_config)
            conn.close()
            logger.info("Database is available")
            return True
        except psycopg2.OperationalError:
            logger.info(f"Waiting for database... ({i+1}/{max_retries})")
            import time
            time.sleep(retry_interval)
    
    logger.error("Could not connect to the database after multiple retries")
    return False

def check_if_table_exists(cursor, table_name):
    """Check if a table exists in the database"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = %s
        );
    """, (table_name,))
    return cursor.fetchone()[0]

def initialize_database():
    """Create all necessary tables if they don't exist"""
    if not wait_for_db():
        return False
    
    conn = None
    try:
        # Connect to the database
        conn = psycopg2.connect(**db_config)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check for critical tables
        tables_exist = check_if_table_exists(cursor, 'user_profiles') and \
                      check_if_table_exists(cursor, 'projects') and \
                      check_if_table_exists(cursor, 'project_members')
        
        if tables_exist:
            logger.info("Database tables already exist - skipping initialization")
            return True
        
        # Create extension if it doesn't exist
        cursor.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')
        
        # Get the SQL scripts from app/database/create_tables.py
        logger.info("Creating database tables...")
        from app.database.create_tables import create_tables
        create_tables()
        
        logger.info("Database tables created successfully")
        
        # Now seed the database with basic data
        from app.database.seed import seed_data
        import asyncio
        asyncio.run(seed_data())
        
        logger.info("Database initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        return False
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    initialize_database() 