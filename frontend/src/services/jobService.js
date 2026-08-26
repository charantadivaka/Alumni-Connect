import { api } from './api';

const q = (p) => {
  const s = Object.entries(p).filter(([,v])=>v).map(([k,v])=>`${k}=${encodeURIComponent(v)}`).join('&');
  return s ? `?${s}` : '';
};

export const jobService = {
  getAll:    (filters = {}) => api.get(`/jobs${q(filters)}`),
  getById:   (id)           => api.get(`/jobs/${id}`),
  getMy:     ()             => api.get('/jobs/my/posts'),
  create:    (data)         => api.post('/jobs', data),
  update:    (id, data)     => api.put(`/jobs/${id}`, data),
  updateStatus:(id, status) => api.patch(`/jobs/${id}/status`, { status }),
  duplicate: (id)           => api.post(`/jobs/${id}/duplicate`),
  remove:    (id)           => api.delete(`/jobs/${id}`),
  report:    (id, data)     => api.post(`/jobs/${id}/report`, data),
};

export const applicationService = {
  getMy: (jobId) => api.get(`/applications/my${jobId ? `?jobId=${jobId}` : ''}`),
  getAlumni: () => api.get('/applications/alumni-all'),
  apply: (jobId, data) => api.post('/applications/apply', { jobId, ...data }),
  withdraw: (id) => api.put(`/applications/${id}/withdraw`),
  updateStage: (id, data) => api.put(`/applications/${id}/stage`, data),
};
