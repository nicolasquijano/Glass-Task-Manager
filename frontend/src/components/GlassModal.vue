<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div v-if="show" class="glass-modal-overlay" @click="handleOverlayClick">
        <div class="glass-modal" @click.stop>
          <div class="glass-modal__header" v-if="$slots.header || title">
            <slot name="header">
              <h2 v-if="title" class="font-display text-xl font-semibold text-white glass-text-glow">{{ title }}</h2>
            </slot>
            <button 
              v-if="closable"
              @click="handleClose" 
              class="glass-modal__close text-white/60 hover:text-white transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m18 6-12 12M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <div class="glass-modal__content">
            <slot></slot>
          </div>
          
          <div v-if="$slots.footer" class="glass-modal__footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  closable: {
    type: Boolean,
    default: true
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close']);

const handleClose = () => {
  emit('close');
};

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleClose();
  }
};

// Lock body scroll when modal is open
watch(() => props.show, (newShow) => {
  if (newShow) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.glass-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.glass-modal {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.glass-modal__header {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: between;
}

.glass-modal__close {
  margin-left: auto;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.glass-modal__close:hover {
  background: rgba(255, 255, 255, 0.1);
}

.glass-modal__content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}

.glass-modal__footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .glass-modal,
.modal-leave-to .glass-modal {
  transform: scale(0.95) translateY(10px);
}

.modal-enter-to .glass-modal,
.modal-leave-from .glass-modal {
  transform: scale(1) translateY(0);
}
</style>