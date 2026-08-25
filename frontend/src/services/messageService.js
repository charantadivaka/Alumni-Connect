import { api } from './api';

export const messageService = {
  getThreads:      ()             => api.get('/messages/threads'),
  getConversation: (userId)       => api.get(`/messages/${userId}`),
  send:            (data)         => api.post('/messages', data),
  markRead:        (userId)       => api.put(`/messages/${userId}/read`),
  edit:            (id, text)     => api.put(`/messages/${id}`, { text }),
  delete:          (id)           => api.delete(`/messages/${id}`),
  deleteConversation: (userId)    => api.delete(`/messages/conversation/${userId}`),
  block:           (userId)       => api.post(`/messages/block/${userId}`),
  report:          (userId, reason) => api.post(`/messages/report/${userId}`, { reason }),
};

export const notificationService = {
  getAll:     ()    => api.get('/notifications'),
  markRead:   (id)  => api.put(`/notifications/${id}/read`),
  markAllRead:()    => api.put('/notifications/read-all'),
};
