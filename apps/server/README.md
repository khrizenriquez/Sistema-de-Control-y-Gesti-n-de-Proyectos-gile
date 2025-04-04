# Sistema de Control y Gestión de Proyectos Ágiles - Backend

Backend desarrollado con FastAPI para el Sistema de Control y Gestión de Proyectos Ágiles.

## Requisitos

- Python 3.11+
- Pip

## Instalación

1. Clonar el repositorio
2. Crear un entorno virtual:
   ```
   python -m venv venv
   ```
3. Activar el entorno virtual:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Instalar dependencias:
   ```
   pip install -r requirements.txt
   ```
5. Copiar `.env.example` a `.env` y configurar las variables de entorno:
   ```
   cp .env.example .env
   ```

## Uso

### Ejecutar en desarrollo

```
uvicorn app.main:app --reload
```

La API estará disponible en http://localhost:8000

### Documentación

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Docker

Para ejecutar con Docker:

```
docker build -t server-app .
docker run -p 8000:8000 server-app
```

Para ejecutar con Podman:

```
podman build -t server-app .
podman run -p 8000:8000 server-app
```

## Estructura del Proyecto

```
app/
├── core/          # Configuraciones y utilidades core
├── database/      # Configuración de la base de datos
├── models/        # Modelos SQLAlchemy
├── routers/       # Endpoints de la API
├── schemas/       # Esquemas Pydantic
└── main.py        # Punto de entrada de la aplicación
``` 