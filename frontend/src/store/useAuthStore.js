import { create } from 'zustand'

const useAuthStore = create((set) => ({
  // State
  accessToken: null,
  user: null,       // { id, name, avatar_url, role }
  isAuthenticated: false,
  isLoading: true,  // true until initial refresh check completes

  // Actions
  setAuth: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true, isLoading: false }),

  clearAuth: () =>
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false }),

  setLoading: (isLoading) => set({ isLoading }),

  updateUser: (updates) =>
    set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
}))

export default useAuthStore
