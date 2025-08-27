<template>
  <Teleport to="body">
    <div class="glass-toast-container">
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'glass-toast',
            `glass-toast--${toast.type}`
          ]"
        >
          <div class="glass-toast__icon">
            <svg v-if="toast.type === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            <svg v-else-if="toast.type === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m15 9-6 6M9 9l6 6"/>
            </svg>
            <svg v-else-if="toast.type === 'warning'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
              <path d="M12 9v4M12 17h.01"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          
          <div class="glass-toast__content">
            <div v-if="toast.title" class="glass-toast__title">{{ toast.title }}</div>
            <div class="glass-toast__message">{{ toast.message }}</div>
          </div>
          
          <button
            v-if="toast.closable"
            @click="removeToast(toast.id)"
            class="glass-toast__close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m18 6-12 12M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const toasts = ref([]);

const addToast = (toast) => {
  const id = Date.now() + Math.random();
  const newToast = {
    id,
    type: 'info',
    closable: true,
    duration: 4000,
    ...toast
  };
  
  toasts.value.push(newToast);
  
  if (newToast.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }
  
  return id;
};

const removeToast = (id) => {
  const index = toasts.value.findIndex(toast => toast.id === id);
  if (index > -1) {
    toasts.value.splice(index, 1);
  }
};

const clearToasts = () => {
  toasts.value = [];
};

// Expose methods for external use
defineExpose({
  addToast,
  removeToast,
  clearToasts
});

// Global toast methods
onMounted(() => {
  window.$toast = {
    success: (message, options = {}) => addToast({ message, type: 'success', ...options }),
    error: (message, options = {}) => addToast({ message, type: 'error', ...options }),
    warning: (message, options = {}) => addToast({ message, type: 'warning', ...options }),
    info: (message, options = {}) => addToast({ message, type: 'info', ...options })
  };
});
</script>

<style scoped>
.glass-toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.glass-toast {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 400px;
  pointer-events: auto;
  color: white;
}

.glass-toast--success {
  border-color: rgba(34, 197, 94, 0.15);
  background: rgba(34, 197, 94, 0.04);
  color: rgba(134, 239, 172, 1);
}

.glass-toast--error {
  border-color: rgba(239, 68, 68, 0.15);
  background: rgba(239, 68, 68, 0.04);
  color: rgba(252, 165, 165, 1);
}

.glass-toast--warning {
  border-color: rgba(245, 158, 11, 0.15);
  background: rgba(245, 158, 11, 0.04);
  color: rgba(253, 230, 138, 1);
}

.glass-toast__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.glass-toast__content {
  flex: 1;
  min-width: 0;
}

.glass-toast__title {
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  letter-spacing: -0.01em;
}

.glass-toast__message {
  font-family: var(--font-primary);
  font-size: 0.875rem;
  opacity: 0.9;
  line-height: 1.4;
  letter-spacing: -0.005em;
}

.glass-toast__close {
  flex-shrink: 0;
  padding: 0.25rem;
  border-radius: 6px;
  color: currentColor;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.glass-toast__close:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

/* Toast animations */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

.toast-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>