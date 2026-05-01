import { useEffect } from 'react'
import { io } from 'socket.io-client'
import useAuthStore from '../store/useAuthStore'
import useSocketStore from '../store/useSocketStore'
import useNotificationStore from '../store/useNotificationStore'

export function useSocket() {
  const { isAuthenticated, accessToken } = useAuthStore()
  const { setSocket, clearSocket } = useSocketStore()
  const { prependNotification } = useNotificationStore()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      clearSocket()
      return
    }

    const backendUrl = import.meta.env.VITE_API_URL || 'https://job-protal-jbop.onrender.com'
    const socket = io(backendUrl, {
      auth: { token: accessToken },
      transports: ['websocket'],
      path: '/socket.io',
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    // Store socket reference immediately — do NOT wait for 'connect' event.
    // This ensures components that mount before the handshake completes can
    // still attach listeners (socket.on queues them until connected).
    setSocket(socket)

    socket.on('connect', () => {
      console.log('[SOCKET] Connected:', socket.id)
      // Re-set to trigger any dependent effects that check isConnected
      useSocketStore.getState().setConnected(true)
    })

    socket.on('connect_error', (err) => {
      console.warn('[SOCKET] Connection error:', err.message)
    })

    socket.on('reconnect', () => {
      console.log('[SOCKET] Reconnected')
      useSocketStore.getState().setConnected(true)
    })

    socket.on('disconnect', (reason) => {
      console.log('[SOCKET] Disconnected:', reason)
      useSocketStore.getState().setConnected(false)
      // Do NOT call clearSocket here — keep socket reference alive for reconnect
    })

    socket.on('user_online', ({ user_id }) => {
      useSocketStore.getState().setOnline(user_id)
    })

    socket.on('user_offline', ({ user_id }) => {
      useSocketStore.getState().setOffline(user_id)
    })

    socket.on('new_notification', (notification) => {
      prependNotification(notification)
    })

    // Cleanup: only runs when auth changes (logout / token swap)
    return () => {
      socket.disconnect()
      clearSocket()
    }
  }, [isAuthenticated, accessToken])
}
