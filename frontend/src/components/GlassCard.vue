<template>
  <div 
    :class="[
      'glass-card',
      `glass-card--${variant}`,
      { 'glass-card--interactive': interactive }
    ]"
    class="p-4 transition-all duration-300"
    @click="handleClick"
  >
    <div class="flex items-center justify-between mb-3" v-if="$slots.header || title">
      <slot name="header">
        <h3 v-if="title" class="font-display text-lg font-semibold text-gradient-bright glass-text">{{ title }}</h3>
      </slot>
      <slot name="actions"></slot>
    </div>
    
    <div class="glass-card__content">
      <slot></slot>
    </div>
    
    <div class="flex items-center justify-between mt-3" v-if="$slots.footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'accent', 'success', 'light', 'dark'].includes(value)
  },
  title: {
    type: String,
    default: ''
  },
  interactive: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const handleClick = (event) => {
  if (props.interactive) {
    emit('click', event);
  }
};
</script>

<style scoped>
/* Sin tarjetas - completamente transparente */
.glass-card {
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.glass-card--accent,
.glass-card--success,
.glass-card--light,
.glass-card--dark,
.glass-card--interactive {
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.glass-card--interactive:hover {
  background: transparent;
  border: none;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transform: none;
}

.glass-card__content {
  position: relative;
  z-index: 1;
}
</style>