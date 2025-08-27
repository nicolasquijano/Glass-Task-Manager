<template>
  <div class="floating-particles-container">
    <div 
      v-for="particle in particles" 
      :key="particle.id"
      class="floating-particle"
      :style="{
        left: particle.x + '%',
        top: particle.y + '%',
        width: particle.size + 'px',
        height: particle.size + 'px',
        animationDelay: particle.delay + 's',
        animationDuration: particle.duration + 's',
        opacity: particle.opacity
      }"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  count: {
    type: Number,
    default: 15
  },
  minSize: {
    type: Number,
    default: 4
  },
  maxSize: {
    type: Number,
    default: 12
  }
});

const particles = ref([]);

const generateParticles = () => {
  particles.value = [];
  
  for (let i = 0; i < props.count; i++) {
    particles.value.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (props.maxSize - props.minSize) + props.minSize,
      delay: Math.random() * 5,
      duration: Math.random() * 5 + 6,
      opacity: Math.random() * 0.3 + 0.1
    });
  }
};

onMounted(() => {
  generateParticles();
});
</script>

<style scoped>
.floating-particles-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-particle {
  position: absolute;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 70%, transparent 100%);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
  filter: blur(1px);
}

@keyframes float {
  0%, 100% { 
    transform: translateY(0px) translateX(0px) rotate(0deg); 
  }
  25% { 
    transform: translateY(-20px) translateX(10px) rotate(90deg); 
  }
  50% { 
    transform: translateY(-10px) translateX(-5px) rotate(180deg); 
  }
  75% { 
    transform: translateY(-30px) translateX(15px) rotate(270deg); 
  }
}
</style>