import { api } from './api';

export const eventService = {
  getAll:  (params = {})  => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/events${qs ? `?${qs}` : ''}`);
  },
  create:  (data)         => api.post('/events', data),
  update:  (id, data)     => api.put(`/events/${id}`, data),
  rsvp:    (id)           => api.put(`/events/${id}/rsvp`),
  remove:  (id)           => api.delete(`/events/${id}`),
  report:  (id, data)     => api.post(`/events/${id}/report`, data),
};

export const forumService = {
  getAll:   (params = {})  => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/forums${qs ? `?${qs}` : ''}`);
  },
  getById:  (id)           => api.get(`/forums/${id}`),
  create:   (data)         => api.post('/forums', data),
  update:   (id, data)     => api.put(`/forums/${id}`, data),
  remove:   (id)           => api.delete(`/forums/${id}`),
  reply:    (id, data)     => api.post(`/forums/${id}/reply`, data),
  editReply: (id, replyId, data) => api.put(`/forums/${id}/reply/${replyId}`, data),
  deleteReply: (id, replyId) => api.delete(`/forums/${id}/reply/${replyId}`),
  acceptReply: (id, replyId) => api.put(`/forums/${id}/reply/${replyId}/accept`),
  upvote:   (id)           => api.put(`/forums/${id}/upvote`),
  follow:   (id)           => api.post(`/forums/${id}/follow`),
  report:   (id, replyId)  => api.post(`/forums/${id}/report`, { replyId }),
};

export const storyService = {
  getAll:   (params = {})  => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`/stories${qs ? `?${qs}` : ''}`);
  },
  getMy:    ()             => api.get('/stories/my'),
  create:   (data)         => api.post('/stories', data),
  like:     (id)           => api.put(`/stories/${id}/like`),
  remove:   (id)           => api.delete(`/stories/${id}`),
};
