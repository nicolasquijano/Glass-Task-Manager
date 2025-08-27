# API Documentation / Documentación API

## Backend API (Go) / API Backend (Go)

### English
The Glass Task Manager backend provides the following API methods through Wails binding:

### Español  
El backend del Gestor de Tareas Glass proporciona los siguientes métodos API a través del binding de Wails:

## Task Management / Gestión de Tareas

### GetTasks()
#### English
Retrieves all tasks in hierarchical structure.

**Returns:** `[]Task` - Array of root-level tasks with nested children

**Example:**
```javascript
const tasks = await GetTasks();
```

#### Español
Recupera todas las tareas en estructura jerárquica.

**Retorna:** `[]Task` - Array de tareas de nivel raíz con hijos anidados

### AddTask(text string)
#### English
Creates a new root-level task.

**Parameters:**
- `text` (string): Task description

**Returns:** `Task` - The created task object

#### Español
Crea una nueva tarea de nivel raíz.

**Parámetros:**
- `text` (string): Descripción de la tarea

### AddSubTask(parentId int, text string)
#### English
Creates a subtask under a parent task.

**Parameters:**
- `parentId` (int): ID of the parent task
- `text` (string): Subtask description

**Returns:** `Task` - The created subtask object

#### Español
Crea una subtarea bajo una tarea padre.

**Parámetros:**
- `parentId` (int): ID de la tarea padre
- `text` (string): Descripción de la subtarea

### UpdateTask(task Task)
#### English
Updates an existing task.

**Parameters:**
- `task` (Task): Complete task object with updated fields

**Returns:** `error` - Nil on success

#### Español
Actualiza una tarea existente.

**Parámetros:**
- `task` (Task): Objeto de tarea completo con campos actualizados

### DeleteTask(id int)
#### English
Deletes a task and all its subtasks (cascade delete).

**Parameters:**
- `id` (int): Task ID to delete

**Returns:** `error` - Nil on success

#### Español
Elimina una tarea y todas sus subtareas (eliminación en cascada).

**Parámetros:**
- `id` (int): ID de la tarea a eliminar

### ToggleExpanded(taskId int)
#### English
Toggles the expanded state of a task (for tree view).

**Parameters:**
- `taskId` (int): Task ID to toggle

**Returns:** `error` - Nil on success

#### Español
Alterna el estado expandido de una tarea (para vista de árbol).

**Parámetros:**
- `taskId` (int): ID de la tarea a alternar

### ReorderTasks(taskIds []int, parentId *int)
#### English
Reorders tasks within the same hierarchy level.

**Parameters:**
- `taskIds` ([]int): Array of task IDs in new order
- `parentId` (*int): Parent ID (null for root level)

**Returns:** `error` - Nil on success

#### Español
Reordena tareas dentro del mismo nivel jerárquico.

**Parámetros:**
- `taskIds` ([]int): Array de IDs de tareas en nuevo orden
- `parentId` (*int): ID padre (null para nivel raíz)

## Window Management / Gestión de Ventana

### ToggleAlwaysOnTop()
#### English
Toggles the always-on-top state of the window.

**Returns:** None

#### Español
Alterna el estado siempre-visible de la ventana.

### IsAlwaysOnTop()
#### English
Returns the current always-on-top state.

**Returns:** `bool` - True if window is always on top

#### Español
Retorna el estado actual de siempre-visible.

**Retorna:** `bool` - True si la ventana está siempre visible

### GetWindowState()
#### English
Returns the current window focus state.

**Returns:** `WindowState` - Object with window state information

#### Español
Retorna el estado actual de foco de la ventana.

**Retorna:** `WindowState` - Objeto con información del estado de ventana

### OnWindowFocus()
#### English
Handler called when window gains focus.

#### Español
Manejador llamado cuando la ventana gana foco.

### OnWindowBlur()
#### English
Handler called when window loses focus.

#### Español
Manejador llamado cuando la ventana pierde foco.

## Data Structures / Estructuras de Datos

