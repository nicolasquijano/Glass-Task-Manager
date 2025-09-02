import { ref, computed, readonly, type Ref, type ComputedRef } from 'vue'
import { GetTasks, AddTask, AddSubTask, DeleteTask, UpdateTask, ToggleExpanded, ReorderTasks, ForceBackup, GetLastBackupTime } from '../../wailsjs/go/main/App'
import type { Task, TaskStats, ValidationResult } from '@/types'

// Estado global reactivo
const tasks: Ref<Task[]> = ref([])
const isLoading: Ref<boolean> = ref(false)
const error: Ref<string | null> = ref(null)
const lastSyncTime: Ref<Date | null> = ref(null)
const autoSyncInterval: Ref<NodeJS.Timeout | null> = ref(null)
const isAutoSyncEnabled: Ref<boolean> = ref(true)
const lastKnownTaskCount: Ref<number> = ref(0)
const suspendAutoSync: Ref<boolean> = ref(false)

export function useTasks() {
  // Computed para estadísticas
  const taskStats: ComputedRef<TaskStats> = computed(() => {
    const flatten = (tasks: Task[]): Task[] => {
      return tasks.reduce((acc: Task[], task: Task) => {
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
  const findTaskById = (taskId: number, taskList: Task[] = tasks.value): Task | null => {
    for (const task of taskList) {
      if (task.id === taskId) return task
      if (task.children?.length) {
        const found = findTaskById(taskId, task.children)
        if (found) return found
      }
    }
    return null
  }

  const findTaskParent = (taskId: number, taskList: Task[] = tasks.value, parent: Task | null = null): Task | null => {
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
  const loadTasks = async (): Promise<Task[] | undefined> => {
    if (isLoading.value) return // Evitar múltiples cargas simultáneas
    
    try {
      isLoading.value = true
      error.value = null
      const result = await GetTasks()
      tasks.value = result || []
      
      // Actualizar contador de tareas conocidas
      lastKnownTaskCount.value = result ? result.reduce((acc, task) => 
        acc + 1 + (task.children?.length || 0), 0) : 0
      
      console.log(`Loaded ${lastKnownTaskCount.value} total tasks`)
      return result
    } catch (err) {
      error.value = 'Error al cargar las tareas'
      console.error('Error loading tasks:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const addTask = async (text: string): Promise<Task> => {
    console.log('🐛 addTask called with:', text)
    
    if (!text?.trim()) {
      throw new Error('Por favor ingresa una tarea')
    }
    
    try {
      console.log('🐛 Calling AddTask with:', text.trim())
      console.log('🐛 window.go available?', !!window.go)
      console.log('🐛 AddTask function available?', typeof AddTask)
      
      const newTask = await AddTask(text.trim())
      console.log('🐛 AddTask returned:', newTask)
      
      // Actualización optimista local
      tasks.value.unshift(newTask)
      console.log('🐛 Task added to local state, total tasks:', tasks.value.length)
      return newTask
    } catch (err) {
      // Rollback en caso de error
      console.error('🐛 Error adding task:', err)
      await loadTasks() // Resync en caso de error
      throw new Error('Error al añadir la tarea: ' + (err as Error).message)
    }
  }

  const addSubTask = async (parentId: number, text: string): Promise<Task> => {
    if (!text?.trim()) {
      throw new Error('Por favor ingresa una subtarea')
    }
    
    // Validate parent exists
    const parentTask = findTaskById(parentId)
    if (!parentTask) {
      throw new Error('Tarea padre no encontrada')
    }
    
    // Validate text length
    const trimmedText = text.trim()
    if (trimmedText.length > 500) {
      throw new Error('El texto de la subtarea es demasiado largo (máximo 500 caracteres)')
    }
    
    // SUSPENDER auto-sync durante esta operación crítica
    suspendAutoSync.value = true
    console.log('🛡️ Auto-sync suspendido durante creación de subtarea')
    
    // Store original state for rollback
    const originalChildren = parentTask.children ? [...parentTask.children] : []
    const originalExpanded = parentTask.isExpanded
    
    try {
      // Optimistic UI update
      if (!parentTask.children) {
        parentTask.children = []
      }
      
      // Create temporary subtask for immediate UI feedback
      const tempSubTask: Task & { _isTemp?: boolean } = {
        id: Date.now(), // temporary ID
        text: trimmedText,
        completed: false,
        parentId: parentId,
        level: (parentTask.level || 0) + 1,
        isExpanded: true,
        sortOrder: parentTask.children.length,
        children: [],
        _isTemp: true // mark as temporary
      }
      
      parentTask.children.push(tempSubTask)
      parentTask.isExpanded = true
      
      // Call backend
      const newSubTask = await AddSubTask(parentId, trimmedText)
      
      // Replace temporary subtask with real one
      const tempIndex = parentTask.children.findIndex(child => 
        (child as any)._isTemp && child.id === tempSubTask.id)
      if (tempIndex !== -1) {
        // Remove temp flag and update with real data
        delete (parentTask.children[tempIndex] as any)._isTemp
        Object.assign(parentTask.children[tempIndex], newSubTask)
      } else {
        // If temp not found, add the real subtask
        parentTask.children.push(newSubTask)
      }
      
      // Update task count
      lastKnownTaskCount.value++
      
      console.log('Successfully added subtask:', newSubTask.id, 'to parent:', parentId)
      
      // Re-habilitar auto-sync después de completar
      setTimeout(() => {
        suspendAutoSync.value = false
        console.log('🔄 Auto-sync re-habilitado después de crear subtarea')
      }, 3000) // Esperar 3 segundos antes de reanudar auto-sync
      
      return newSubTask
      
    } catch (err) {
      console.error('Error adding subtask:', err)
      
      // Rollback optimistic changes
      parentTask.children = originalChildren
      parentTask.isExpanded = originalExpanded
      
      // Re-habilitar auto-sync incluso en caso de error
      suspendAutoSync.value = false
      
      // Force reload to ensure consistency
      try {
        await loadTasks()
      } catch (reloadErr) {
        console.error('Error reloading tasks after subtask failure:', reloadErr)
      }
      
      // Provide user-friendly error message
      const errorMessage = (err as Error).message || 'Error al añadir la subtarea'
      if (errorMessage.includes('parent task') && errorMessage.includes('not found')) {
        throw new Error('La tarea padre no existe')
      } else if (errorMessage.includes('maximum nesting level')) {
        throw new Error('Nivel máximo de anidación alcanzado')
      } else if (errorMessage.includes('too long')) {
        throw new Error('El texto de la subtarea es demasiado largo')
      } else {
        throw new Error(errorMessage)
      }
    }
  }

  const deleteTask = async (taskId: number): Promise<void> => {
    try {
      await DeleteTask(taskId)
      
      // Eliminación local optimizada
      const removeFromList = (taskList: Task[]): boolean => {
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

  const toggleComplete = async (task: Task): Promise<void> => {
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

  const updateTask = async (taskId: number, updates: Partial<Task>): Promise<void> => {
    try {
      const task = findTaskById(taskId)
      if (!task) throw new Error('Tarea no encontrada')
      
      const originalData = { ...task }
      
      // Actualización optimista
      Object.assign(task, updates)
      
      await UpdateTask(task)
    } catch (err) {
      console.error('Error updating task:', err)
      await loadTasks() // Resync en caso de error
      throw new Error('Error al actualizar la tarea')
    }
  }

  const toggleExpand = async (taskId: number): Promise<void> => {
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

  const reorderTasks = async ({ draggedTaskId, targetTaskId, parentId }: {
    draggedTaskId: number
    targetTaskId: number
    parentId?: number | null
  }): Promise<void> => {
    try {
      // Encontrar tareas del mismo nivel
      let sameLevelTasks: Task[] = []
      
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
  const clearError = (): void => {
    error.value = null
  }

  const refreshTasks = (): Promise<Task[] | undefined> => {
    return loadTasks()
  }

  // Función para comparar tareas de manera más precisa
  const deepCompareTasks = (tasks1: Task[] | null, tasks2: Task[] | null): boolean => {
    if (!tasks1 || !tasks2) return false
    if (tasks1.length !== tasks2.length) return false
    
    const normalizeTask = (task: Task): any => ({
      id: task.id,
      text: task.text,
      completed: task.completed,
      parentId: task.parentId,
      level: task.level,
      isExpanded: task.isExpanded,
      sortOrder: task.sortOrder,
      children: task.children ? task.children.map(normalizeTask).sort((a, b) => a.id - b.id) : []
    })
    
    const normalize1 = tasks1.map(normalizeTask).sort((a, b) => a.id - b.id)
    const normalize2 = tasks2.map(normalizeTask).sort((a, b) => a.id - b.id)
    
    return JSON.stringify(normalize1) === JSON.stringify(normalize2)
  }

  // Sistema de sincronización automática ultra-conservador
  const startAutoSync = (): void => {
    if (autoSyncInterval.value) return // Ya está iniciado
    
    isAutoSyncEnabled.value = true
    autoSyncInterval.value = setInterval(async () => {
      if (!isAutoSyncEnabled.value || isLoading.value || suspendAutoSync.value) return
      
      try {
        // Solo sincronizar si no estamos en medio de una operación
        if (tasks.value.some(task => (task as any)._isTemp || task.children?.some(child => (child as any)._isTemp))) {
          console.log('Skipping auto-sync: temporary tasks present')
          return
        }
        
        // Verificar si hay cambios sincronizando con el backend
        const currentTasks = await GetTasks()
        const backendCount = currentTasks ? currentTasks.reduce((acc, task) => acc + 1 + (task.children?.length || 0), 0) : 0
        const localCount = tasks.value.reduce((acc, task) => acc + 1 + (task.children?.length || 0), 0)
        
        // ULTRA-CONSERVADOR: Solo sincronizar si el backend tiene MÁS tareas que local
        // Nunca permitir que se reduzcan las tareas automáticamente
        if (backendCount > localCount) {
          console.log('Detectado incremento en backend, sincronizando...')
          console.log(`Backend: ${backendCount} tareas, Local: ${localCount} tareas`)
          
          if (!deepCompareTasks(currentTasks, tasks.value)) {
            tasks.value = currentTasks || []
            lastSyncTime.value = new Date()
            lastKnownTaskCount.value = backendCount
            console.log(`Sincronización de incremento completada: ${backendCount} tareas`)
          }
        } else if (backendCount < localCount) {
          console.warn(`ADVERTENCIA: Backend tiene menos tareas (${backendCount}) que local (${localCount}). Sincronización suspendida para proteger datos.`)
          console.warn('Para forzar sincronización, usar refreshTasks() manualmente')
          // No sincronizar automáticamente cuando hay menos tareas en backend
        }
      } catch (err) {
        console.error('Error durante auto-sync:', err)
      }
    }, 20000) // Aumentar frecuencia a 20 segundos para ser aún menos agresivo
    
    console.log('Auto-sync ultra-conservador iniciado (cada 20 segundos, solo incrementos)')
  }

  const stopAutoSync = (): void => {
    if (autoSyncInterval.value) {
      clearInterval(autoSyncInterval.value)
      autoSyncInterval.value = null
      isAutoSyncEnabled.value = false
      console.log('Auto-sync detenido')
    }
  }

  const toggleAutoSync = (): void => {
    if (isAutoSyncEnabled.value) {
      stopAutoSync()
    } else {
      startAutoSync()
    }
  }

  // Funciones de backup
  const createBackup = async (): Promise<string> => {
    try {
      await ForceBackup()
      return 'Backup creado exitosamente'
    } catch (err) {
      console.error('Error creating backup:', err)
      throw new Error('Error al crear backup')
    }
  }

  const getLastBackupTime = async (): Promise<string> => {
    try {
      return await GetLastBackupTime()
    } catch (err) {
      console.error('Error getting last backup time:', err)
      return 'Desconocido'
    }
  }

  // Validación de integridad local
  const validateLocalIntegrity = (): ValidationResult => {
    const issues: string[] = []
    const taskMap = new Map<number, Task & { parentId?: number | null }>()
    
    // Recopilar todos los tasks en un mapa plano
    const collectTasks = (taskList: Task[], parentId: number | null = null): void => {
      taskList.forEach(task => {
        if (taskMap.has(task.id)) {
          issues.push(`Tarea duplicada encontrada: ID ${task.id}`)
        }
        taskMap.set(task.id, { ...task, parentId })
        
        if (task.children && task.children.length > 0) {
          collectTasks(task.children, task.id)
        }
      })
    }
    
    collectTasks(tasks.value)
    
    // Verificar relaciones padre-hijo
    for (const [taskId, task] of taskMap.entries()) {
      if (task.parentId && !taskMap.has(task.parentId)) {
        issues.push(`Tarea ${taskId} tiene padre inexistente: ${task.parentId}`)
      }
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      totalTasks: taskMap.size
    }
  }

  // Auto-reparación de datos locales
  const repairLocalData = async (): Promise<string> => {
    try {
      console.log('Iniciando reparación de datos locales...')
      await loadTasks() // Reload desde backend
      const validation = validateLocalIntegrity()
      
      if (validation.isValid) {
        console.log('Datos locales reparados correctamente')
        return 'Datos reparados exitosamente'
      } else {
        console.warn('Algunos problemas persisten:', validation.issues)
        return `Reparación parcial. Problemas restantes: ${validation.issues.length}`
      }
    } catch (err) {
      console.error('Error durante reparación:', err)
      throw new Error('Error durante la reparación de datos')
    }
  }

  return {
    // Estado
    tasks: readonly(tasks),
    isLoading: readonly(isLoading),
    error: readonly(error),
    taskStats,
    lastSyncTime: readonly(lastSyncTime),
    isAutoSyncEnabled: readonly(isAutoSyncEnabled),
    
    // Operaciones
    loadTasks,
    addTask,
    addSubTask,
    deleteTask,
    toggleComplete,
    toggleExpand,
    reorderTasks,
    updateTask,
    
    // Utilidades
    findTaskById,
    findTaskParent,
    clearError,
    refreshTasks,
    
    // Sincronización automática
    startAutoSync,
    stopAutoSync,
    toggleAutoSync,
    suspendAutoSync: readonly(suspendAutoSync),
    
    // Backup y recuperación
    createBackup,
    getLastBackupTime,
    
    // Integridad y reparación
    validateLocalIntegrity,
    repairLocalData
  }
}