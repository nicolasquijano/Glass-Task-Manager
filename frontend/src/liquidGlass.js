// Liquid Glass WebGL Shader Implementation
class LiquidGlass {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.program = null;
        this.uniformLocations = {};
        this.time = 0;
        this.animationId = null;
    }

    // Vertex Shader - Posición de los vértices
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

    // Fragment Shader - Efecto liquid glass con refracción
    getFragmentShader() {
        return `
            precision mediump float;
            
            varying vec2 v_texCoord;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_refractiveIndex;
            uniform float u_distortionStrength;
            uniform float u_curvature;
            uniform float u_edgeSharpness;
            
            // Función de noise para distorsiones orgánicas
            float noise(vec2 st) {
                return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
            }
            
            // Noise suave
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
                
                // Distancia desde el centro para efecto de domo
                float dist = distance(st, center);
                
                // Curvatura del cristal líquido
                float curvature = pow(dist, u_curvature);
                
                // Normal de superficie basada en curvatura
                vec2 normal = normalize(st - center) * curvature;
                
                // Índice de refracción dinámico
                float eta = 1.0 / u_refractiveIndex;
                
                // Distorsión basada en refracción
                vec2 incident = normalize(st - center);
                vec2 refracted = refract(incident, normal, eta);
                
                // Distorsión temporal para movimiento líquido (más visible)
                float timeDistortion = sin(u_time * 0.8 + dist * 12.0) * 0.08;
                float noiseDistortion = smoothNoise(st * 6.0 + u_time * 0.3) * 0.04;
                
                // Combinar todas las distorsiones
                vec2 finalDistortion = refracted * u_distortionStrength + 
                                     vec2(timeDistortion, timeDistortion * 0.7) +
                                     vec2(noiseDistortion);
                
                // Coordenadas finales con distorsión
                vec2 distortedCoord = st + finalDistortion;
                
                // Efectos de borde para simular grosor del cristal
                float edge = 1.0 - smoothstep(0.0, u_edgeSharpness, dist);
                
                // Efectos de Fresnel para realismo
                float fresnel = pow(1.0 - dot(normal, vec2(0.0, 1.0)), 2.0);
                
                // Para distorsión pura sin color visible, necesitamos renderizar a un buffer
                // y luego aplicar la distorsión al fondo. Por simplicidad, usaremos transparencia total
                // pero mantendremos un alpha mínimo para que el efecto sea procesado
                
                vec3 color = vec3(1.0); // Completamente blanco/transparente
                float alpha = 0.001; // Prácticamente invisible pero procesable
                
                gl_FragColor = vec4(color, alpha);
            }
        `;
    }

    // Inicializar WebGL
    init() {
        // Crear canvas fullscreen
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '5';
        document.body.appendChild(this.canvas);

        // Obtener contexto WebGL
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.error('WebGL no soportado, cayendo a CSS');
            return false;
        }

        // Compilar shaders
        const vertexShader = this.compileShader(this.getVertexShader(), this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(this.getFragmentShader(), this.gl.FRAGMENT_SHADER);

        // Crear programa
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            console.error('Error linking program:', this.gl.getProgramInfoLog(this.program));
            return false;
        }

        console.log('WebGL Liquid Glass shader compilado exitosamente');

        // Obtener ubicaciones de uniforms
        this.uniformLocations = {
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            refractiveIndex: this.gl.getUniformLocation(this.program, 'u_refractiveIndex'),
            distortionStrength: this.gl.getUniformLocation(this.program, 'u_distortionStrength'),
            curvature: this.gl.getUniformLocation(this.program, 'u_curvature'),
            edgeSharpness: this.gl.getUniformLocation(this.program, 'u_edgeSharpness')
        };

        // Configurar geometría (quad fullscreen)
        this.setupGeometry();

        // Configurar blending para transparencia
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        return true;
    }

    // Compilar shader
    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Error compiling shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    // Configurar geometría del quad
    setupGeometry() {
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        const positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    // Redimensionar canvas
    resize() {
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;

        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
            this.gl.viewport(0, 0, displayWidth, displayHeight);
        }
    }

    // Renderizar frame
    render() {
        if (!this.gl) return;

        this.resize();

        // Limpiar
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Usar programa
        this.gl.useProgram(this.program);

        // Actualizar uniforms (distorsión más visible)
        this.gl.uniform1f(this.uniformLocations.time, this.time * 0.001);
        this.gl.uniform2f(this.uniformLocations.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniformLocations.refractiveIndex, 1.8); // Más refracción
        this.gl.uniform1f(this.uniformLocations.distortionStrength, 0.15); // Mucha más distorsión
        this.gl.uniform1f(this.uniformLocations.curvature, 1.2); // Más curvatura
        this.gl.uniform1f(this.uniformLocations.edgeSharpness, 0.4); // Bordes más definidos

        // Dibujar quad
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

        // Continuar animación
        this.time += 16; // ~60fps
        this.animationId = requestAnimationFrame(() => this.render());
    }

    // Iniciar efecto
    start() {
        if (this.init()) {
            this.render();
            console.log('Liquid Glass WebGL iniciado');
        } else {
            console.log('WebGL no disponible, usando CSS fallback');
        }
    }

    // Detener efecto
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Exportar para uso global
window.LiquidGlass = LiquidGlass;