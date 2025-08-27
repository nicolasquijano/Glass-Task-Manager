<template>
  <span
    :class="[
      'glass-tag',
      `glass-tag--${variant}`,
      `glass-tag--${size}`,
      { 
        'glass-tag--removable': removable,
        'glass-tag--interactive': interactive
      }
    ]"
    @click="handleClick"
  >
    <span class="glass-tag__text">{{ text }}</span>
    <button
      v-if="removable"
      @click.stop="handleRemove"
      class="glass-tag__remove"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="m18 6-12 12M6 6l12 12"/>
      </svg>
    </button>
  </span>
</template>

<script setup>
const props = defineProps({
  text: {
    type: String,
    required: true
  },
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'accent', 'success', 'warning', 'danger'].includes(value)
  },
  size: {
    type: String,
    default: 'sm',
    validator: (value) => ['xs', 'sm', 'md'].includes(value)
  },
  removable: {
    type: Boolean,
    default: false
  },
  interactive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click', 'remove']);

const handleClick = () => {
  if (props.interactive) {
    emit('click');
  }
};

const handleRemove = () => {
  emit('remove');
};
</script>

<style scoped>
.glass-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
  color: white;
}

/* Sizes */
.glass-tag--xs {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  border-radius: 4px;
}

.glass-tag--sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 6px;
}

.glass-tag--md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border-radius: 8px;
}

/* Variants - sin colores, solo transparencias */
.glass-tag--accent,
.glass-tag--success,
.glass-tag--warning,
.glass-tag--danger {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: white;
}

/* Interactive states */
.glass-tag--interactive {
  cursor: pointer;
}

.glass-tag--interactive:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.15);
}

.glass-tag--removable {
  padding-right: 0.375rem;
}

.glass-tag__text {
  font-family: var(--font-primary);
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.005em;
}

.glass-tag__remove {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.125rem;
  border-radius: 50%;
  color: currentColor;
  opacity: 0.7;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.glass-tag__remove:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.2);
}
</style>