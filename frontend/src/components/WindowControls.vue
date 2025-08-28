<template>
  <div class="window-controls">
    <div class="window-title">
      <span class="text-white/90 font-ui text-sm">Glass Monitor</span>
    </div>
    
    <div class="controls-group">
      <button 
        @click="toggleTheme"
        class="control-btn theme-btn"
        :title="`Tema actual: ${currentTheme === 'dark' ? 'OSCURO' : 'CLARO'} - Click para cambiar a ${currentTheme === 'dark' ? 'claro' : 'oscuro'}`"
      >
        <span class="theme-emoji">{{ currentTheme === 'dark' ? '☀️' : '🌙' }}</span>
      </button>

      <button 
        @click="toggleAlwaysOnTop"
        :class="['control-btn', { 'is-active': isAlwaysOnTop }]"
        title="Siempre arriba"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M7.5 1.5C7.5 1.22386 7.27614 1 7 1H5C4.72386 1 4.5 1.22386 4.5 1.5V5.5H3.5C3.22386 5.5 3 5.72386 3 6C3 6.27614 3.22386 6.5 3.5 6.5H8.5C8.77614 6.5 9 6.27614 9 6C9 5.72386 8.77614 5.5 8.5 5.5H7.5V1.5Z M6 8.5L4 10.5H8L6 8.5Z"/>
        </svg>
      </button>

      <button 
        @click="minimizeWindow"
        class="control-btn control-btn--minimize"
        title="Minimizar"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 6h8v1H2z"/>
        </svg>
      </button>
      
      <button 
        @click="toggleMaximize"
        class="control-btn control-btn--maximize"
        title="Maximizar"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 2v8h8V2H2zm7 7H3V3h6v6z"/>
        </svg>
      </button>
      
      <button 
        @click="closeWindow"
        class="control-btn control-btn--close"
        title="Cerrar"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6.707 6l3.147-3.146-.707-.708L6 5.293 2.854 2.146l-.708.708L5.293 6 2.146 9.146l.708.708L6 6.707l3.146 3.147.708-.708L6.707 6z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { WindowMinimise, WindowToggleMaximise, Quit } from '../../wailsjs/runtime';
import { ToggleAlwaysOnTop, IsAlwaysOnTop } from '../../wailsjs/go/main/App';
import { useThemeDetection } from '../composables/useThemeDetection.js';

const isAlwaysOnTop = ref(false);

// Usar composable de detección de tema
const { currentTheme, setTheme } = useThemeDetection();

onMounted(async () => {
  isAlwaysOnTop.value = await IsAlwaysOnTop();
});

const minimizeWindow = () => {
  WindowMinimise();
};

const toggleMaximize = () => {
  WindowToggleMaximise();
};

const closeWindow = () => {
  Quit();
};

const toggleAlwaysOnTop = async () => {
  await ToggleAlwaysOnTop();
  isAlwaysOnTop.value = await IsAlwaysOnTop();
};

// Toggle manual de tema
const toggleTheme = () => {
  console.log('🔄 Toggle tema clicked - tema actual:', currentTheme.value);
  console.log('🔄 Body classes antes del toggle:', document.body.className);
  
  const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
  
  console.log('🔄 Tema cambiado manualmente a:', newTheme);
  console.log('🔄 Body classes después del toggle:', document.body.className);
};
</script>

<style scoped>
.window-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 8px 0 12px;
  background: transparent;
  user-select: none;
  position: relative;
  z-index: 100;
  width: 100%;
  cursor: move;
  --wails-draggable: drag;
}

.window-title {
  flex: 1;
  display: flex;
  align-items: center;
  height: 100%;
  pointer-events: none;
}

.controls-group {
  display: flex;
  align-items: center;
  gap: 4px;
  --wails-draggable: no-drag;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 20px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0;
  --wails-draggable: no-drag;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 1);
}

.control-btn.is-active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.control-btn--close:hover {
  background: #e81123;
  color: white;
}

.control-btn--maximize:hover {
  background: rgba(255, 255, 255, 0.15);
}

.control-btn--minimize:hover {
  background: rgba(255, 255, 255, 0.15);
}

.control-btn svg {
  pointer-events: none;
}

/* Estilo Windows 11 */
.control-btn {
  position: relative;
  overflow: hidden;
}

.control-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.control-btn:active::before {
  width: 100%;
  height: 100%;
}

/* Estilos específicos para botón de tema */
.theme-btn .theme-emoji {
  font-size: 11px;
  font-family: 'Segoe UI Emoji', sans-serif;
  transition: transform 0.2s ease;
}

.theme-btn:hover .theme-emoji {
  transform: scale(1.1);
}

.theme-btn {
  position: relative;
}

.theme-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 4px;
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.theme-btn:hover::after {
  opacity: 1;
}
</style>