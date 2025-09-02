<template>
  <div>
    <!-- Tarea principal -->
    <div
      class="flex items-center gap-2 p-2 mb-1 rounded-lg backdrop-blur-sm transition-all duration-200"
      :class="{ 'opacity-50 scale-95': isDragging }"
      :style="{ 
        background: isDragOver ? 'var(--bg-glass-hover)' : 'var(--bg-glass)', 
        border: '1px solid ' + (isDragOver ? 'var(--border-glass-hover)' : 'var(--border-glass)'),
        paddingLeft: `${12 + task.level * 16}px`
      }"
      draggable="true"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover.prevent="handleDragOver"
      @dragleave="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- Botón expandir/contraer -->
      <button
        v-if="task.children && task.children.length > 0"
        @click.stop="toggleExpand"
        class="w-4 h-4 flex-shrink-0 text-xs pointer-events-auto transition-colors duration-200"
        :style="{ color: 'var(--text-secondary)' }"
        @dragstart.prevent
        @mouseenter="$event.target.style.color = 'var(--text-primary)'"
        @mouseleave="$event.target.style.color = 'var(--text-secondary)'"
      >
        {{ task.isExpanded ? '▼' : '▶' }}
      </button>
      <div v-else class="w-4"></div>

      <!-- Checkbox -->
      <input
        type="checkbox"
        :checked="task.completed"
        @change.stop="$emit('toggle-complete', task)"
        class="w-4 h-4 bg-transparent rounded text-white focus:ring-white/50 flex-shrink-0 pointer-events-auto border-0"
        @dragstart.prevent
      />

      <!-- Texto de la tarea -->
      <input
        v-if="isEditing"
        v-model="editText"
        @blur="finishEdit"
        @keydown.enter="finishEdit"
        @keydown.escape="cancelEdit"
        ref="editInput"
        class="font-ui text-sm flex-1 bg-transparent border-0 outline-none transition-colors duration-200"
        :style="{ 
          color: task.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
          textDecoration: task.completed ? 'line-through' : 'none' 
        }"
      />
      <span
        v-else
        class="font-ui text-sm flex-1 truncate cursor-pointer transition-colors duration-200"
        :style="{ 
          color: task.completed ? 'var(--text-muted)' : 'var(--text-secondary)',
          textDecoration: task.completed ? 'line-through' : 'none' 
        }"
        @dblclick="startEdit"
      >
        {{ task.text }}
      </span>

      <!-- Botones de acción -->
      <div class="flex gap-1 flex-shrink-0 pointer-events-auto" @dragstart.prevent>
        <!-- Botón añadir subtarea -->
        <GlassButton
          size="xs"
          variant="success"
          @click.stop="showAddSubTask = !showAddSubTask"
          class="opacity-70 hover:opacity-100"
        >
          +
        </GlassButton>

        <!-- Botón eliminar -->
        <GlassButton
          size="xs"
          variant="danger"
          @click.stop="$emit('delete-task', task.id)"
          class="opacity-70 hover:opacity-100"
        >
          ×
        </GlassButton>
      </div>
    </div>

    <!-- Formulario para añadir subtarea -->
    <div
      v-if="showAddSubTask"
      class="mb-2"
      :style="{ paddingLeft: `${28 + task.level * 16}px` }"
    >
      <form @submit.prevent="addSubTask" class="space-y-2">
        <div class="flex gap-2">
          <input
            v-model="newSubTaskText"
            type="text"
            placeholder="Nueva subtarea..."
            :disabled="isAddingSubTask"
            class="flex-1 text-xs px-2 py-1 rounded bg-transparent text-white placeholder-white/80 border-0 focus:outline-none disabled:opacity-50"
            :class="{ 'border-red-500': addSubTaskError }"
            @keydown.escape="cancelAddSubTask"
            ref="subTaskInput"
            maxlength="500"
          />
          <button
            type="submit"
            :disabled="isAddingSubTask || !newSubTaskText.trim()"
            class="px-2 py-1 text-xs bg-transparent text-gradient-subtle rounded-full hover:bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isAddingSubTask ? '⋯' : '✓' }}
          </button>
          <button
            type="button"
            @click="cancelAddSubTask"
            :disabled="isAddingSubTask"
            class="px-2 py-1 text-xs bg-transparent text-gradient-subtle rounded-full hover:bg-transparent disabled:opacity-50"
          >
            ✕
          </button>
        </div>
        
        <!-- Error message -->
        <div 
          v-if="addSubTaskError" 
          class="text-xs text-red-400 px-2"
        >
          {{ addSubTaskError }}
        </div>
        
        <!-- Character counter -->
        <div 
          v-if="newSubTaskText.length > 400" 
          class="text-xs px-2"
          :class="newSubTaskText.length > 500 ? 'text-red-400' : 'text-yellow-400'"
        >
          {{ newSubTaskText.length }}/500 caracteres
        </div>
      </form>
    </div>

    <!-- Subtareas (renderizado recursivo) -->
    <div v-if="task.isExpanded && task.children && task.children.length > 0">
      <TreeTask
        v-for="child in task.children"
        :key="child.id"
        :task="child"
        @toggle-complete="$emit('toggle-complete', $event)"
        @delete-task="$emit('delete-task', $event)"
        @add-subtask="$emit('add-subtask', $event)"
        @toggle-expand="$emit('toggle-expand', $event)"
        @reorder-tasks="$emit('reorder-tasks', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';
import GlassButton from './GlassButton.vue';

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['toggle-complete', 'delete-task', 'add-subtask', 'toggle-expand', 'reorder-tasks', 'edit-task']);

