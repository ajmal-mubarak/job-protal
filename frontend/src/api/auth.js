import api from './axiosInstance'

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  verifyEmail: (token) => api.get(`/auth/verify?token=${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  googleCallback: (code) => api.post('/auth/google/callback', { code }),
  googleCompleteSignup: (data) => api.post('/auth/google/complete-signup', data),
}
