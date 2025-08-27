// Liquid Glass Distortion Effect - Pure distortion without visual elements
class LiquidGlassDistortion {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.uniformLocations = {};
        this.time = 0;
        this.animationId = null;
        this.distortionLayer = null;
    }

    // Fragment Shader que solo calcula distorsiones
    getFragmentShader() {
        return `
            precision mediump float;
            
            varying vec2 v_texCoord;
            uniform float u_time;
            uniform vec2 u_resolution;
            
            // Función de noise para distorsiones orgánicas
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            float smoothNoise(vec2 st) {
                vec2 i = floor(st);
                vec2 f = fract(st);
                
                float a = noise(i);
                float b = noise(i + vec2(1.0, 0.0));
                float c = noise(i + vec2(0.0, 1.0));
                float d = noise(i + vec2(1.0, 1.0));
                
                vec2 u = f * f * (3.0 - 2.0 * f);
                
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            
            void main() {
                vec2 st = v_texCoord;
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(st, center);
                
                // Calcular distorsiones
                float curvature = pow(dist, 0.8);
                vec2 normal = normalize(st - center) * curvature;
                
                // Refracción
                float eta = 1.0 / 1.8;
                vec2 incident = normalize(st - center);
                vec2 refracted = refract(incident, normal, eta);
                
                // Distorsiones temporales
                float timeDistortion = sin(u_time * 0.8 + dist * 12.0) * 0.1;
                float noiseDistortion = smoothNoise(st * 6.0 + u_time * 0.3) * 0.05;
                
                // Distorsión final
                vec2 finalDistortion = refracted * 0.2 + 
                                     vec2(timeDistortion, timeDistortion * 0.7) +
                                     vec2(noiseDistortion);
                
                // Convertir distorsión a coordenadas CSS
                vec2 cssDistortion = finalDistortion * 100.0; // Escalar para CSS
                
                // Codificar en color para leer desde CSS
                gl_FragColor = vec4(cssDistortion.x + 0.5, cssDistortion.y + 0.5, 0.0, 1.0);
            }
        `;
    }

    getVertexShader() {
        return `
            attribute vec2 a_position;
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = (a_position + 1.0) * 0.5;
            }
        `;
    }

    init() {
        // Crear capa de distorsión CSS
        this.createDistortionLayer();
        
        return true; // Usar solo CSS para simplicidad
    }

    createDistortionLayer() {
        this.distortionLayer = document.createElement('div');
        this.distortionLayer.style.position = 'fixed';
        this.distortionLayer.style.top = '0';
        this.distortionLayer.style.left = '0';
        this.distortionLayer.style.width = '100%';
        this.distortionLayer.style.height = '100%';
        this.distortionLayer.style.pointerEvents = 'none';
        this.distortionLayer.style.zIndex = '5';
        this.distortionLayer.style.background = 'transparent';
        
        // Aplicar backdrop-filter con animación CSS
        this.distortionLayer.style.backdropFilter = `
            blur(0px) 
            saturate(105%) 
            contrast(102%)
            brightness(101%)
            hue-rotate(1deg)
        `;
        this.distortionLayer.style.webkitBackdropFilter = this.distortionLayer.style.backdropFilter;
        
        // Agregar múltiples capas de distorsión
        for (let i = 0; i < 3; i++) {
            const layer = document.createElement('div');
            layer.style.position = 'absolute';
            layer.style.inset = '0';
            layer.style.background = 'transparent';
            layer.style.backdropFilter = `blur(${0.5 + i * 0.5}px)`;
            layer.style.webkitBackdropFilter = layer.style.backdropFilter;
            layer.style.transform = `translate(${Math.sin(i) * 2}px, ${Math.cos(i) * 2}px)`;
            layer.style.animation = `liquidDistort${i} ${8 + i * 2}s ease-in-out infinite`;
            this.distortionLayer.appendChild(layer);
        }
        
        document.body.appendChild(this.distortionLayer);
        
        // Agregar animaciones CSS
        this.addDistortionAnimations();
    }

    addDistortionAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes liquidDistort0 {
                0% { transform: translate(0px, 0px) scale(1); backdrop-filter: blur(0.5px); }
                33% { transform: translate(2px, -1px) scale(1.002); backdrop-filter: blur(1px); }
                66% { transform: translate(-1px, 2px) scale(0.998); backdrop-filter: blur(0.3px); }
                100% { transform: translate(0px, 0px) scale(1); backdrop-filter: blur(0.5px); }
            }
            
            @keyframes liquidDistort1 {
                0% { transform: translate(0px, 0px) rotate(0deg); backdrop-filter: blur(1px); }
                25% { transform: translate(-1px, 1px) rotate(0.5deg); backdrop-filter: blur(1.5px); }
                50% { transform: translate(1px, -1px) rotate(-0.3deg); backdrop-filter: blur(0.8px); }
                75% { transform: translate(-1px, -1px) rotate(0.2deg); backdrop-filter: blur(1.2px); }
                100% { transform: translate(0px, 0px) rotate(0deg); backdrop-filter: blur(1px); }
            }
            
            @keyframes liquidDistort2 {
                0% { transform: translate(0px, 0px) scale(1); backdrop-filter: blur(1.5px) contrast(101%); }
                40% { transform: translate(1px, 2px) scale(1.001); backdrop-filter: blur(2px) contrast(102%); }
                80% { transform: translate(-2px, -1px) scale(0.999); backdrop-filter: blur(1px) contrast(100%); }
                100% { transform: translate(0px, 0px) scale(1); backdrop-filter: blur(1.5px) contrast(101%); }
            }
        `;
        document.head.appendChild(style);
    }

    start() {
        if (this.init()) {
            console.log('Liquid Glass Distortion (CSS) iniciado');
            return true;
        }
        return false;
    }

    stop() {
        if (this.distortionLayer && this.distortionLayer.parentNode) {
            this.distortionLayer.parentNode.removeChild(this.distortionLayer);
        }
    }
}

// Exportar
window.LiquidGlassDistortion = LiquidGlassDistortion;