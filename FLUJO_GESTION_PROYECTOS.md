# Flujo Completo de Gestión de Proyectos Ágiles

## 📋 Resumen del Sistema

El sistema incluye un **flujo completo de gestión del ciclo de vida de proyectos ágiles** que maneja:

- ✅ Tableros Scrum y Kanban
- ✅ Estados del proyecto con transiciones controladas
- ✅ Gestión avanzada de fechas y deadlines
- ✅ Métricas de progreso y salud del proyecto
- ✅ Hitos y seguimiento de entregas
- ✅ Cierre y archivado de proyectos
- ✅ Sistema de alertas y monitoreo

## 🔄 Estados del Proyecto y Transiciones

### Estados Disponibles

```
PLANNING → ACTIVE → COMPLETED/CANCELLED → ARCHIVED
           ↓           ↑
        ON_HOLD -------
```

| Estado | Descripción | Acciones Disponibles |
|--------|-------------|---------------------|
| **PLANNING** | Proyecto en planificación inicial | ➡️ Iniciar |
| **ACTIVE** | Proyecto activo en desarrollo | ⏸️ Pausar, ✅ Completar, ❌ Cancelar |
| **ON_HOLD** | Proyecto pausado temporalmente | ▶️ Reanudar, ❌ Cancelar |
| **COMPLETED** | Proyecto completado exitosamente | 📦 Archivar |
| **CANCELLED** | Proyecto cancelado | 📦 Archivar |
| **ARCHIVED** | Proyecto archivado | (Sin acciones) |

### Reglas de Negocio

1. **Solo admins y product_owners** pueden cambiar estados de proyecto
2. **Solo admins** pueden cancelar y archivar proyectos
3. **Cancelar requiere razón obligatoria** (aplicado por el sistema)
4. **No se puede completar con sprints activos** (validación automática)
5. **Solo proyectos completados/cancelados pueden archivarse**
6. **Los roles de proyecto sobrescriben roles globales** en contexto específico

### Gestión de Roles Duales

El sistema permite **roles diferentes por proyecto**, proporcionando flexibilidad organizacional:

#### Ejemplos de Casos de Uso

```sql
-- Ejemplo 1: Developer global que es Product Owner en proyecto específico
user_profiles.role = 'developer'  -- Rol global
project_members.role = 'product_owner'  -- Rol en proyecto X

-- Ejemplo 2: Admin que participa como developer en un proyecto
user_profiles.role = 'admin'  -- Rol global  
project_members.role = 'developer'  -- Rol en proyecto Y

-- Ejemplo 3: Product Owner que es member en otro proyecto
user_profiles.role = 'product_owner'  -- Rol global
project_members.role = 'member'  -- Rol en proyecto Z
```

#### Resolución de Permisos

```python
# El sistema usa esta lógica de prioridad:
effective_role = project_role or global_role

# Si el usuario tiene rol específico en el proyecto, se usa ese rol
# Si no tiene rol específico, se usa su rol global
# Los admins globales mantienen permisos de admin en todos los proyectos
```

### Visibilidad de Proyectos por Rol

| Rol | Proyectos Visibles |
|-----|-------------------|
| **Admin** | Todos los proyectos del sistema |
| **Product Owner** | Proyectos donde es miembro + proyectos creados por admins |
| **Developer** | Solo proyectos donde es miembro |
| **Member** | Solo proyectos donde es miembro |

## 📅 Gestión de Fechas

### Tipos de Fechas

- **`start_date`**: Fecha real de inicio del proyecto
- **`planned_end_date`**: Fecha planificada de finalización
- **`actual_end_date`**: Fecha real de finalización
- **`archived_at`**: Fecha de archivado

### Cálculos Automáticos

```typescript
// Verificar si está atrasado
project.is_overdue() // true si actual > planned_end_date

// Días restantes
project.days_remaining() // null | number

// Estado de salud basado en fechas
health.is_overdue: boolean
health.days_remaining: number
```

## 🎯 Hitos del Proyecto

### Gestión de Milestones

Los hitos permiten marcar entregas importantes y fechas clave:

```typescript
interface Milestone {
  name: string
  description?: string
  due_date: datetime
  is_completed: boolean
  is_overdue: boolean  // Calculado automáticamente
}
```

### API de Hitos

```bash
# Crear hito
POST /api/projects/{id}/milestones
{
  "name": "Beta Release",
  "description": "Primera versión beta",
  "due_date": "2024-01-15"
}

# Obtener hitos
GET /api/projects/{id}/milestones

# Actualizar hito
PUT /api/projects/{id}/milestones/{milestone_id}
{
  "is_completed": true
}
```

