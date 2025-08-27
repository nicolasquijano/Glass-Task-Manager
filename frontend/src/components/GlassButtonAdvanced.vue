<template>
  <div class="button-container">
    <div class="button-wrap">
      <button @click="handleClick" :disabled="disabled">
        <span>{{ text }}</span>
      </button>
      <div class="button-shadow"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: 'Button'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click']);

const handleClick = (event) => {
  emit('click', event);
};
</script>

<style scoped>
@property --angle-1 { 
  syntax: "<angle>"; 
  inherits: false; 
  initial-value: -75deg; 
}

@property --angle-2 { 
  syntax: "<angle>"; 
  inherits: false; 
  initial-value: -45deg; 
}

.button-container {
  --global--size: 1rem;
  --anim--hover-time: 400ms;
  --anim--hover-ease: cubic-bezier(0.25, 1, 0.5, 1);
  font-size: var(--global--size);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button-wrap {
  position: relative;
  z-index: 2;
  border-radius: 999vw;
  background: transparent;
  pointer-events: none;
  transition: all var(--anim--hover-time) var(--anim--hover-ease);
}

.button-shadow {
  --shadow-cuttoff-fix: 2em;
  position: absolute;
  width: calc(100% + var(--shadow-cuttoff-fix));
  height: calc(100% + var(--shadow-cuttoff-fix));
  top: calc(0% - var(--shadow-cuttoff-fix) / 2);
  left: calc(0% - var(--shadow-cuttoff-fix) / 2);
  filter: blur(2px);
  overflow: visible;
  pointer-events: none;
}

.button-shadow::after {
  content: "";
  position: absolute;
  z-index: 0;
  inset: 0;
  border-radius: 999vw;
  background: linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1));
  width: calc(100% - var(--shadow-cuttoff-fix) - 0.25em);
  height: calc(100% - var(--shadow-cuttoff-fix) - 0.25em);
  top: calc(var(--shadow-cuttoff-fix) - 0.5em);
  left: calc(var(--shadow-cuttoff-fix) - 0.875em);
  padding: 0.125em;
  box-sizing: border-box;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  transition: all var(--anim--hover-time) var(--anim--hover-ease);
  overflow: visible;
  opacity: 1;
}

button {
  --border-width: clamp(1px, 0.0625em, 4px);
  all: unset;
  cursor: pointer;
  position: relative;
  pointer-events: auto;
  z-index: 3;
  background: linear-gradient(-75deg, rgba(255,255,255,0.1), rgba(255,255,255,0.3), rgba(255,255,255,0.1));
  border-radius: 999vw;
  box-shadow: inset 0 0.125em 0.125em rgba(0,0,0,0.05),
              inset 0 -0.125em 0.125em rgba(255,255,255,0.5),
              0 0.25em 0.125em -0.125em rgba(0,0,0,0.2),
              0 0 0.1em 0.25em inset rgba(255,255,255,0.2),
              0 0 0 0 rgba(255,255,255,1);
  backdrop-filter: blur(clamp(1px, 0.125em, 4px));
  -webkit-backdrop-filter: blur(clamp(1px, 0.125em, 4px));
  transition: all var(--anim--hover-time) var(--anim--hover-ease);
}

button:hover {
  transform: scale(0.975);
  backdrop-filter: blur(0.01em);
  -webkit-backdrop-filter: blur(0.01em);
  box-shadow: inset 0 0.125em 0.125em rgba(0,0,0,0.05),
              inset 0 -0.125em 0.125em rgba(255,255,255,0.5),
              0 0.15em 0.05em -0.1em rgba(0,0,0,0.25),
              0 0 0.05em 0.1em inset rgba(255,255,255,0.5),
              0 0 0 0 rgba(255,255,255,1);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

button span {
  position: relative;
  display: block;
  user-select: none;
  font-family: var(--font-primary);
  letter-spacing: -0.025em;
  font-weight: 500;
  font-size: 0.875em;
  color: rgba(255, 255, 255, 0.9);
  -webkit-font-smoothing: antialiased;
  text-shadow: 0 0.05em 0.05em rgba(0,0,0,0.3);
  transition: all var(--anim--hover-time) var(--anim--hover-ease);
  padding-inline: 1em;
  padding-block: 0.5em;
}

button:hover span { 
  text-shadow: 0.025em 0.025em 0.025em rgba(0,0,0,0.4); 
}

button span::after {
  content: "";
  display: block;
  position: absolute;
  z-index: 1;
  width: calc(100% - var(--border-width));
  height: calc(100% - var(--border-width));
  top: calc(0% + var(--border-width) / 2);
  left: calc(0% + var(--border-width) / 2);
  box-sizing: border-box;
  border-radius: 999vw;
  overflow: hidden;
  background: linear-gradient(var(--angle-2), rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 40% 50%, rgba(255,255,255,0) 55%);
  z-index: 3;
  mix-blend-mode: screen;
  pointer-events: none;
  background-size: 200% 200%;
  background-position: 0% 50%;
  background-repeat: no-repeat;
  transition: background-position calc(var(--anim--hover-time)*1.25) var(--anim--hover-ease), --angle-2 calc(var(--anim--hover-time)*1.25) var(--anim--hover-ease);
}

button:hover span::after { 
  background-position: 25% 50%; 
}

button:active span::after {
  background-position: 50% 15%;
  --angle-2: -15deg;
}

@media (hover: none) and (pointer: coarse) {
  button span::after,
  button:active span::after { 
    --angle-2: -45deg; 
  }
}

button::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(180, 240, 230, 0.15), transparent);
  pointer-events: none;
  mix-blend-mode: overlay;
}

button::after {
  content: "";
  position: absolute;
  z-index: 1;
  inset: 0;
  border-radius: 999vw;
  width: calc(100% + var(--border-width));
  height: calc(100% + var(--border-width));
  top: calc(0% - var(--border-width) / 2);
  left: calc(0% - var(--border-width) / 2);
  padding: var(--border-width);
  box-sizing: border-box;
  background: conic-gradient(from var(--angle-1) at 50% 50%, rgba(0,0,0,0.5), rgba(0,0,0,0) 5% 40%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 60% 95%, rgba(0,0,0,0.5)),
              linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.5));
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  transition: all var(--anim--hover-time) var(--anim--hover-ease), --angle-1 500ms ease;
  box-shadow: inset 0 0 0 calc(var(--border-width)/2) rgba(255,255,255,0.5);
}

button:hover::after { 
  --angle-1: -125deg; 
}

button:active::after { 
  --angle-1: -75deg; 
}

@media (hover: none) and (pointer: coarse) {
  button::after,
  button:hover::after,
  button:active::after { 
    --angle-1: -75deg; 
  }
}
</style>