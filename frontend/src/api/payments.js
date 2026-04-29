import api from './axiosInstance'

export const paymentsApi = {
  // Backend: POST /payments/subscribe (for employer/recruiter premium subscription)
  subscribe: () => api.post('/payments/subscribe'),

  // Backend: POST /payments/feature-job/{job_id} (to feature a specific job)
  featureJob: (jobId) => api.post(`/payments/feature-job/${jobId}`),

  // Backend: POST /payments/verify
  verify: (data) => api.post('/payments/verify', data),
}
