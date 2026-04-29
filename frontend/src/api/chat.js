import api from './axiosInstance'

export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  getOrCreateConversation: (userId) => api.post('/chat/conversations', { other_user_id: userId }),
  getMessages: (conversationId, params) => api.get(`/chat/conversations/${conversationId}/messages`, { params }),
}
