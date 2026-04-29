import axios from 'axios'
import useAuthStore from '../store/useAuthStore'

const api = axios.create({
  baseURL: '',           // Vite proxy handles routing to http://localhost:8000
  withCredentials: true, // Send httpOnly refresh_token cookie automatically
})

// ── Request interceptor: attach access token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: auto-refresh on 401 ─────────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        // Refresh itself failed — this is expected if the user isn't logged in yet.
        // Only redirect to login if we're currently on a protected page.
        // Do NOT redirect if already on an auth page (would cause an infinite loop).
        useAuthStore.getState().clearAuth()
        const authPaths = ['/auth/', '/verify', '/reset-password']
        const isOnAuthPage = authPaths.some((p) => window.location.pathname.startsWith(p))
        if (!isOnAuthPage && window.location.pathname !== '/') {
          window.location.href = '/auth/login'
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue requests while refresh is in-flight
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await api.post('/auth/refresh')
        const { access_token, role, user_id, name, avatar_url } = res.data
        useAuthStore.getState().setAuth(access_token, { id: user_id, name, avatar_url, role })
        processQueue(null, access_token)
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().clearAuth()
        window.location.href = '/auth/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
