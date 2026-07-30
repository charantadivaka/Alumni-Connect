import { api } from './api';

export const adminService = {
  getVerificationQueue: () => api.get('/admin/verifications'),
  verifyAlumni: (id, status) => api.put(`/admin/users/${id}/verify`, { status }),
  getUsers: (params = '') => api.get(`/admin/users${params}`),
  toggleSuspend: (id) => api.put(`/admin/users/${id}/suspend`),
  getAnalytics: () => api.get('/admin/analytics'),
  getReportedJobs: () => api.get('/admin/reports/jobs'),
  getReportedEvents: () => api.get('/admin/reports/events'),
  // College management
  getColleges: () => api.get('/colleges/admin'),
  createCollege: (data) => api.post('/colleges/admin', data),
  updateCollege: (id, data) => api.put(`/colleges/admin/${id}`, data),
  deleteCollege: (id) => api.delete(`/colleges/admin/${id}`),
};

