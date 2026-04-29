import api from './axiosInstance'

export const applicationsApi = {
  apply: (data) => api.post('/applications', data),
  myApplications: (params) => api.get('/applications/my', { params }),
  forJob: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
  scoreResume: (id) => api.post(`/applications/${id}/score`),
}
