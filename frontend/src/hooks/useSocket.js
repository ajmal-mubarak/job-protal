import { useEffect } from 'react'
import { io } from 'socket.io-client'
import useAuthStore from '../store/useAuthStore'
import useSocketStore from '../store/useSocketStore'
import useNotificationStore from '../store/useNotificationStore'

export function useSocket() {
  const { isAuthenticated, accessToken, user } = useAuthStore()
  const { setSocket, disconnectSocket } = useSocketStore()
  const { prependNotification } = useNotificationStore()

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket()
      return
    }

    const socket = io('/', {
      auth: { token: accessToken },
      transports: ['websocket'],
      path: '/socket.io',
    })

    socket.on('connect', () => {
      setSocket(socket)
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

    socket.on('disconnect', () => {
      disconnectSocket()
    })

    return () => {
      socket.disconnect()
    }
  }, [isAuthenticated, accessToken])
}
