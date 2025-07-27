FROM python:3.14.0rc1-slim

# Establecer variables de entorno
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=off \
    PIP_DISABLE_PIP_VERSION_CHECK=on

# Instalar dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Crear usuario no-root
RUN adduser --disabled-password --gecos "" appuser

# Copiar el código fuente
COPY . .

# Crear script de inicialización
COPY ./scripts/start.sh /start.sh
RUN chmod +x /start.sh

# Asignar permisos al usuario appuser
RUN chown -R appuser:appuser /app
USER appuser

# Exponer el puerto 8000 (no privilegiado) en lugar de 80
EXPOSE 8000

# Comando para iniciar la aplicación
CMD ["/start.sh"]
