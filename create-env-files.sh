#!/bin/bash

# Crear .env.example para el servidor
cat > apps/server/.env.example << 'EOL'
# Variables de la Base de Datos
POSTGRES_USER=agileuser
POSTGRES_PASSWORD=agilepassword
POSTGRES_DB=agiledb
DATABASE_URL=postgresql+asyncpg://agileuser:agilepassword@db:5432/agiledb

# Variables de pgAdmin
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=pgadminpwd

# Variables de Supabase (Reemplazar con tus propios valores)
SUPABASE_URL=https://your-project-url.supabase.co
SUPABASE_KEY=your_supabase_anon_key

# Variables del Servidor
SECRET_KEY=temporary_secret_key_change_this_in_production
LOAD_TEST_DATA=true
EOL

# Crear .env para el servidor con los mismos valores excepto Supabase
cat > apps/server/.env << 'EOL'
# Variables de la Base de Datos
POSTGRES_USER=agileuser
POSTGRES_PASSWORD=agilepassword
POSTGRES_DB=agiledb
DATABASE_URL=postgresql+asyncpg://agileuser:agilepassword@db:5432/agiledb

# Variables de pgAdmin
PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=pgadminpwd

# Variables de Supabase (Reemplazar con tus propios valores)
SUPABASE_URL=
SUPABASE_KEY=

# Variables del Servidor
SECRET_KEY=temporary_secret_key_change_this_in_production
LOAD_TEST_DATA=true
EOL

# Crear .env.example para el cliente
cat > apps/client/.env.example << 'EOL'
# Variables del Cliente
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:8000
EOL

# Crear .env para el cliente
cat > apps/client/.env << 'EOL'
# Variables del Cliente
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=http://localhost:8000
EOL

echo "Archivos .env y .env.example creados en apps/server/ y apps/client/"

# Verificar que .env está en .gitignore
if ! grep -q "^\.env$" .gitignore 2>/dev/null; then
  echo "Añadiendo .env a .gitignore"
  echo ".env" >> .gitignore
fi

if ! grep -q "^\.env$" apps/server/.gitignore 2>/dev/null; then
  echo "Añadiendo .env a apps/server/.gitignore"
  echo ".env" >> apps/server/.gitignore
fi

if ! grep -q "^\.env$" apps/client/.gitignore 2>/dev/null; then
  echo "Añadiendo .env a apps/client/.gitignore"
  echo ".env" >> apps/client/.gitignore
fi

echo "Configuración completada. Los archivos .env NO serán subidos al repositorio." 