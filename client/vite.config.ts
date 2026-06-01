import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@dj/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk de React — primer chunk que carga el browser
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react'
          }
          // GSAP — pesado (~450kb sin minificar), solo se necesita en paginas con animaciones
          if (id.includes('node_modules/gsap')) {
            return 'vendor-gsap'
          }
          // socket.io — se carga con el primer uso de mensajes/notificaciones
          if (id.includes('node_modules/socket.io-client')) {
            return 'vendor-socket'
          }
          // Admin — completamente separado, solo admin lo descarga
          if (id.includes('/pages/admin/')) {
            return 'chunk-admin'
          }
          // React Query + router — librerias de estado/navegacion
          if (id.includes('@tanstack/react-query') || id.includes('react-router')) {
            return 'vendor-router-query'
          }
        },
      },
    },
  },
})
