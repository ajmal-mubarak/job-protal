import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/jobs': 'http://localhost:8000',
      '/applications': 'http://localhost:8000',
      '/chat': 'http://localhost:8000',
      '/notifications': 'http://localhost:8000',
      '/payments': 'http://localhost:8000',
      '/admin': 'http://localhost:8000',
      '/upload': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/uploads': 'http://localhost:8000',
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
  },
})
