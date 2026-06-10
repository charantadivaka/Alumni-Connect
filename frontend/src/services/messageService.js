import { api } from './api';

export const messageService = {
  getThreads:      ()             => api.get('/messages/threads'),
  getConversation: (userId)       => api.get(`/messages/${userId}`),
  send:            (data)         => api.post('/messages', data),
  markRead:        (userId)       => api.put(`/messages/${userId}/read`),
};

export const notificationService = {
  getAll:     ()    => api.get('/notifications'),
  markRead:   (id)  => api.put(`/notifications/${id}/read`),
  markAllRead:()    => api.put('/notifications/read-all'),
  remove:     (id)  => api.delete(`/notifications/${id}`),
};
