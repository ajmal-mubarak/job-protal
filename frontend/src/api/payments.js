import api from './axiosInstance'

export const paymentsApi = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
  myPayments: () => api.get('/payments/my'),
}
