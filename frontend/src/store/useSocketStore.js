import { create } from 'zustand'

const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  isConnected: false,

  setSocket: (socket) => set({ socket, isConnected: true }),
  disconnectSocket: () => {
    const { socket } = get()
    if (socket) socket.disconnect()
    set({ socket: null, isConnected: false, onlineUsers: new Set() })
  },

  setOnline: (userId) =>
    set((state) => ({ onlineUsers: new Set([...state.onlineUsers, userId]) })),

  setOffline: (userId) =>
    set((state) => {
      const next = new Set(state.onlineUsers)
      next.delete(userId)
      return { onlineUsers: next }
    }),

  isUserOnline: (userId) => get().onlineUsers.has(userId),
}))

export default useSocketStore
