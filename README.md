# Proyecto: Sistema de Control y Gestión de Proyectos Ágiles con Integración de IA

Este repositorio contiene un monorepo que integra:
- **Preact + TailwindCSS** (Frontend)
- **FastAPI** (Backend)
- **Podman** para contenedores (o Docker como alternativa), haciendo énfasis en Podman

## Estructura del Repositorio

```
my-project/
├─ apps/
│  ├─ client/
│  │  ├─ src/
│  │  ├─ public/
│  │  ├─ Dockerfile (o Containerfile)
│  │  └─ ...
│  └─ server/
│     ├─ app/
│     ├─ Dockerfile (o Containerfile)
│     └─ ...
├─ infra/
│  ├─ podman/
│  │  ├─ docker-compose.yml
│  │  └─ ...
│  ├─ compose.sh
│  └─ ...
├─ packages/ (opcional)
├─ .gitignore
└─ README.md (este archivo)
```

- **apps/client**: Todo el código del Frontend (Preact + TailwindCSS).
- **apps/server**: Lógica y configuración de tu API con FastAPI.
- **infra/podman**: Archivos de composición y configuración para Podman (o Docker).
- **compose.sh**: Script auxiliar para levantar contenedores (intenta usar Podman primero, y si no, Docker).

## Requerimientos

1. **Node.js** (versión estable) para el frontend.
2. **Python 3.9+** para el backend con FastAPI.
3. **Podman** (o Docker) para los contenedores.
4. (Futuro) **PostgreSQL** si deseas persistencia en base de datos.

### Instalar Podman en Windows
1. **Descargar e instalar [Podman Desktop for Windows](https://podman.io/getting-started/installation)**.  
2. Verificar la instalación:
   ```bash
   podman --version
   podman system connection list
   podman machine list
   ```
3. Si no hay máquinas creadas o la máquina aparece “Stopped”, crea/inicia la VM:
   ```bash
   podman machine init
   podman machine start
   ```

### Instalar Podman en macOS
1. **Descargar e instalar [Podman Desktop for macOS](https://podman.io/getting-started/installation)**.
2. Verifica con:
   ```bash
   podman --version
   podman machine list
   ```
   - Si la máquina está en estado “Currently starting” o “Stopped”, debes iniciarla:
     ```bash
     podman machine start
     ```
   - Espera a que aparezca “Running” antes de continuar.

### Instalar Podman en Linux
1. Para **Ubuntu/Debian**:
   ```bash
   sudo apt-get update
   sudo apt-get install podman
   ```
2. Para **Fedora**:
   ```bash
   sudo dnf install podman
   ```
3. Para **Arch Linux**:
   ```bash
   sudo pacman -S podman
   ```
4. (Opcional) Instalar `podman-compose`:
   ```bash
   pip install podman-compose
   ```
   o con tu gestor de paquetes, si está disponible.

---

## Pasos de Instalación y Ejecución

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

# Modo desarrollo:
npm run dev

# Compilación de producción:
npm run build
```

### 3. Configurar el Backend

```bash
cd ../server
pip install -r requirements.txt

# Variables de entorno (ejemplo)
export DATABASE_URL=postgresql://usuario:password@localhost:5432/mi_database

# Arrancar FastAPI (desarrollo):
uvicorn app.main:app --reload
```

### 4. Verificar la Máquina de Podman (macOS/Windows)

Antes de levantar contenedores, **asegúrate de que tu VM de Podman está en “Running”**:

```bash
podman machine list
```
Si aparece en “Currently starting” o “Stopped”, haz:
```bash
podman machine stop    # si estuviera en un estado intermedio
podman machine start
```
Una vez veas “Running”, puedes continuar.

### 5. Levantar contenedores con el script

Regresa a la carpeta raíz (o a `infra/podman`, según dónde tengas el script) y ejecuta:

```bash
cd ../../infra
./compose.sh
```

El script `compose.sh` hará lo siguiente:
1. Verificar si existe `podman-compose`.
2. Si no, intentará `podman compose`.
3. Si no encuentra Podman, busca `docker-compose`.
4. Como última opción usa el plugin `docker compose`.

Esto construirá las imágenes para **frontend** y **backend** y levantará los contenedores. Por defecto, deberías poder acceder al **frontend** en `http://localhost:3000` y al **backend** en `http://localhost:8000` (ajusta si tus puertos son distintos).

---

## Contenido del Script (`compose.sh`)

```bash
#!/usr/bin/env bash

set -e  # Corta la ejecución si hay un error

# Ajusta la ruta de tu docker-compose.yml
COMPOSE_FILE="./infra/podman/docker-compose.yml"

if command -v podman-compose &> /dev/null
then
  echo "Usando podman-compose..."
  podman-compose -f "$COMPOSE_FILE" build
  podman-compose -f "$COMPOSE_FILE" up
elif command -v podman &> /dev/null
then
  echo "Usando podman (subcomando compose)..."
  podman compose -f "$COMPOSE_FILE" build
  podman compose -f "$COMPOSE_FILE" up
elif command -v docker-compose &> /dev/null
then
  echo "Usando docker-compose..."
  docker-compose -f "$COMPOSE_FILE" build
  docker-compose -f "$COMPOSE_FILE" up
elif command -v docker &> /dev/null
then
  # docker compose plugin (Docker 20.10+)
  echo "Usando docker compose plugin..."
  docker compose -f "$COMPOSE_FILE" build
  docker compose -f "$COMPOSE_FILE" up
else
  echo "Error: No se encontró ni podman-compose, ni podman, ni docker-compose, ni docker."
  echo "Por favor instala Docker o Podman para continuar."
  exit 1
fi
```

> **Importante**: Este script no arranca la VM de Podman. Tú mismo debes hacer `podman machine start` antes (si tu entorno lo requiere).

---

## Estructura de Código y Buenas Prácticas

- **Frontend (Preact + TailwindCSS)**:  
  - Separa la lógica de negocio (services, hooks) de la lógica de presentación (components, pages).

- **Backend (FastAPI)**:  
  - Organiza tu API en capas limpias: controladores/routers en `api/`, modelos en `models/` (o adaptadores si aplicas arquitectura hexagonal), esquemas de entrada/salida en `schemas/`, etc.

- **Tests**:  
  - En el backend, colócalos en la carpeta `tests`.  
  - En el frontend, podrías usar `__tests__` o `tests/` junto a los componentes, dependiendo de tu preferencia y framework de testing.

---

## Contribución

1. Crea una rama para tu feature o bug fix:
   ```bash
   git checkout -b feature/nueva-feature
   ```
2. Realiza tus cambios y asegúrate de que las pruebas pasen.
3. Haz push de tu rama y crea un Pull Request.

---

## Licencia
