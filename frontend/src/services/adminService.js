import { api } from './api';

export const adminService = {
  getVerificationQueue: () => api.get('/admin/verification-queue'),
  verifyAlumni: (id, status) => api.put(`/admin/users/${id}/verify`, { status }),
  getUsers: (params = '') => api.get(`/admin/users${params}`),
  toggleSuspend: (id) => api.put(`/admin/users/${id}/suspend`),
  getAnalytics: () => api.get('/admin/analytics'),
  getReportedJobs: () => api.get('/admin/jobs/reported'),
  getReportedEvents: () => api.get('/admin/events/reported'),
  // College management
  getColleges: () => api.get('/admin/colleges'),
  createCollege: (data) => api.post('/admin/colleges', data),
  updateCollege: (id, data) => api.put(`/admin/colleges/${id}`, data),
  deleteCollege: (id) => api.delete(`/admin/colleges/${id}`),
};

