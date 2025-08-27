<template>
  <button 
    :class="[
      'glass-button',
      `glass-button--${variant}`,
      `glass-button--${size}`,
      { 'glass-button--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="glass-button__loader"></span>
    <slot v-else></slot>
  </button>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'accent', 'success', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event);
  }
};
</script>

<style scoped>
.glass-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-primary);
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  user-select: none;
  position: relative;
  cursor: pointer;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 5px rgba(255, 255, 255, 0.3);
  letter-spacing: -0.01em;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 8px rgba(255, 255, 255, 0.15);
}

.glass-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

/* Sizes */
.glass-button--xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 50%;
  min-width: 24px;
  min-height: 24px;
  width: 24px;
  height: 24px;
}

.glass-button--sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
}

.glass-button--md {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 8px;
}

.glass-button--lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
  border-radius: 10px;
}

/* Variants - ultra transparente con brillo suave constante */
.glass-button--accent,
.glass-button--success,
.glass-button--danger {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 0 12px rgba(255, 255, 255, 0.2);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 0 8px rgba(255, 255, 255, 0.4);
}

.glass-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 0 20px rgba(255, 255, 255, 0.4),
    0 0 40px rgba(255, 255, 255, 0.2);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.glass-button--accent:hover:not(:disabled),
.glass-button--success:hover:not(:disabled),
.glass-button--danger:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.4),
    0 0 25px rgba(255, 255, 255, 0.6),
    0 0 50px rgba(255, 255, 255, 0.3);
  text-shadow: 0 0 15px rgba(255, 255, 255, 1);
  transform: scale(1.02);
}

/* Loading state */
.glass-button--loading {
  pointer-events: none;
}

.glass-button__loader {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Shimmer effect removido */
</style>