import { create } from 'zustand'

const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  isConnected: false,

  // Store socket reference immediately on creation
  setSocket: (socket) => set({ socket }),

  // Called when socket physically connects/reconnects
  setConnected: (isConnected) => set({ isConnected }),

  // Called only on logout / auth change
  clearSocket: () => {
    const { socket } = get()
    if (socket) {
      // Remove all listeners to prevent memory leaks
      socket.removeAllListeners()
    }
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

  isUserOnline: (userId) => get().onlineUsers.has(String(userId)),
}))

export default useSocketStore
