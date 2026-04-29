import api from './axiosInstance'

export const jobsApi = {
  // Public browse — backend uses ?search= not ?q=
  list: (params) => {
    const mapped = { ...params }
    if (mapped.q) { mapped.search = mapped.q; delete mapped.q }
    if (mapped.featured) { mapped.featured_only = true; delete mapped.featured }
    if (mapped.page_size) { mapped.limit = mapped.page_size; delete mapped.page_size }
    return api.get('/jobs', { params: mapped })
  },
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.patch(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  // Backend path is /jobs/my/listings
  myJobs: (params) => api.get('/jobs/my/listings', { params }),
  featured: () => api.get('/jobs/featured'),
}