### Task
```go
type Task struct {
    ID         int    `json:"id"`
    Text       string `json:"text"`
    Completed  bool   `json:"completed"`
    ParentID   *int   `json:"parentId"`
    Level      int    `json:"level"`
    IsExpanded bool   `json:"isExpanded"`
    SortOrder  int    `json:"sortOrder"`
    Children   []Task `json:"children,omitempty"`
}
```

#### English
- `ID`: Unique task identifier
- `Text`: Task description
- `Completed`: Whether task is completed
- `ParentID`: ID of parent task (null for root tasks)
- `Level`: Nesting level (0 for root)
- `IsExpanded`: Whether task tree is expanded
- `SortOrder`: Position within same level
- `Children`: Array of subtasks

#### Español
- `ID`: Identificador único de la tarea
- `Text`: Descripción de la tarea
- `Completed`: Si la tarea está completada
- `ParentID`: ID de la tarea padre (null para tareas raíz)
- `Level`: Nivel de anidamiento (0 para raíz)
- `IsExpanded`: Si el árbol de tareas está expandido
- `SortOrder`: Posición dentro del mismo nivel
- `Children`: Array de subtareas

### Settings
```go
type Settings struct {
    AlwaysOnTop bool `json:"alwaysOnTop"`
}
```

### WindowState
```go
type WindowState struct {
    IsActive bool `json:"isActive"`
}
```

## Frontend Composables / Composables Frontend

### useTasks()

#### English
Vue composable for centralized task management state.

**Provides:**
- `tasks` - Reactive task array
- `isLoading` - Loading state
- `error` - Error state
- `taskStats` - Task statistics
- `loadTasks()` - Load all tasks
- `addTask(text)` - Create new task
- `addSubTask(parentId, text)` - Create subtask
- `deleteTask(id)` - Delete task
- `toggleComplete(task)` - Toggle completion
- `toggleExpand(taskId)` - Toggle expansion
- `reorderTasks(params)` - Reorder tasks
- `clearError()` - Clear error state

#### Español
Composable Vue para estado centralizado de gestión de tareas.

**Proporciona:**
- `tasks` - Array reactivo de tareas
- `isLoading` - Estado de carga
- `error` - Estado de error
- `taskStats` - Estadísticas de tareas
- `loadTasks()` - Cargar todas las tareas
- `addTask(text)` - Crear nueva tarea
- `addSubTask(parentId, text)` - Crear subtarea
- `deleteTask(id)` - Eliminar tarea
- `toggleComplete(task)` - Alternar completado
- `toggleExpand(taskId)` - Alternar expansión
- `reorderTasks(params)` - Reordenar tareas
- `clearError()` - Limpiar estado de error

## Database Schema / Esquema de Base de Datos

### tasks table / tabla tasks

```sql
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    completed BOOLEAN NOT NULL,
    parent_id INTEGER,
    level INTEGER DEFAULT 0,
    is_expanded BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);
```

### Indices / Índices

#### English
Optimized indices for performance:

#### Español
Índices optimizados para rendimiento:

```sql
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_sort_order ON tasks(sort_order);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_parent_sort ON tasks(parent_id, sort_order);
CREATE INDEX idx_tasks_updated_at ON tasks(updated_at);
```

## Error Handling / Manejo de Errores

### English
All API methods return errors that should be handled appropriately:

- Database connection errors
- SQL constraint violations
- Invalid task IDs
- Permission errors

### Español
Todos los métodos API retornan errores que deben ser manejados apropiadamente:

- Errores de conexión de base de datos
- Violaciones de restricciones SQL
- IDs de tareas inválidos
- Errores de permisos

## Performance Notes / Notas de Rendimiento

### English
- All frequent operations use prepared statements
- Connection pooling is configured for optimal performance
- Database indices ensure fast queries even with many tasks
- Optimistic updates in frontend for responsive UI
- GPU acceleration for smooth animations

### Español
- Todas las operaciones frecuentes usan declaraciones preparadas
- Pool de conexiones configurado para rendimiento óptimo
- Índices de base de datos aseguran consultas rápidas incluso con muchas tareas
- Actualizaciones optimistas en frontend para UI responsiva
- Aceleración GPU para animaciones suaves

---

**Created by Nicolas Quijano (nicoquijano@gmail.com)**