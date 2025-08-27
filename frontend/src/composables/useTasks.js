import { ref, computed, readonly } from 'vue'
import { GetTasks, AddTask, AddSubTask, DeleteTask, UpdateTask, ToggleExpanded, ReorderTasks } from '../../wailsjs/go/main/App'

// Estado global reactivo
const tasks = ref([])
const isLoading = ref(false)
const error = ref(null)

export function useTasks() {
  // Computed para estadísticas
  const taskStats = computed(() => {
    const flatten = (tasks) => {
      return tasks.reduce((acc, task) => {
        acc.push(task)
        if (task.children?.length) {
          acc.push(...flatten(task.children))
        }
        return acc
      }, [])
    }
    
    const allTasks = flatten(tasks.value)
    return {
      total: allTasks.length,
      completed: allTasks.filter(task => task.completed).length,
      pending: allTasks.filter(task => !task.completed).length
    }
  })

  // Helpers para encontrar tareas
  const findTaskById = (taskId, taskList = tasks.value) => {
    for (const task of taskList) {
      if (task.id === taskId) return task
      if (task.children?.length) {
        const found = findTaskById(taskId, task.children)
        if (found) return found
      }
    }
    return null
  }

  const findTaskParent = (taskId, taskList = tasks.value, parent = null) => {
    for (const task of taskList) {
      if (task.id === taskId) return parent
      if (task.children?.length) {
        const found = findTaskParent(taskId, task.children, task)
        if (found !== null) return found
      }
    }
    return null
  }

  // Operaciones CRUD optimizadas
  const loadTasks = async () => {
    if (isLoading.value) return // Evitar múltiples cargas simultáneas
    
    try {
      isLoading.value = true
      error.value = null
      const result = await GetTasks()
      tasks.value = result || []
      return result
    } catch (err) {
      error.value = 'Error al cargar las tareas'
      console.error('Error loading tasks:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const addTask = async (text) => {
    if (!text?.trim()) {
      throw new Error('Por favor ingresa una tarea')
    }
    
    try {
      const newTask = await AddTask(text.trim())
      // Actualización optimista local
      tasks.value.unshift(newTask)
      return newTask
    } catch (err) {
      // Rollback en caso de error
      console.error('Error adding task:', err)
      await loadTasks() // Resync en caso de error
      throw new Error('Error al añadir la tarea')
    }
  }

  const addSubTask = async (parentId, text) => {
    if (!text?.trim()) {
      throw new Error('Por favor ingresa una subtarea')
    }
    
    try {
      const newSubTask = await AddSubTask(parentId, text.trim())
      
      // Actualización local optimizada
      const parentTask = findTaskById(parentId)
      if (parentTask) {
        if (!parentTask.children) {
          parentTask.children = []
        }
        parentTask.children.push(newSubTask)
        parentTask.isExpanded = true
      }
      
      return newSubTask
    } catch (err) {
      console.error('Error adding subtask:', err)
      await loadTasks() // Resync en caso de error
      throw new Error('Error al añadir la subtarea')
    }
  }

  const deleteTask = async (taskId) => {
    try {
      await DeleteTask(taskId)
      
      // Eliminación local optimizada
      const removeFromList = (taskList) => {
        const index = taskList.findIndex(task => task.id === taskId)
        if (index !== -1) {
          taskList.splice(index, 1)
          return true
        }
        
        // Buscar en children
        for (const task of taskList) {
          if (task.children?.length && removeFromList(task.children)) {
            return true
          }
        }
        return false
      }
      
      removeFromList(tasks.value)
    } catch (err) {
      console.error('Error deleting task:', err)
      await loadTasks() // Resync en caso de error
      throw new Error('Error al eliminar la tarea')
    }
  }

  const toggleComplete = async (task) => {
    const originalState = task.completed
    
    try {
      // Actualización optimista
      task.completed = !task.completed
      await UpdateTask(task)
    } catch (err) {
      // Rollback en caso de error
      task.completed = originalState
      console.error('Error updating task:', err)
      throw new Error('Error al actualizar')
    }
  }

  const toggleExpand = async (taskId) => {
    try {
      const task = findTaskById(taskId)
      if (task) {
        // Actualización optimista local
        task.isExpanded = !task.isExpanded
      }
      
      await ToggleExpanded(taskId)
    } catch (err) {
      console.error('Error toggling expand:', err)
      await loadTasks() // Resync en caso de error
      throw new Error('Error al expandir/contraer')
    }
  }

  const reorderTasks = async ({ draggedTaskId, targetTaskId, parentId }) => {
    try {
      // Encontrar tareas del mismo nivel
      let sameLevelTasks = []
      
      if (parentId === null || parentId === undefined) {
        sameLevelTasks = tasks.value.filter(task => 
          task.parentId === null || task.parentId === undefined
        )
      } else {
        const parentTask = findTaskById(parentId)
        if (parentTask?.children) {
          sameLevelTasks = parentTask.children
        }
      }
      
      const draggedIndex = sameLevelTasks.findIndex(task => task.id === draggedTaskId)
      const targetIndex = sameLevelTasks.findIndex(task => task.id === targetTaskId)
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Reordenar localmente primero (optimistic update)
        const [draggedTask] = sameLevelTasks.splice(draggedIndex, 1)
        sameLevelTasks.splice(targetIndex, 0, draggedTask)
        
        // Actualizar sort orders localmente
        sameLevelTasks.forEach((task, index) => {
          task.sortOrder = index
        })
        
        // Enviar al backend
        const taskIDs = sameLevelTasks.map(task => task.id)
        await ReorderTasks(taskIDs, parentId || null)
      }
    } catch (err) {
      console.error('Error reordering tasks:', err)
      await loadTasks() // Resync en caso de error
      throw new Error('Error al reordenar las tareas')
    }
  }

  // Funciones de utilidad
  const clearError = () => {
    error.value = null
  }

  const refreshTasks = () => {
    return loadTasks()
  }

  return {
    // Estado
    tasks: readonly(tasks),
    isLoading: readonly(isLoading),
    error: readonly(error),
    taskStats,
    
    // Operaciones
    loadTasks,
    addTask,
    addSubTask,
    deleteTask,
    toggleComplete,
    toggleExpand,
    reorderTasks,
    
    // Utilidades
    findTaskById,
    findTaskParent,
    clearError,
    refreshTasks
  }
}