# 🚀 Guía de Despliegue en Producción - Digital Ocean

Esta guía te ayudará a desplegar tu sistema de gestión de proyectos ágiles en Digital Ocean con máxima estabilidad y disponibilidad.

## 🔧 Problema Identificado y Solución

### ❌ **Problema Original**
Los contenedores se caían después de 4-5 horas y **NO se reiniciaban automáticamente** porque faltaban las políticas de reinicio (`--restart=unless-stopped`).

### ✅ **Solución Implementada**
1. **Políticas de reinicio automático** en todos los contenedores
2. **Límites de recursos** para evitar consumo excesivo
3. **Verificaciones de salud** con reintentos automáticos
4. **Monitoreo proactivo** con scripts de verificación
5. **Configuración optimizada** para producción

## 📋 Scripts Disponibles

### 1. `start-environment.sh` (Mejorado)
- ✅ **Políticas de reinicio añadidas** (`--restart=unless-stopped`)
- ✅ **Tiempos de espera aumentados** para mayor estabilidad
- ✅ **Mejor manejo de errores**

### 2. `start-production.sh` (Nuevo - Recomendado para Digital Ocean)
- ✅ **Optimizado específicamente para producción**
- ✅ **Límites de recursos** (memoria, CPU)
- ✅ **Verificaciones de salud** con reintentos
- ✅ **Monitoreo automático**
- ✅ **Configuración de PostgreSQL optimizada**

### 3. `health-check.sh` (Nuevo)
- ✅ **Verificación automática de servicios**
- ✅ **Reinicio automático de contenedores caídos**
- ✅ **Monitoreo de recursos del sistema**
- ✅ **Logging detallado**

## 🚀 Despliegue en Digital Ocean

### Paso 1: Preparar el Servidor

```bash
# Conectar al servidor Digital Ocean
ssh root@161.35.97.194

# Navegar al directorio del proyecto
cd /path/to/Sistema-de-Control-y-Gesti-n-de-Proyectos-gile

# Hacer scripts ejecutables
chmod +x start-production.sh health-check.sh
```

### Paso 2: Detener Servicios Actuales

```bash
# Detener contenedores existentes
podman stop $(podman ps -q) 2>/dev/null || true
podman rm $(podman ps -aq) 2>/dev/null || true
```

### Paso 3: Desplegar con el Script de Producción

```bash
# Opción 1: Despliegue completo (reconstruir imágenes)
./start-production.sh --build

# Opción 2: Despliegue rápido (usar imágenes existentes)
./start-production.sh

# Opción 3: Reiniciar base de datos (¡CUIDADO! Elimina datos)
./start-production.sh --build --reset-db
```

### Paso 4: Verificar el Despliegue

```bash
# Verificar que todos los contenedores están corriendo
podman ps

# Verificar logs de cada servicio
podman logs server
podman logs client
podman logs db

# Ejecutar verificación de salud
./health-check.sh
```

## 🔍 Monitoreo Continuo

### Configurar Monitoreo Automático

```bash
# Crear directorio para logs
sudo mkdir -p /var/log

# Añadir al crontab para verificación cada 5 minutos
crontab -e

# Añadir esta línea:
*/5 * * * * /path/to/health-check.sh --quiet >> /var/log/container_monitor.log 2>&1
```

### Comandos de Monitoreo Manual

```bash
# Ver estado en tiempo real
watch -n 5 'podman ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"'

# Ver uso de recursos
podman stats

# Ver logs en tiempo real
podman logs -f server
podman logs -f client

# Verificación completa de salud
./health-check.sh
```

## 🛠️ Solución de Problemas

### Si un Contenedor se Cae

```bash
# Verificar estado
podman ps -a

# Ver logs del contenedor problemático
podman logs <container-name>

# Reiniciar manualmente
podman restart <container-name>

# Verificar salud del sistema
./health-check.sh
```

### Si el Sistema Completo Falla

