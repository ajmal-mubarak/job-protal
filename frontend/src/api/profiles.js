import api from './axiosInstance'

export const profilesApi = {
  /** Get current user's profile (all roles) */
  getMe: () => api.get('/profiles/me'),

  /** Update current user's profile */
  updateMe: (data) => api.patch('/profiles/me', data),

  /** Upload resume PDF → saved to profile automatically */
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** Upload profile photo → saved to users.avatar_url */
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/upload/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** List job seekers — employer/recruiter only */
  listSeekers: (params) => api.get('/profiles/seekers', { params }),

  /** Get any user's public profile */
  getPublicProfile: (userId) => api.get(`/profiles/public/${userId}`),
}
