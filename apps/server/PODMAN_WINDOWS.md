# Guía para ejecutar el proyecto con Podman en Windows

Este documento explica cómo ejecutar el sistema utilizando Podman en Windows.

## Requisitos

1. **Podman para Windows**
   - Instala Podman Machine desde: [Podman Desktop](https://podman-desktop.io/downloads)
   - Asegúrate de que Podman esté iniciado y funcionando

2. **PowerShell** (viene instalado con Windows)

## Pasos para ejecutar la aplicación

1. **Abre PowerShell como administrador**
   - Busca "PowerShell" en el menú inicio
   - Haz clic derecho y selecciona "Ejecutar como administrador"

2. **Habilita la ejecución de scripts**
   - Ejecuta este comando:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```

3. **Navega al directorio del proyecto**
   ```powershell
   cd C:\ruta\al\proyecto\Sistema-de-Control-y-Gesti-n-de-Proyectos-gile\apps\server
   ```

4. **Ejecuta el script corregido**
   ```powershell
   .\start-windows-podman-fix.ps1 --build
   ```

   - La primera vez, usa la opción `--build` para construir las imágenes
   - En ejecuciones posteriores, puedes omitir `--build` para iniciar más rápido

5. **Configura los archivos .env**
   - El script creará automáticamente archivos de configuración en `.env_files/`
   - Edita los archivos con tus credenciales de Supabase:
     - `.env_files/server.env`
     - `.env_files/client.env`

## Solución de problemas comunes

### Si ves errores relacionados con contenedores que ya existen

Ejecuta:
```powershell
podman stop db server client
podman rm db server client
```

### Si el cliente no se construye correctamente

El script incluye un Dockerfile especial que ignora errores de TypeScript. Si aun así tienes problemas:

1. Edita los archivos TypeScript mencionados en el error para corregir las advertencias
2. O modifica el archivo `tsconfig.json` para ser menos estricto:
   ```json
   "noUnusedLocals": false,
   "noUnusedParameters": false
   ```

### Si hay problemas con rutas de montaje

Asegúrate de ejecutar el script desde la carpeta `apps/server` exactamente. El script usa rutas relativas para encontrar los directorios del cliente y otros recursos.

## Comandos útiles

### Ver contenedores en ejecución
```powershell
podman ps
```

### Ver logs de un contenedor
```powershell
podman logs servidor
podman logs cliente
podman logs db
```

### Detener todos los contenedores
```powershell
podman stop client server db
```

### Eliminar todos los contenedores
```powershell
podman rm client server db
``` 