## 📊 Métricas y Progreso

### Cálculo Automático de Completación

El sistema calcula automáticamente el progreso basado en:

- **50%** Historias de usuario completadas
- **30%** Tareas completadas  
- **20%** Story points completados

```typescript
completion_percentage = (
  story_completion * 0.5 + 
  task_completion * 0.3 + 
  points_completion * 0.2
)
```

### Estado de Salud del Proyecto

```typescript
interface ProjectHealth {
  completion_percentage: number
  is_overdue: boolean
  days_remaining?: number
  risk_level: 'low' | 'medium' | 'high'
  risk_factors: string[]
  overdue_sprints: number
  overdue_milestones: number
}
```

## 🔄 Integración con Scrum/Kanban

### Tableros Scrum

- **Sprints** con fechas de inicio/fin
- **Backlog** priorizado por story points
- **Burndown charts** basado en completion
- **Velocity tracking** por sprint

### Tableros Kanban

- **Listas personalizables** (To Do, In Progress, Done)
- **Cards con fechas límite** y asignación
- **WIP limits** configurables
- **Flow metrics** y lead time

### Sincronización

```typescript
// Al completar una historia en Scrum
story.status = 'done' 
→ project.completion_percentage se actualiza automáticamente

// Al mover card a "Done" en Kanban  
card.list = 'done'
→ task.status = 'done'
→ project.completion_percentage se actualiza
```

## 🚀 API Endpoints del Ciclo de Vida

### Transiciones de Estado

```bash
# Iniciar proyecto
POST /api/projects/{id}/start
{ "start_date": "2024-01-01" }  # opcional

# Completar proyecto  
POST /api/projects/{id}/complete
{ "completion_notes": "Entregado exitosamente" }  # opcional

# Pausar proyecto
POST /api/projects/{id}/pause
{ "reason": "Esperando feedback del cliente" }

# Reanudar proyecto
POST /api/projects/{id}/resume

# Cancelar proyecto
POST /api/projects/{id}/cancel
{ "reason": "Cambio de prioridades" }  # obligatorio

# Archivar proyecto
POST /api/projects/{id}/archive
```

### Gestión de Fechas

```bash
# Actualizar fechas
PUT /api/projects/{id}/dates
{
  "start_date": "2024-01-01",
  "planned_end_date": "2024-06-30"
}
```

### Monitoreo y Métricas

```bash
# Estado de salud
GET /api/projects/{id}/health

# Actualizar porcentaje de completación
POST /api/projects/{id}/update-completion

# Proyectos que requieren atención
GET /api/projects/attention-required
```

## 📱 Frontend - Dashboard de Proyecto

### Componente Principal

El componente `ProjectLifecyclePage` proporciona:

- **Vista 360° del proyecto** con métricas en tiempo real
- **Panel de acciones** contextual según el estado
- **Timeline de hitos** con estados visuales
- **Alertas automáticas** para fechas y riesgos

### Navegación

```
/projects/{id}/lifecycle
```

### Características de UI/UX

- **Indicadores visuales** de estado y riesgo
- **Barras de progreso** animadas
- **Modales intuitivos** para acciones
- **Tema oscuro/claro** completo
- **Responsive design** para móviles

## ⚠️ Sistema de Alertas

### Detección Automática de Riesgos

```typescript
// Factores de riesgo detectados automáticamente:
- Proyecto atrasado (actual > planned_end_date)
- Menos de 7 días para deadline
- Sprints atrasados
- Hitos vencidos
- Poco progreso cerca del deadline
```

### Niveles de Riesgo

- 🟢 **LOW**: Todo bajo control
- 🟡 **MEDIUM**: Requiere atención
- 🔴 **HIGH**: Acción inmediata necesaria

### Proyectos que Requieren Atención

```sql
-- Query automático para detectar proyectos en riesgo
SELECT * FROM projects WHERE 
  is_active = true AND
  (
    planned_end_date < NOW() OR
    planned_end_date < NOW() + INTERVAL '7 days' OR
    (completion_percentage < 20 AND planned_end_date < NOW() + INTERVAL '30 days')
  )
```

## 🔐 Permisos y Roles

### Roles Definidos en el Sistema

El sistema maneja **4 roles principales** tanto a nivel global como de proyecto:

