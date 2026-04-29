import api from './axiosInstance'

export const applicationsApi = {
  /**
   * Apply to a job.
   * data: { job_id, cover_letter?, resume_file? (File object) }
   * The backend expects multipart/form-data with optional `resume` file upload.
   * If no file is provided, the backend falls back to the jobseeker's profile resume_url.
   */
  apply: (data) => {
    const form = new FormData()
    form.append('job_id', data.job_id)
    if (data.cover_letter) form.append('cover_letter', data.cover_letter)
    // Only append the file if it's an actual File object (from an <input type="file">)
    if (data.resume_file instanceof File) {
      form.append('resume', data.resume_file)
    }
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
