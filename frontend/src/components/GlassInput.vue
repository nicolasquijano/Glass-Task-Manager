<template>
  <div class="glass-input-wrapper">
    <label v-if="label" :for="inputId" class="glass-input__label">
      {{ label }}
      <span v-if="required" class="text-red-400 ml-1">*</span>
    </label>
    
    <div class="relative">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :class="[
          'glass-input',
          'w-full px-4 py-3 text-white',
          { 'glass-input--error': error }
        ]"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
      />
      
      <div v-if="$slots.icon" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/90">
        <slot name="icon"></slot>
      </div>
    </div>
    
    <div v-if="error || hint" class="mt-2 text-sm">
      <p v-if="error" class="text-red-400">{{ error }}</p>
      <p v-else-if="hint" class="text-gradient-subtle">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue', 'focus', 'blur']);

const inputId = computed(() => `glass-input-${Math.random().toString(36).substr(2, 9)}`);

const handleInput = (event) => {
  emit('update:modelValue', event.target.value);
};

const handleFocus = (event) => {
  emit('focus', event);
};

const handleBlur = (event) => {
  emit('blur', event);
};
</script>

<style scoped>
.glass-input-wrapper {
  position: relative;
}

.glass-input__label {
  display: block;
  margin-bottom: 0.5rem;
  font-family: var(--font-primary);
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.005em;
}

/* Input ultra transparente */
.glass-input {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  outline: none;
}

.glass-input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.glass-input:focus {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.glass-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.glass-input--error {
  border-color: rgba(255, 255, 255, 0.4) !important;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 0 20px rgba(255, 255, 255, 0.2) !important;
}

.glass-input--error:focus {
  border-color: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: 
    blur(12px) 
    saturate(120%) 
    contrast(110%);
  -webkit-backdrop-filter: 
    blur(12px) 
    saturate(120%) 
    contrast(110%);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 25px rgba(255, 255, 255, 0.3) !important;
}

/* Floating label effect when focused */
.glass-input:focus + .glass-input__floating-label,
.glass-input:not(:placeholder-shown) + .glass-input__floating-label {
  transform: translateY(-1.5rem) scale(0.8);
  color: rgba(255, 255, 255, 0.9);
}
</style>