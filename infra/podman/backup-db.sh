#!/bin/bash

# Script to backup PostgreSQL database from Docker/Podman container

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Set variables
CONTAINER_NAME="db"
BACKUP_DIR="$SCRIPT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/agiledb_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Creating backup of PostgreSQL database..."
echo "Backup directory: $BACKUP_DIR"

# Run pg_dump inside the container and save the output to a file
podman exec -t $CONTAINER_NAME pg_dump -U agileuser --clean --create agiledb > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully. File saved to: $BACKUP_FILE"
    # Compress the backup file
    gzip "$BACKUP_FILE"
    echo "Backup compressed: $BACKUP_FILE.gz"
    ls -l "$BACKUP_DIR"
else
    echo "Backup failed!"
    exit 1
fi 