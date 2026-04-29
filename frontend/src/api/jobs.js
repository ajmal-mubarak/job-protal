import api from './axiosInstance'

export const jobsApi = {
  list: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  create: (data) => api.post('/jobs', data),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
  myJobs: (params) => api.get('/jobs/my-jobs', { params }),
  featured: () => api.get('/jobs/featured'),
}
