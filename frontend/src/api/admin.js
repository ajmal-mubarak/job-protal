import api from './axiosInstance'

export const adminApi = {
  listUsers: (params) => api.get('/admin/users', { params }),

  // Backend: PATCH /admin/users/{id} with body {is_active: bool}
  // We simulate toggle by fetching user state then sending opposite
  toggleUserActive: (id, currentIsActive) =>
    api.patch(`/admin/users/${id}`, { is_active: !currentIsActive }),

  // Backend: GET /admin/reports/summary
  stats: () => api.get('/admin/reports/summary'),
}