#### Roles Globales (user_profiles.role)
- **`admin`**: Administrador del sistema con acceso completo
- **`product_owner`**: Product Owner con permisos de gestión de productos  
- **`developer`**: Desarrollador con permisos de ejecución
- **`member`**: Usuario básico con permisos limitados

#### Roles de Proyecto (project_members.role)
Los mismos 4 roles se aplican a nivel de proyecto:

- **`admin`**: Administrador con control total del proyecto
- **`product_owner`**: Product Owner del proyecto
- **`developer`**: Desarrollador asignado al proyecto
- **`member`**: Miembro general del proyecto

### Matriz de Permisos Detallada

| Acción | Admin | Product Owner | Developer | Member |
|--------|-------|---------------|-----------|--------|
| **Gestión de Proyectos** | | | | |
| Crear proyecto | ✅ | ✅ | ❌ | ❌ |
| Iniciar proyecto | ✅ | ✅ | ✅ | ❌ |
| Completar proyecto | ✅ | ✅ | ✅ | ❌ |
| Pausar/Reanudar proyecto | ✅ | ✅ | ✅ | ❌ |
| Cancelar proyecto | ✅ | ❌ | ❌ | ❌ |
| Archivar proyecto | ✅ | ❌ | ❌ | ❌ |
| **Gestión de Fechas y Hitos** | | | | |
| Actualizar fechas del proyecto | ✅ | ✅ | ✅ | ❌ |
| Crear hitos | ✅ | ✅ | ✅ | ❌ |
| Actualizar hitos | ✅ | ✅ | ✅ | ❌ |
| Completar hitos | ✅ | ✅ | ✅ | ✅ |
| **Gestión de Miembros** | | | | |
| Añadir miembros al proyecto | ✅ | ✅ | ✅ | ❌ |
| Remover miembros del proyecto | ✅ | ✅ | ❌ | ❌ |
| Cambiar roles de miembros | ✅ | ❌ | ❌ | ❌ |
| **Gestión de Sprints (Scrum)** | | | | |
| Crear/editar sprints | ✅ | ✅ | ✅ | ❌ |
| Iniciar/cerrar sprints | ✅ | ✅ | ✅ | ❌ |
| Gestionar sprint backlog | ✅ | ✅ | ✅ | ✅ |
| **Monitoreo y Métricas** | | | | |
| Ver estado de salud | ✅ | ✅ | ✅ | ✅ |
| Ver proyectos que requieren atención | ✅ | ✅ | ✅ | ❌ |
| Actualizar porcentaje de completación | ✅ | ✅ | ✅ | ✅ |
| **Gestión de Contenido Ágil** | | | | |
| Crear/editar historias de usuario | ✅ | ✅ | ✅ | ✅ |
| Asignar story points | ✅ | ✅ | ✅ | ✅ |
| Mover cards en tableros Kanban | ✅ | ✅ | ✅ | ✅ |
| Crear/completar tareas | ✅ | ✅ | ✅ | ✅ |

### Jerarquía de Roles

```
ADMIN (Máximo control del sistema)
  ↓
PRODUCT_OWNER (Gestión de producto)
  ↓
DEVELOPER (Ejecución y desarrollo)
  ↓
MEMBER (Participación limitada)
```

### Reglas de Negocio por Rol

#### 🔑 **Admin**
- **Acceso completo** a todos los proyectos del sistema
- **Único rol** que puede cancelar y archivar proyectos
- Puede **cambiar roles** de otros usuarios
- Acceso a **métricas globales** y proyectos que requieren atención

#### 👑 **Product Owner**
- **Gestión completa** de proyectos donde es miembro
- Puede **iniciar, completar, pausar y reanudar** proyectos
- Gestiona **fechas, hitos y miembros** del proyecto
- Ve **todos los desarrolladores** para asignación de tareas
- Acceso a **métricas de sus proyectos**

#### 💻 **Developer**
- **Ejecución de tareas** en proyectos asignados
- Puede **completar hitos** y actualizar progreso
- **Gestión de sprint backlog** y asignación de story points
- Puede **mover cards** en tableros Kanban
- Ve **métricas básicas** del proyecto

#### 👤 **Member**
- **Participación básica** en proyectos
- Solo puede **ver** información del proyecto
- Puede **mover sus propias cards** en tableros
- **Acceso limitado** a métricas

### Flujos de API por Rol

#### Flujo de Admin
```bash
# Admin puede hacer todo en cualquier proyecto
POST /api/projects/{project_id}/start
POST /api/projects/{project_id}/complete  
POST /api/projects/{project_id}/cancel     # Solo admin
POST /api/projects/{project_id}/archive    # Solo admin
PUT /api/projects/{project_id}/dates
POST /api/projects/{project_id}/milestones
```

