import { api } from './api';

const q = (p) => {
  const s = Object.entries(p).filter(([,v])=>v).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
  return s ? `?${s}` : '';
};

export const jobService = {
  getAll:    (filters = {}) => api.get(`/jobs${q(filters)}`),
  getById:   (id)           => api.get(`/jobs/${id}`),
  getMy:     ()             => api.get('/jobs/my'),
  create:    (data)         => api.post('/jobs', data),
  update:    (id, data)     => api.put(`/jobs/${id}`, data),
  toggle:    (id)           => api.put(`/jobs/${id}/toggle`),
  remove:    (id)           => api.delete(`/jobs/${id}`),
  report:    (id)           => api.put(`/jobs/${id}/report`),
};

export const applicationService = {
  apply:          (data)         => api.post('/applications', data),
  getMy:          ()             => api.get('/applications/my'),
  getAlumni:      ()             => api.get('/applications/alumni'),
  getForJob:      (jobId)        => api.get(`/applications/job/${jobId}`),
  updateStage:    (id, data)     => api.put(`/applications/${id}/stage`, data),
  withdraw:       (id)           => api.delete(`/applications/${id}`),
};
