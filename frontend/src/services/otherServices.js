import { api } from './api';

export const resumeService = {
  upload:     (data)  => api.post('/resumes', data),
  getMy:      ()      => api.get('/resumes/my'),
  getById:    (id)    => api.get(`/resumes/${id}`),
  setDefault: (id)    => api.put(`/resumes/${id}/default`),
  remove:     (id)    => api.delete(`/resumes/${id}`),
};

export const referralService = {
  request:    (data)        => api.post('/referrals', data),
  getMy:      ()            => api.get('/referrals/my'),
  respond:    (id, data)    => api.put(`/referrals/${id}/respond`, data),
};

export const bookmarkService = {
  getAll:   (model)        => api.get(model ? `/bookmarks?model=${model}` : '/bookmarks'),
  toggle:   (data)         => api.post('/bookmarks', data),
};

export const adminService = {
  getUsers:          (filters = {}) => {
    const q = Object.entries(filters).filter(([,v])=>v).map(([k,v])=>`${k}=${v}`).join('&');
    return api.get(`/admin/users${q ? '?'+q : ''}`);
  },
  getQueue:          ()             => api.get('/admin/verification-queue'),
  verifyAlumni:      (id, data)     => api.put(`/admin/users/${id}/verify`, data),
  toggleSuspend:     (id)           => api.put(`/admin/users/${id}/suspend`),
  getAnalytics:      ()             => api.get('/admin/analytics'),
  getReportedJobs:   ()             => api.get('/admin/jobs/reported'),
  getReportedEvents: ()             => api.get('/admin/events/reported'),
};

export const aiService = {
  getAdvice: (message) => api.post('/ai/advice', { message }),
};

export const connectionService = {
  request:     (userId)       => api.post(`/connections/request/${userId}`),
  getMy:       ()             => api.get('/connections/my'),
  respond:     (id, data)     => api.put(`/connections/${id}/respond`, data),
  remove:      (id)           => api.delete(`/connections/${id}`),
};