#### Flujo de Product Owner
```bash
# Product Owner: gestión completa en sus proyectos
POST /api/projects/{project_id}/start
POST /api/projects/{project_id}/complete
POST /api/projects/{project_id}/pause
POST /api/projects/{project_id}/resume
PUT /api/projects/{project_id}/dates
POST /api/projects/{project_id}/milestones
POST /api/projects/{project_id}/members
```

#### Flujo de Developer
```bash
# Developer: participación activa pero sin gestión
GET /api/projects/{project_id}/health
PUT /api/projects/{project_id}/milestones/{milestone_id}
POST /api/projects/{project_id}/update-completion
GET /api/projects/{project_id}/milestones
```

#### Flujo de Member
```bash
# Member solo puede ver y participar básicamente
GET /api/projects/{project_id}/health
GET /api/projects/{project_id}/milestones
POST /api/boards/{board_id}/cards/{own_card_id}/move
```

## 🗄️ Auditoría y Trazabilidad

### Log de Actividades

Todas las acciones quedan registradas en `project_activities`:

```typescript
interface ProjectActivity {
  project_id: string
  user_id: string
  activity_type: string  // 'project_started', 'project_completed', etc.
  description: string
  extra_data?: string      // JSON con datos adicionales
  created_at: datetime
}
```

### Ejemplos de Actividades

```json
{
  "activity_type": "project_completed",
  "description": "Proyecto completado exitosamente el 2024-01-15",
  "extra_data": {
    "completion_notes": "Entregado al cliente",
    "stats": {
      "total_stories": 45,
      "completed_stories": 45,
      "completion_percentage": 100
    }
  }
}
```

## 🚀 Próximas Mejoras Sugeridas

### Automatización Avanzada

1. **Workflows automatizados** basados en eventos
2. **Notificaciones por email/Slack** para cambios de estado
3. **Integración con calendarios** para hitos
4. **Reports automáticos** semanales/mensuales

### Métricas Avanzadas

1. **Burndown/Burnup charts** por proyecto
2. **Velocity tracking** histórico
3. **Predictive analytics** para fechas de entrega
4. **ROI tracking** con costos y presupuestos

### Colaboración

1. **Comments en hitos** y actividades
2. **@mentions** para notificaciones
3. **File attachments** en hitos
4. **Integration con Git** para tracking de commits

## 💡 Casos de Uso Típicos

### 1. Inicio de Proyecto

```bash
# 1. Crear proyecto (admin)
POST /api/projects
{ "name": "Nueva App Mobile", "description": "..." }

# 2. Agregar miembros
POST /api/projects/{id}/members
{ "member_email": "dev@company.com", "role": "developer" }

# 3. Configurar fechas y hitos
PUT /api/projects/{id}/dates
{ "planned_end_date": "2024-06-30" }

POST /api/projects/{id}/milestones
{ "name": "MVP", "due_date": "2024-04-15" }

# 4. Iniciar proyecto
POST /api/projects/{id}/start
```

### 2. Gestión Durante Desarrollo

```bash
# Monitorear salud regularmente
GET /api/projects/{id}/health

# Actualizar progreso automáticamente
POST /api/projects/{id}/update-completion

# Marcar hitos como completados
PUT /api/projects/{id}/milestones/{milestone_id}
{ "is_completed": true }
```

### 3. Cierre de Proyecto

```bash
# Completar cuando todo esté listo
POST /api/projects/{id}/complete
{ "completion_notes": "Proyecto entregado satisfactoriamente" }

# Archivar después de un tiempo
POST /api/projects/{id}/archive
```

## 📋 Checklist de Implementación

Para implementar este sistema en un proyecto:

- [ ] **Ejecutar migración de BD** para nuevos campos
- [ ] **Actualizar permisos** de usuarios existentes
- [ ] **Configurar navegación** a `/projects/{id}/lifecycle`
- [ ] **Capacitar usuarios** en nuevos flujos
- [ ] **Configurar alertas** por email (opcional)
- [ ] **Personalizar estados** según la metodología utilizada

---

Con este sistema completo, tienes todo lo necesario para gestionar proyectos ágiles desde la concepción hasta el archivado, con visibilidad total del progreso, riesgos y métricas de salud. ¡El flujo está listo para manejar tanto Scrum como Kanban de manera integrada! 