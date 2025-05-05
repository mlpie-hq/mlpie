"""
Reset Alembic Migration State.

This script resets the alembic_version table, removing all migration history.
This allows for creating a fresh initial migration.
"""

import os
import sqlite3
from pathlib import Path

def reset_alembic_version():
    """Reset the alembic_version table in the database."""
    # Get database path from environment or use default
    db_path = os.environ.get("MLPIE_DB_PATH", "data/mlpie.db")
    
    # Get absolute path if relative
    if not os.path.isabs(db_path):
        root_dir = Path(__file__).parent
        db_path = os.path.join(root_dir, db_path)
    
    print(f"Using database at: {db_path}")
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}. Nothing to reset.")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if alembic_version table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='alembic_version';")
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            print("alembic_version table doesn't exist. No reset needed.")
            return True
        
        # Delete all rows from alembic_version
        cursor.execute("DELETE FROM alembic_version;")
        conn.commit()
        
        # Optionally drop other tables if you want a completely fresh start
        tables_to_drop = [
            "configurations", 
            "installed_plugins",
            "repository_state",
            "database_secrets",
            "projects"
        ]
        
        for table in tables_to_drop:
            try:
                cursor.execute(f"DROP TABLE IF EXISTS {table};")
            except sqlite3.Error as e:
                print(f"Error dropping table {table}: {e}")
        
        conn.commit()
        conn.close()
        
        print("Successfully reset alembic version and dropped existing tables.")
        return True
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return False

if __name__ == "__main__":
    reset_alembic_version() 