const showAddSubTask = ref(false);
const newSubTaskText = ref('');
const subTaskInput = ref(null);
const isDragging = ref(false);
const isDragOver = ref(false);
const isEditing = ref(false);
const editText = ref('');
const editInput = ref(null);
const isAddingSubTask = ref(false);
const addSubTaskError = ref('');

// Global drag state - shared between all TreeTask instances
if (!window.dragState) {
  window.dragState = {
    draggedTask: null,
    isDragging: false
  };
}

async function toggleExpand() {
  emit('toggle-expand', props.task.id);
}

async function addSubTask() {
  const trimmedText = newSubTaskText.value.trim();
  if (trimmedText === '') {
    addSubTaskError.value = 'Por favor ingresa el texto de la subtarea';
    return;
  }

  if (trimmedText.length > 500) {
    addSubTaskError.value = 'El texto es demasiado largo (máximo 500 caracteres)';
    return;
  }

  isAddingSubTask.value = true;
  addSubTaskError.value = '';

  try {
    await emit('add-subtask', {
      parentId: props.task.id,
      text: trimmedText
    });

    // Reset form on success
    newSubTaskText.value = '';
    showAddSubTask.value = false;
    addSubTaskError.value = '';
  } catch (error) {
    addSubTaskError.value = error.message || 'Error al crear la subtarea';
    console.error('Error in TreeTask addSubTask:', error);
  } finally {
    isAddingSubTask.value = false;
  }
}

function cancelAddSubTask() {
  newSubTaskText.value = '';
  showAddSubTask.value = false;
  addSubTaskError.value = '';
  isAddingSubTask.value = false;
}

// Auto-focus when showing add subtask form
async function focusInput() {
  if (showAddSubTask.value) {
    await nextTick();
    subTaskInput.value?.focus();
  }
}

// Drag and Drop functions
function handleDragStart(event) {
  event.stopPropagation();
  isDragging.value = true;
  window.dragState.draggedTask = props.task;
  window.dragState.isDragging = true;
  
  // Set drag data
  event.dataTransfer.setData('text/plain', props.task.id.toString());
  event.dataTransfer.effectAllowed = 'move';
  
  // Create a custom drag image to avoid showing child elements
  const dragImage = document.createElement('div');
  dragImage.textContent = props.task.text;
  dragImage.style.cssText = 'position: absolute; top: -1000px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 14px;';
  document.body.appendChild(dragImage);
  event.dataTransfer.setDragImage(dragImage, 0, 0);
  setTimeout(() => document.body.removeChild(dragImage), 0);
  
  console.log('Drag started:', props.task.id, 'parentId:', props.task.parentId);
}

function handleDragEnd(event) {
  event.stopPropagation();
  isDragging.value = false;
  window.dragState.draggedTask = null;
  window.dragState.isDragging = false;
  console.log('Drag ended');
}

function handleDragOver(event) {
  const draggedTask = window.dragState.draggedTask;
  if (draggedTask && draggedTask.id !== props.task.id) {
    // Check if both tasks have the same parent (both null/undefined or same value)
    const sameParent = (draggedTask.parentId === null || draggedTask.parentId === undefined) 
      ? (props.task.parentId === null || props.task.parentId === undefined)
      : draggedTask.parentId === props.task.parentId;
    
    if (sameParent) {
      event.preventDefault();
      event.stopPropagation();
      isDragOver.value = true;
      event.dataTransfer.dropEffect = 'move';
      console.log('Drag over valid target:', props.task.id);
    }
  }
}

function handleDragLeave(event) {
  isDragOver.value = false;
}

function handleDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  isDragOver.value = false;
  
  const draggedTask = window.dragState.draggedTask;
  if (draggedTask && draggedTask.id !== props.task.id) {
    // Check if both tasks have the same parent
    const sameParent = (draggedTask.parentId === null || draggedTask.parentId === undefined) 
      ? (props.task.parentId === null || props.task.parentId === undefined)
      : draggedTask.parentId === props.task.parentId;
    
    if (sameParent) {
      console.log('Drop:', draggedTask.id, 'onto', props.task.id, 'parentId:', props.task.parentId);
      emit('reorder-tasks', {
        draggedTaskId: draggedTask.id,
        targetTaskId: props.task.id,
        parentId: props.task.parentId
      });
    }
  }
}

// Funciones de edición
function startEdit() {
  isEditing.value = true;
  editText.value = props.task.text;
  nextTick(() => {
    editInput.value?.focus();
    editInput.value?.select();
  });
}

function finishEdit() {
  if (editText.value.trim() && editText.value !== props.task.text) {
    emit('edit-task', { id: props.task.id, text: editText.value.trim() });
  }
  isEditing.value = false;
  editText.value = '';
}

function cancelEdit() {
  isEditing.value = false;
  editText.value = '';
}

// Watch for showAddSubTask changes to auto-focus
import { watch } from 'vue';
watch(showAddSubTask, focusInput);
</script>

<style scoped>
/* Checkbox con recuadro adaptativo */
input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  background-color: var(--checkbox-bg);
  border: 1px solid var(--checkbox-border);
  border-radius: 4px;
  cursor: pointer;
  position: relative;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

input[type="checkbox"]:checked {
  background-color: var(--checkbox-checked-bg);
  border: 1px solid var(--checkbox-checked-border);
}

input[type="checkbox"]:checked::after {
  content: '✓';
  font-size: 0.7rem;
  color: var(--text-primary);
  text-shadow: var(--text-shadow-main);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  line-height: 1;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}
</style>