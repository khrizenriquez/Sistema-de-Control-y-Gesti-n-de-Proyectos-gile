# Configuración para Windows

Este documento explica cómo configurar y ejecutar el entorno de desarrollo en Windows.

## Requisitos

1. Docker Desktop para Windows
   - Instalación: [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Asegúrate de que Docker esté en ejecución
   
2. Git para Windows (opcional, para clonar el repositorio)
   - Instalación: [Git for Windows](https://gitforwindows.org/)

## Opciones para ejecutar el entorno

Se proporcionan dos scripts para ejecutar el entorno en Windows:

1. **Script PowerShell** (recomendado):
   - `start-windows.ps1`
   - Funciona en PowerShell con colores y mayor robustez

2. **Script Batch**:
   - `start-windows.bat`
   - Compatible con el Símbolo del sistema (CMD) tradicional

## Uso

### Usando PowerShell (recomendado)

1. Abre PowerShell como administrador
2. Navega al directorio del proyecto
3. Ejecuta el script con los parámetros deseados:

```powershell
cd apps/server
.\start-windows.ps1
```

Con opciones:
```powershell
# Para modo desarrollo
.\start-windows.ps1 --dev

# Para reconstruir imágenes
.\start-windows.ps1 --build

# Para ambos
.\start-windows.ps1 --build --dev
```

### Usando CMD (alternativa)

1. Abre el Símbolo del sistema (CMD)
2. Navega al directorio del proyecto
3. Ejecuta el script batch:

```cmd
cd apps\server
start-windows.bat
```

Con opciones:
```cmd
start-windows.bat --dev
start-windows.bat --build
start-windows.bat --build --dev
```

## Archivos de configuración (.env)

Al ejecutar cualquiera de los scripts por primera vez, se generarán automáticamente los archivos de configuración en el directorio `.env_files`:

- `server.env`: Configuración para el servidor
- `client.env`: Configuración para el cliente

**Importante:** Debes editar estos archivos y agregar tus propias credenciales de Supabase y configuración antes de ejecutar la aplicación.

### Ejemplo de configuración de Supabase

En `server.env`:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-role-key
```

En `client.env`:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## Solución de problemas comunes

### Error: No se puede ejecutar scripts PowerShell

Si recibes un error sobre políticas de ejecución al ejecutar el script PowerShell, ejecuta PowerShell como administrador y usa:

```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

Luego intenta ejecutar el script nuevamente.

### Error con rutas de montaje en Docker

Si obtienes errores relacionados con montaje de volúmenes como:
```
Error: invalid container path "\\Program Files\\Git\\app\\.env"
```

Es probable que estés usando Git Bash. En su lugar:
- Usa PowerShell o CMD para ejecutar los scripts
- O ejecuta Git Bash como administrador y usa el script PowerShell

### Los contenedores no se inician correctamente

1. Detén y elimina los contenedores existentes:
```
docker stop client server db
docker rm client server db
```

2. Verifica que los puertos 3000, 5432 y 8000 no estén en uso por otras aplicaciones

3. Intenta reconstruir las imágenes con la opción `--build` 