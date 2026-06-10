import { api } from './api';

export const slotService = {
  create:      (data)   => api.post('/slots', data),
  getMy:       ()       => api.get('/slots/my'),
  getForAlumni:(alumniId) => api.get(`/slots/alumni/${alumniId}`),
  remove:      (id)     => api.delete(`/slots/${id}`),
};

export const mentorshipService = {
  request:      (data)        => api.post('/mentorship', data),
  getMy:        ()            => api.get('/mentorship/my'),
  respond:      (id, data)    => api.put(`/mentorship/${id}/respond`, data),
  complete:     (id, data)    => api.put(`/mentorship/${id}/complete`, data),
  feedback:     (id, data)    => api.put(`/mentorship/${id}/feedback`, data),
};

export const interviewService = {
  book:         (data)        => api.post('/interviews', data),
  getMy:        ()            => api.get('/interviews/my'),
  respond:      (id, data)    => api.put(`/interviews/${id}/respond`, data),
  feedback:     (id, data)    => api.put(`/interviews/${id}/feedback`, data),
};
