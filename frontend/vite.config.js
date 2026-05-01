import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Returns a bypass function that lets browser page navigations (text/html)
 * fall through to the SPA index.html, while still proxying API calls from
 * axios/fetch (application/json) to the backend.
 */
function spaBypass(req) {
  const accept = req.headers['accept'] || ''
  if (accept.includes('text/html')) {
    return '/index.html'   // serve the React app, not the backend
  }
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Routes that overlap with React Router paths need the bypass
      '/auth': { target: 'http://localhost:8000', changeOrigin: true, bypass: spaBypass },
      '/chat': { target: 'http://localhost:8000', changeOrigin: true, bypass: spaBypass },

      // Pure API-only routes (no matching React Router path) — no bypass needed
      '/jobs':          { target: 'http://localhost:8000', changeOrigin: true, bypass: spaBypass },
      '/applications':  { target: 'http://localhost:8000', changeOrigin: true },
      '/notifications': { target: 'http://localhost:8000', changeOrigin: true },
      '/payments':      { target: 'http://localhost:8000', changeOrigin: true },
      '/admin':         { target: 'http://localhost:8000', changeOrigin: true },
      '/upload':        { target: 'http://localhost:8000', changeOrigin: true },
      '/profiles':      { target: 'http://localhost:8000', changeOrigin: true },
      '/health':        { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads':       { target: 'http://localhost:8000', changeOrigin: true },

      // WebSocket for Socket.io
      '/socket.io': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
