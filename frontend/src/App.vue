<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { OnWindowFocus, OnWindowBlur } from '../wailsjs/go/main/App'
import { EventsOn } from '../wailsjs/runtime/runtime'
import { useTasks } from './composables/useTasks.js'
import { useThemeDetection } from './composables/useThemeDetection.js'
import GlassCard from './components/GlassCard.vue'
import GlassButton from './components/GlassButton.vue'
import GlassInput from './components/GlassInput.vue'
import GlassToast from './components/GlassToast.vue'
import TreeTask from './components/TreeTask.vue'
import WindowControls from './components/WindowControls.vue'

// Estado local solo para UI
const newTaskText = ref('')
const isWindowActive = ref(true)

// Usar composable optimizado para manejo de tareas
const {
  tasks,
  isLoading,
  error,
  taskStats,
  loadTasks,
  addTask: addTaskComposable,
  addSubTask: addSubTaskComposable,
  deleteTask: deleteTaskComposable,
  toggleComplete,
  toggleExpand,
  reorderTasks,
  updateTask,
  clearError,
  startAutoSync,
  stopAutoSync,
  isAutoSyncEnabled,
  createBackup,
  getLastBackupTime,
  validateLocalIntegrity,
  repairLocalData
} = useTasks()

// Usar composable para detección de tema (solo para botón manual)
const {
  setTheme
} = useThemeDetection()

// Event handlers para cleanup
let focusHandler, blurHandler, windowFocusHandler, windowBlurHandler

onMounted(async () => {
  console.log('📱 App.vue onMounted - iniciando...')
  console.log('  - Body classes al iniciar App:', document.body.className)
  
  // Cargar tareas al inicializar
  try {
    await loadTasks()
    
    // Validar integridad de datos locales
    const validation = validateLocalIntegrity()
    if (!validation.isValid) {
      console.warn('Problemas de integridad detectados:', validation.issues)
      window.$toast?.warning('Problemas de datos detectados. Reparando...')
      try {
        const result = await repairLocalData()
        window.$toast?.success(result)
      } catch (repairErr) {
        window.$toast?.error('Error al reparar datos: ' + repairErr.message)
      }
    }
    
  } catch (err) {
    window.$toast?.error('Error al cargar las tareas')
    console.error('Error loading tasks:', err)
  }
  
  // Iniciar sincronización automática solo después de que todo esté cargado
  setTimeout(() => {
    startAutoSync()
    console.log('🔄 Sistema de sincronización automática iniciado')
  }, 2000) // Esperar 2 segundos después de cargar las tareas
  
  // Detección automática deshabilitada - solo botón manual
  // startDetection(5000) // Deshabilitado
  
  // También aplicar tema inicial como fallback
  console.log('📱 App.vue aplicando tema dark como fallback...')
  setTheme('dark')
  
  // Configurar eventos de focus/blur de la ventana con cleanup
  focusHandler = (data) => {
    isWindowActive.value = true
  }
  
  blurHandler = (data) => {
    isWindowActive.value = false
  }
  
  windowFocusHandler = () => {
    isWindowActive.value = true
    OnWindowFocus()
  }
  
  windowBlurHandler = () => {
    isWindowActive.value = false
    OnWindowBlur()
  }
  
  // Registrar eventos
  EventsOn('window:focus', focusHandler)
  EventsOn('window:blur', blurHandler)
  window.addEventListener('focus', windowFocusHandler)
  window.addEventListener('blur', windowBlurHandler)
})

onUnmounted(() => {
  // Detener sincronización automática
  stopAutoSync()
  console.log('🔄 Sistema de sincronización automática detenido')
  
  // Cleanup event listeners para evitar memory leaks
  if (windowFocusHandler) {
    window.removeEventListener('focus', windowFocusHandler)
  }
  if (windowBlurHandler) {
    window.removeEventListener('blur', windowBlurHandler)
  }
})

// Funciones optimizadas usando el composable
const addTask = async () => {
  console.log('🐛 App.vue addTask called, newTaskText:', newTaskText.value)
  try {
    console.log('🐛 Calling addTaskComposable with:', newTaskText.value)
    await addTaskComposable(newTaskText.value)
    newTaskText.value = ''
    console.log('🐛 Task added successfully')
    window.$toast?.success('Tarea añadida')
  } catch (err) {
    console.error('🐛 Error in App.vue addTask:', err)
    window.$toast?.error(err.message)
  }
}

const addSubTask = async ({ parentId, text }) => {
  try {
    await addSubTaskComposable(parentId, text)
    window.$toast?.success('Subtarea añadida')
  } catch (err) {
    window.$toast?.error(err.message)
  }
}

const deleteTask = async (id) => {
  try {
    await deleteTaskComposable(id)
    window.$toast?.success('Tarea eliminada')
  } catch (err) {
    window.$toast?.error(err.message)
  }
}

const handleToggleComplete = async (task) => {
  try {
    await toggleComplete(task)
    window.$toast?.success(task.completed ? 'Completada' : 'Pendiente')
  } catch (err) {
    window.$toast?.error(err.message)
  }
}

const handleToggleExpand = async (taskId) => {
  try {
    await toggleExpand(taskId)
  } catch (err) {
    window.$toast?.error(err.message)
  }
}

const handleReorderTasks = async (params) => {
  try {
    await reorderTasks(params)
    window.$toast?.success('Tareas reordenadas')
  } catch (err) {
    window.$toast?.error(err.message)
  }
}

const handleEditTask = async ({ id, text }) => {
  try {
    await updateTask(id, { text })
    window.$toast?.success('Tarea actualizada')
  } catch (err) {
    window.$toast?.error(err.message)
  }
}
</script>

<template>
  <div class="w-full h-screen bg-transparent relative overflow-hidden">
    <!-- Controles de ventana personalizados -->
    <WindowControls />
    
    <div class="flex flex-col p-3 h-full pt-1">
      <!-- Formulario compacto -->
      <div class="mb-3 p-2">
        <form @submit.prevent="addTask" class="flex gap-2">
          <GlassInput
            v-model="newTaskText"
            placeholder="Nueva tarea..."
            class="flex-1"
          />
          <GlassButton variant="success" size="sm" type="submit">
            +
          </GlassButton>
        </form>
      </div>

      <!-- Lista de tareas jerárquica -->
      <div class="flex-1 p-2 overflow-y-auto mb-2">
        <div class="space-y-1 pb-14">
          <TreeTask
            v-for="task in tasks"
            :key="task.id"
            :task="task"
            @toggle-complete="handleToggleComplete"
            @delete-task="deleteTask"
            @add-subtask="addSubTask"
            @toggle-expand="handleToggleExpand"
            @reorder-tasks="handleReorderTasks"
            @edit-task="handleEditTask"
          />
          
          <div v-if="tasks.length === 0" class="text-center text-white/90 py-6">
            <div class="mb-3">
              <svg class="w-12 h-12 mx-auto text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" 
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p class="font-ui text-sm text-gradient-bright">No hay tareas</p>
            <p class="font-ui text-xs mt-1 text-gradient-subtle">Añade una nueva tarea</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notifications -->
    <GlassToast />
  </div>
</template>

<style>
/* Los estilos base del glassmorphism ya están en style.css */
</style>