# Proyecto: Sistema de Control y Gestión de Proyectos Ágiles con Integración de IA

Este repositorio contiene un monorepo que integra:
- **Preact + TailwindCSS** (frontend)
- **FastAPI + PostgreSQL** (backend)
- Opcionalmente, herramientas de infraestructura (Docker/Podman, scripts de CI/CD, etc.)

## Estructura del Repositorio

```
my-project/
├─ apps/
│  ├─ client/
│  │  ├─ src/
│  │  │  ├─ components/
│  │  │  ├─ pages/
│  │  │  ├─ hooks/
│  │  │  ├─ services/
│  │  │  └─ main.tsx
│  │  ├─ public/
│  │  ├─ index.html
│  │  ├─ package.json
│  │  └─ tailwind.config.js
│  └─ server/
│     ├─ app/
│     │  ├─ api/            (routers/controladores)
│     │  ├─ core/           (config, middlewares, utils)
│     │  ├─ db/             (conexión a la DB)
│     │  ├─ models/         (modelos ORM)
│     │  ├─ schemas/        (schemas de Pydantic)
│     │  ├─ services/       (lógica de negocio)
│     │  └─ main.py
│     ├─ tests/
│     ├─ requirements.txt
│     └─ ...
├─ packages/                (opcional; librerías/funciones compartidas)
├─ infra/                   (opcional; scripts de despliegue, CI/CD, etc.)
├─ .gitignore
└─ README.md (este archivo)
```

- **apps/client**: Todo el código del frontend (Preact + TailwindCSS).
- **apps/server**: Lógica y configuración de tu API con FastAPI.
- **packages**: (Opcional) Para librerías o utilidades comunes compartidas entre cliente y servidor.
- **infra**: (Opcional) Scripts y configuraciones de infraestructura (docker-compose, CI/CD, etc.).

## Requerimientos

- Node.js (versión estable recomendada) para el entorno frontend.
- Python 3.9+ para el backend con FastAPI.
- PostgreSQL (versión estable recomendada) para la base de datos.
- (Opcional) Docker o Podman, si vas a contenedizar la aplicación.

## Instalación y Ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/khrizenriquez/Sistema-de-Control-y-Gesti-n-de-Proyectos-gile.git
cd Sistema-de-Control-y-Gesti-n-de-Proyectos-gile
```

### 2. Configurar el Frontend

```bash
cd apps/client
npm install
# o yarn install

# Para desarrollo:
npm run dev

# Para compilación de producción:
npm run build
```

### 3. Configurar el Backend

```bash
cd ../server
# Instalar dependencias con pip
pip install -r requirements.txt

# Ajustar variables de entorno (ejemplo)
export DATABASE_URL=postgresql://user:password@localhost:5432/mi_database

# Ejecutar la aplicación
uvicorn app.main:app --reload
```

> Asegúrate de tener tu instancia de PostgreSQL lista y configurada. Puedes crear la base de datos y usuarios antes de iniciar la aplicación.

### 4. Opcional: Uso de Docker/Podman

Si deseas levantar todo con contenedores, revisa el archivo `docker-compose.yml` (en `infra/` si lo tienes). Ejemplo básico:

```bash
docker-compose up --build
```

Esto debería:
- Construir la imagen del backend (FastAPI).
- Construir la imagen del frontend (Preact).
- Levantar un contenedor de PostgreSQL.
- Correr todo en un mismo entorno.

## Estructura de Código y Buenas Prácticas

- **Front**: Separa la lógica de negocio (services, hooks) de la lógica de presentación (components, pages).  
- **Back**: Aplica organización en capas (routers en `api/`, lógica de negocio en `services/`, modelos en `models/`, etc.).  
- **Tests**: Los tests unitarios e integración residen en la carpeta `tests` del backend. En el frontend, puedes crear `__tests__/` o `tests/` junto a los componentes o en una carpeta global.

## Contribución

1. Crea una rama para tu feature o bug fix (`git checkout -b feature/nueva-feature`).
2. Realiza tus cambios y asegúrate de que las pruebas pasen.
3. Haz push de tu rama y crea un Pull Request.

## Licencia

