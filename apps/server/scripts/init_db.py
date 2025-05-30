#!/usr/bin/env python3

"""
Script to properly initialize the database with all needed tables.
This script will ensure all tables exist and will not overwrite existing data.
"""

import os
import logging
import uuid
import time
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database configuration
def get_sync_database_url():
    """Get synchronous database URL"""
    database_url = os.environ.get("DATABASE_URL", "postgresql+asyncpg://agileuser:agilepassword@db:5432/agiledb")
    # Convert async URL to sync URL for this script
    return database_url.replace("postgresql+asyncpg://", "postgresql://")

def wait_for_db():
    """Wait for the database to be available"""
    max_retries = 30
    retry_interval = 2
    sync_url = get_sync_database_url()
    
    for i in range(max_retries):
        try:
            engine = create_engine(sync_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database is available")
            return True
        except OperationalError:
            logger.info(f"Waiting for database... ({i+1}/{max_retries})")
            time.sleep(retry_interval)
    
    logger.error("Could not connect to the database after multiple retries")
    return False

def check_if_table_exists(engine, table_name):
    """Check if a table exists in the database"""
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = :table_name
            );
        """), {"table_name": table_name})
        return result.fetchone()[0]

def initialize_database():
    """Create all necessary tables if they don't exist"""
    if not wait_for_db():
        return False
    
    try:
        # Connect to the database
        sync_url = get_sync_database_url()
        engine = create_engine(sync_url)
        
        # Check for critical tables
        tables_exist = (check_if_table_exists(engine, 'user_profiles') and 
                       check_if_table_exists(engine, 'projects') and 
                       check_if_table_exists(engine, 'project_members'))
        
        if tables_exist:
            logger.info("Database tables already exist - skipping initialization")
            return True
        
        # Create extension if it doesn't exist
        with engine.connect() as conn:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
            conn.commit()
        
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

if __name__ == "__main__":
    initialize_database() 