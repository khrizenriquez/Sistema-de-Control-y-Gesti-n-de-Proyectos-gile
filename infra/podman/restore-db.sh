#!/bin/bash

# Script to restore PostgreSQL database from a backup file

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set variables
CONTAINER_NAME="db"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Check if backup file provided
if [ -z "$1" ]; then
    echo "Please provide a backup file to restore from."
    echo "Usage: $0 <backup_file>"
    echo "Available backups:"
    ls -l "$BACKUP_DIR"
    exit 1
fi

# Handle both absolute paths and relative to backups dir
if [[ "$1" == /* ]]; then
    BACKUP_FILE="$1"
else
    BACKUP_FILE="$BACKUP_DIR/$1"
fi

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found."
    echo "Available backups:"
    ls -l "$BACKUP_DIR"
    exit 1
fi

# If file is compressed (.gz), decompress it
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

echo "Restoring database from backup: $BACKUP_FILE"

# Restore the database
podman exec -i $CONTAINER_NAME psql -U agileuser agiledb < "$BACKUP_FILE"

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "Database restore completed successfully."
else
    echo "Database restore failed!"
    exit 1
fi 