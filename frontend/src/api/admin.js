import api from './axiosInstance'

export const adminApi = {
  listUsers: (params) => api.get('/admin/users', { params }),
  toggleUserActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  stats: () => api.get('/admin/stats'),
}
