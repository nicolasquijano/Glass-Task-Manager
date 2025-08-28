// Inicialización inmediata del tema oscuro
// Se ejecuta antes que Vue para evitar parpadeo

console.log('🔍 Init-theme.js cargado - timestamp:', Date.now())

// Función para aplicar tema y loggear estado
const applyDarkTheme = (source) => {
  console.log(`📋 Estado ANTES de aplicar tema (${source}):`)
  console.log('  - Body classes:', document.body?.className || 'N/A')
  console.log('  - CSS var --text-primary:', getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim())
  
  document.body.classList.remove('theme-light', 'theme-dark')
  document.body.classList.add('theme-dark')
  
  // Verificar después
  setTimeout(() => {
    console.log(`✅ Estado DESPUÉS de aplicar tema (${source}):`)
    console.log('  - Body classes:', document.body.className)
    console.log('  - CSS var --text-primary:', getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim())
    console.log('  - Computed color:', getComputedStyle(document.body).color)
  }, 50)
}

document.addEventListener('DOMContentLoaded', () => {
  applyDarkTheme('DOMContentLoaded')
})

// También aplicar inmediatamente sin esperar DOMContentLoaded
if (document.body) {
  applyDarkTheme('immediate')
} else {
  console.log('⏳ Body no existe aún, usando observer...')
  // Si el body no existe aún, aplicar cuando esté disponible
  const observer = new MutationObserver((mutations, obs) => {
    if (document.body) {
      applyDarkTheme('observer')
      obs.disconnect()
    }
  })
  observer.observe(document.documentElement, { childList: true, subtree: true })
}