```bash
# Reinicio completo con reconstrucción
./start-production.sh --build

# Si hay problemas de base de datos
./start-production.sh --build --reset-db
```

### Verificar Conectividad

```bash
# Verificar que los servicios responden
curl -I http://localhost:3000
curl -I http://localhost:8000/docs
curl -I http://localhost:5050

# Verificar desde IP pública
curl -I http://161.35.97.194:3000
curl -I http://161.35.97.194:8000/docs
```

## 📊 Configuración de Recursos

### Límites Configurados en `start-production.sh`

| Servicio | Memoria | CPU | Swap |
|----------|---------|-----|------|
| Base de Datos | 512MB | 1.0 | 1GB |
| Servidor Backend | 1GB | 1.5 | 2GB |
| Cliente Frontend | 512MB | 1.0 | 1GB |
| pgAdmin | 256MB | 0.5 | 512MB |

### Ajustar Recursos (si es necesario)

```bash
# Editar el script de producción
nano start-production.sh

# Buscar las líneas --memory y --cpus para ajustar
```

## 🔐 Seguridad y Configuración

### Variables de Entorno Importantes

```bash
# Configurar en el servidor
export DB_PASSWORD="tu_password_seguro"
export SUPABASE_URL="tu_supabase_url"
export SUPABASE_SERVICE_KEY="tu_supabase_key"
```

### Firewall (si es necesario)

```bash
# Abrir puertos necesarios
ufw allow 3000/tcp  # Frontend
ufw allow 8000/tcp  # Backend
ufw allow 5050/tcp  # pgAdmin (opcional)
```

## 📈 Mejoras Implementadas

### 1. **Políticas de Reinicio Automático**
```bash
--restart=unless-stopped
```
- Los contenedores se reinician automáticamente si fallan
- No se reinician si se detienen manualmente

### 2. **Límites de Recursos**
```bash
--memory=1g --memory-swap=2g --cpus=1.5
```
- Previene que un contenedor consuma todos los recursos
- Mejora la estabilidad general del sistema

### 3. **Verificaciones de Salud**
- Verificación de conectividad HTTP
- Verificación de base de datos con `pg_isready`
- Reintentos automáticos con timeouts

### 4. **Monitoreo Proactivo**
- Script de verificación cada 5 minutos
- Logs detallados en `/var/log/`
- Reinicio automático de servicios caídos

## 🎯 URLs de Acceso

Una vez desplegado, tu aplicación estará disponible en:

- **Frontend**: http://161.35.97.194:3000
- **Backend API**: http://161.35.97.194:8000
- **Documentación API**: http://161.35.97.194:8000/docs
- **pgAdmin**: http://161.35.97.194:5050

## 📞 Soporte y Mantenimiento

### Comandos de Mantenimiento Diario

```bash
# Verificación rápida
./health-check.sh

# Ver logs recientes
podman logs --tail 50 server
podman logs --tail 50 client

# Limpiar logs antiguos (opcional)
podman system prune -f
```

### Backup de Base de Datos

```bash
# Crear backup
podman exec db pg_dump -U agileuser agiledb > backup_$(date +%Y%m%d).sql

# Restaurar backup
podman exec -i db psql -U agileuser agiledb < backup_20241201.sql
```

## ✅ Checklist de Despliegue

- [ ] Scripts ejecutables (`chmod +x`)
- [ ] Variables de entorno configuradas
- [ ] Contenedores desplegados con `./start-production.sh --build`
- [ ] Verificación de salud exitosa (`./health-check.sh`)
- [ ] Monitoreo automático configurado (crontab)
- [ ] URLs públicas funcionando
- [ ] Backup de base de datos configurado

---

**¡Tu aplicación ahora debería mantenerse estable 24/7 en Digital Ocean!** 🎉

Si tienes problemas, revisa los logs con `podman logs <container-name>` y ejecuta `./health-check.sh` para diagnóstico automático. 