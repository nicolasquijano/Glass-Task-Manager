import { ref, onMounted, onUnmounted } from 'vue'

const currentTheme = ref('dark') // 'light' o 'dark'
const isDetecting = ref(false)

console.log('🎭 useThemeDetection.js cargado - currentTheme inicial:', currentTheme.value)

export function useThemeDetection() {
  let detectionInterval = null
  let lastTheme = 'dark'
  
  // Historial de detecciones para estabilización
  const detectionHistory = []
  const maxHistorySize = 5
  
  // Función mejorada para detectar luminancia del fondo usando Wails
  const detectBackgroundLuminance = async () => {
    try {
      // Método 1: Usar la función Go de Wails para sampling real de píxeles
      if (window.go && window.go.main && window.go.main.App) {
        const result = await window.go.main.App.DetectBackgroundLuminance()
        if (result && !result.error) {
          console.log('Luminancia detectada via Wails:', result.luminance, 'IsLight:', result.isLight)
          return result.luminance
        } else if (result && result.error) {
          console.warn('Error en detección Wails:', result.error)
        }
      }
      
      // Método 2: Fallback a Screen Capture API del navegador
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const screenLuminance = await detectUsingScreenCapture()
        if (screenLuminance !== null) {
          return screenLuminance
        }
      }
      
      // Método 3: Usar colores del sistema del navegador
      const systemLuminance = detectSystemColors()
      if (systemLuminance !== null) {
        return systemLuminance
      }
      
      // Método 4: Fallback final a media query
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
      console.log('Fallback final: Sistema prefiere tema:', mediaQuery.matches ? 'claro' : 'oscuro')
      return mediaQuery.matches ? 0.7 : 0.3
      
    } catch (error) {
      console.warn('Error detectando luminancia:', error)
      return 0.3 // Default a tema oscuro
    }
  }
  
  // Detección usando Screen Capture API
  const detectUsingScreenCapture = async () => {
    try {
      // Solo intentar si estamos en un entorno seguro (HTTPS o localhost)
      if (location.protocol !== 'https:' && !location.hostname.includes('localhost')) {
        return null
      }
      
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: { 
          mediaSource: 'screen',
          width: 100, 
          height: 100 
        } 
      })
      
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      return new Promise((resolve) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = 100
          canvas.height = 100
          
          setTimeout(() => {
            ctx.drawImage(video, 0, 0, 100, 100)
            const imageData = ctx.getImageData(0, 0, 100, 100)
            const luminance = calculateAverageLuminance(imageData.data)
            
            // Limpiar recursos
            stream.getTracks().forEach(track => track.stop())
            
            console.log('Luminancia detectada via screen capture:', luminance)
            resolve(luminance)
          }, 100)
        }
      })
      
    } catch (error) {
      console.log('Screen capture no disponible:', error.message)
      return null
    }
  }
  
  // Calcular luminancia promedio de datos de imagen
  const calculateAverageLuminance = (imageData) => {
    let totalLuminance = 0
    const pixelCount = imageData.length / 4
    
    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i] / 255
      const g = imageData[i + 1] / 255 
      const b = imageData[i + 2] / 255
      
      // Calcular luminancia relativa
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
      totalLuminance += luminance
    }
    
    return totalLuminance / pixelCount
  }
  
  // Detección usando colores del sistema
  const detectSystemColors = () => {
    try {
      // Crear elemento temporal para detectar color de fondo del sistema
      const detector = document.createElement('div')
      detector.style.cssText = `
        position: fixed;
        top: -1000px;
        left: -1000px;
        width: 100px;
        height: 100px;
        background: Canvas;
        color: CanvasText;
        z-index: -1000;
      `
      
      document.body.appendChild(detector)
      
      const styles = window.getComputedStyle(detector)
      const bgColor = styles.backgroundColor
      
      document.body.removeChild(detector)
      
      // Calcular luminancia del color de fondo
      const luminance = calculateLuminanceFromColor(bgColor)
      
      console.log('Luminancia detectada via colores sistema:', luminance, 'color:', bgColor)
      return luminance
      
    } catch (error) {
      console.warn('Error en detección de colores sistema:', error)
      return null
    }
  }
  
  // Calcular luminancia relativa de un color RGB
  const calculateLuminanceFromColor = (colorString) => {
    // Extraer valores RGB del string
    let r, g, b
    
    // Manejar rgb() y rgba()
    const rgbMatch = colorString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (rgbMatch) {
      [, r, g, b] = rgbMatch.map(Number)
    } else {
      // Fallback para otros formatos
      console.warn('Formato de color no reconocido:', colorString)
      return null
    }
    
    // Normalizar a 0-1
    r /= 255
    g /= 255
    b /= 255
    
    // Aplicar gamma correction
    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
    
    // Calcular luminancia relativa
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  
  // Aplicar tema basado en luminancia con estabilización
  const applyTheme = (luminance) => {
    const newTheme = luminance > 0.5 ? 'light' : 'dark'
    
    // Agregar al historial
    detectionHistory.push({ theme: newTheme, luminance, timestamp: Date.now() })
    
    // Mantener solo las últimas N detecciones
    if (detectionHistory.length > maxHistorySize) {
      detectionHistory.shift()
    }
    
    // Solo cambiar tema si hay consistencia en al menos 3 detecciones consecutivas
    if (detectionHistory.length >= 3) {
      const recentThemes = detectionHistory.slice(-3).map(d => d.theme)
      const isConsistent = recentThemes.every(theme => theme === newTheme)
      
      // Agregar hystéresis: requiere un cambio más significativo para cambiar tema
      const thresholdDifference = 0.15 // 15% de diferencia requerida
      let shouldChange = false
      
      if (isConsistent && newTheme !== lastTheme) {
        const avgLuminance = detectionHistory.slice(-3).reduce((sum, d) => sum + d.luminance, 0) / 3
        
        if (lastTheme === 'dark' && avgLuminance > 0.5 + thresholdDifference) {
          shouldChange = true
        } else if (lastTheme === 'light' && avgLuminance < 0.5 - thresholdDifference) {
          shouldChange = true
        }
      }
      
      if (shouldChange) {
        lastTheme = newTheme
        currentTheme.value = newTheme
        
        // Aplicar clase CSS al body
        document.body.classList.remove('theme-light', 'theme-dark')
        document.body.classList.add(`theme-${newTheme}`)
        
        console.log(`✅ Tema cambiado a: ${newTheme} (luminancia promedio: ${(detectionHistory.slice(-3).reduce((sum, d) => sum + d.luminance, 0) / 3).toFixed(3)})`)
      } else {
        console.log(`⏸️ Tema estable: ${lastTheme} (luminancia: ${luminance.toFixed(3)})`)
      }
    } else {
      console.log(`📊 Detectando: ${newTheme} (luminancia: ${luminance.toFixed(3)}) [${detectionHistory.length}/${maxHistorySize}]`)
    }
  }
  
  // Función principal de detección (ahora async)
  const detectTheme = async () => {
    if (isDetecting.value) return
    
    isDetecting.value = true
    
    try {
      const luminance = await detectBackgroundLuminance()
      if (luminance !== null) {
        applyTheme(luminance)
      }
    } catch (error) {
      console.error('Error en detección de tema:', error)
    } finally {
      isDetecting.value = false
    }
  }
  
  // Iniciar detección periódica  
  const startDetection = (interval = 5000) => {
    // Detección inicial con delay para que Wails se inicialice
    setTimeout(() => {
      detectTheme()
    }, 2000)
    
    // Detección periódica menos frecuente para evitar cambios constantes
    detectionInterval = setInterval(() => {
      detectTheme()
    }, interval)
    
    // Escuchar cambios en preferencias del sistema como backup
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    mediaQuery.addEventListener('change', () => {
      console.log('🔄 Cambio en preferencias del sistema detectado')
      // Limpiar historial en cambio del sistema
      detectionHistory.length = 0
      setTimeout(detectTheme, 1000)
    })
  }
  
  // Detener detección
  const stopDetection = () => {
    if (detectionInterval) {
      clearInterval(detectionInterval)
      detectionInterval = null
    }
  }
  
  // Forzar tema específico
  const setTheme = (theme) => {
    console.log(`🎨 SetTheme llamado con: ${theme}`)
    console.log('  - currentTheme antes:', currentTheme.value)
    console.log('  - Body classes antes:', document.body.className)
    
    currentTheme.value = theme
    document.body.classList.remove('theme-light', 'theme-dark')
    document.body.classList.add(`theme-${theme}`)
    lastTheme = theme
    
    console.log('  - currentTheme después:', currentTheme.value)
    console.log('  - Body classes después:', document.body.className)
    console.log(`✅ Tema establecido: ${theme}`)
  }
  
  return {
    currentTheme: currentTheme,
    isDetecting,
    startDetection,
    stopDetection,
    detectTheme,
    setTheme
  }
}