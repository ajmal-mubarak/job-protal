import api from './axiosInstance'

export const applicationsApi = {
  // Backend expects multipart/form-data with job_id, cover_letter, resume (optional file)
  apply: (data) => {
    const form = new FormData()
    form.append('job_id', data.job_id)
    if (data.cover_letter) form.append('cover_letter', data.cover_letter)
    if (data.resume_url) form.append('cover_letter', (form.get('cover_letter') || '') + `\n\nResume: ${data.resume_url}`)
    // If user provided a resume_url string, add it as metadata in cover letter
    // (Backend supports optional file upload; we pass the URL in cover letter for now)
    return api.post('/applications', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  myApplications: (params) => api.get('/applications/my', { params }),
  forJob: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),

  // Backend path is /applications/{id}/ai-score (not /score)
  scoreResume: (id) => api.post(`/applications/${id}/ai-score`),
}
