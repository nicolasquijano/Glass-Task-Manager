// Pure Distortion Effect - Completely transparent with only distortion
class PureDistortion {
    constructor() {
        this.elements = [];
        this.time = 0;
        this.animationId = null;
    }

    init() {
        // Crear múltiples elementos de distorsión invisible
        for (let i = 0; i < 8; i++) {
            const element = document.createElement('div');
            element.style.position = 'fixed';
            element.style.width = '200px';
            element.style.height = '200px';
            element.style.pointerEvents = 'none';
            element.style.zIndex = '5';
            element.style.background = 'transparent';
            element.style.border = 'none';
            element.style.borderRadius = '50%';
            
            // Usar transform con filtros muy sutiles que solo distorsionen
            element.style.backdropFilter = 'saturate(100.1%) contrast(100.1%)';
            element.style.webkitBackdropFilter = 'saturate(100.1%) contrast(100.1%)';
            
            // Posición inicial aleatoria
            element.style.left = `${Math.random() * 100}%`;
            element.style.top = `${Math.random() * 100}%`;
            
            document.body.appendChild(element);
            this.elements.push({
                element: element,
                baseX: Math.random() * window.innerWidth,
                baseY: Math.random() * window.innerHeight,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                phase: Math.random() * Math.PI * 2
            });
        }

        this.animate();
        return true;
    }

    animate() {
        this.time += 0.01;

        this.elements.forEach((item, index) => {
            // Movimiento orgánico usando senos
            const x = item.baseX + Math.sin(this.time + item.phase) * 20 + item.speedX * this.time;
            const y = item.baseY + Math.cos(this.time * 0.7 + item.phase) * 15 + item.speedY * this.time;
            
            // Escala que varía sutilmente
            const scale = 1 + Math.sin(this.time * 2 + item.phase) * 0.1;
            
            // Aplicar transformación
            item.element.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
            
            // Mantener elementos en pantalla
            if (x < -200 || x > window.innerWidth + 200) {
                item.baseX = Math.random() * window.innerWidth;
                item.speedX *= -1;
            }
            if (y < -200 || y > window.innerHeight + 200) {
                item.baseY = Math.random() * window.innerHeight;
                item.speedY *= -1;
            }
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    start() {
        console.log('Pure Distortion iniciado');
        return this.init();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.elements.forEach(item => {
            if (item.element.parentNode) {
                item.element.parentNode.removeChild(item.element);
            }
        });
        this.elements = [];
    }
}

// Método alternativo: usar CSS transform sin backdrop-filter
class CSSDistortion {
    constructor() {
        this.container = null;
    }

    init() {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.pointerEvents = 'none';
        this.container.style.zIndex = '5';
        this.container.style.background = 'transparent';
        this.container.style.overflow = 'hidden';

        // Crear patrón de ondas usando CSS puro
        for (let i = 0; i < 12; i++) {
            const wave = document.createElement('div');
            wave.style.position = 'absolute';
            wave.style.width = '300px';
            wave.style.height = '300px';
            wave.style.borderRadius = '50%';
            wave.style.background = 'transparent';
            wave.style.border = '1px solid transparent';
            
            // Usar clip-path para crear distorsiones invisibles
            wave.style.clipPath = `ellipse(${50 + i * 5}% ${50 + i * 3}% at 50% 50%)`;
            wave.style.transform = `translate(-50%, -50%) scale(${1 + i * 0.1})`;
            
            wave.style.left = `${20 + (i * 7) % 60}%`;
            wave.style.top = `${20 + (i * 11) % 60}%`;
            
            // Animación personalizada para cada onda
            wave.style.animation = `
                distortWave${i} ${8 + i}s ease-in-out infinite,
                moveWave${i} ${15 + i * 2}s linear infinite
            `;
            
            this.container.appendChild(wave);
        }

        document.body.appendChild(this.container);
        this.addAnimations();
        return true;
    }

    addAnimations() {
        const style = document.createElement('style');
        let animations = '';
        
        for (let i = 0; i < 12; i++) {
            animations += `
                @keyframes distortWave${i} {
                    0% { clip-path: ellipse(${50 + i * 5}% ${50 + i * 3}% at 50% 50%); }
                    50% { clip-path: ellipse(${60 + i * 3}% ${40 + i * 5}% at ${45 + i * 2}% ${55 + i}%); }
                    100% { clip-path: ellipse(${50 + i * 5}% ${50 + i * 3}% at 50% 50%); }
                }
                
                @keyframes moveWave${i} {
                    0% { transform: translate(-50%, -50%) scale(${1 + i * 0.1}) rotate(0deg); }
                    25% { transform: translate(-52%, -48%) scale(${1.02 + i * 0.1}) rotate(${90 + i * 10}deg); }
                    50% { transform: translate(-48%, -52%) scale(${0.98 + i * 0.1}) rotate(${180 + i * 15}deg); }
                    75% { transform: translate(-52%, -48%) scale(${1.01 + i * 0.1}) rotate(${270 + i * 20}deg); }
                    100% { transform: translate(-50%, -50%) scale(${1 + i * 0.1}) rotate(${360 + i * 30}deg); }
                }
            `;
        }
        
        style.textContent = animations;
        document.head.appendChild(style);
    }

    start() {
        console.log('CSS Distortion iniciado');
        return this.init();
    }

    stop() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}

// Exportar ambas opciones
window.PureDistortion = PureDistortion;
window.CSSDistortion = CSSDistortion;