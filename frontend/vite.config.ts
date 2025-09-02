import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  define: {
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/wailsjs': resolve(__dirname, 'wailsjs')
    }
  },
  build: {
    // Optimización del bundle
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remover console.logs en producción
        drop_debugger: true,
        pure_funcs: ['console.log'] // Funciones consideradas "puras" a eliminar
      }
    },
    rollupOptions: {
      output: {
        // Chunking strategy para mejor caching
        manualChunks: {
          vendor: ['vue'],
          // Separar Wails APIs en chunk independiente
          wails: []
        }
      }
    },
    // Tree shaking optimizado
    target: 'esnext',
    // Sourcemaps solo en dev
    sourcemap: false,
    // Optimizar CSS
    cssCodeSplit: true
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: ['vue']
  },
  server: {
    // Optimización para dev server
    hmr: {
      overlay: false
    }
  }
})