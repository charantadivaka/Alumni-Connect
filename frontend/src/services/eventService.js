import { api } from './api';

export const eventService = {
  getAll:  (filters = {}) => api.get('/events'),
  create:  (data)         => api.post('/events', data),
  rsvp:    (id)           => api.put(`/events/${id}/rsvp`),
  remove:  (id)           => api.delete(`/events/${id}`),
  report:  (id)           => api.put(`/events/${id}/report`),
};

export const forumService = {
  getAll:   (filters = {}) => {
    const q = filters.category ? `?category=${filters.category}` : '';
    return api.get(`/forums${q}`);
  },
  getById:  (id)           => api.get(`/forums/${id}`),
  create:   (data)         => api.post('/forums', data),
  reply:    (id, data)     => api.post(`/forums/${id}/reply`, data),
  upvote:   (id)           => api.put(`/forums/${id}/upvote`),
  remove:   (id)           => api.delete(`/forums/${id}`),
};

export const storyService = {
  getAll:   ()             => api.get('/stories'),
  getMy:    ()             => api.get('/stories/my'),
  create:   (data)         => api.post('/stories', data),
  like:     (id)           => api.put(`/stories/${id}/like`),
  remove:   (id)           => api.delete(`/stories/${id}`),
};
