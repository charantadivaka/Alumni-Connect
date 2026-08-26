import { api } from './api';

export const adminService = {
  getVerificationQueue: () => api.get('/admin/verifications'),
  verifyAlumni: (id, status) => api.put(`/admin/users/${id}/verify`, { status }),
  getUsers: (params = '') => api.get(`/admin/users${params}`),
  toggleSuspend: (id) => api.put(`/admin/users/${id}/suspend`),
  getAnalytics:      ()             => api.get('/admin/analytics'),
  getGrowth:         (days = 30)    => api.get(`/admin/growth?days=${days}`),
  getReportedJobs:   ()             => api.get('/admin/reports/jobs'),
  getReportedEvents: ()             => api.get('/admin/reports/events'),
  resolveReport:     (type, id, reportId, action) => api.post(`/admin/reports/${type}/${id}/${reportId}/resolve`, { action }),
  // College management
  getColleges: () => api.get('/colleges/admin'),
  getCollegeDetails: (id) => api.get(`/colleges/admin/${id}/details`),
  createCollege: (data) => api.post('/colleges/admin', data),
  updateCollege: (id, data) => api.put(`/colleges/admin/${id}`, data),
  renewCollegeSubscription: (id, data) => api.put(`/colleges/admin/${id}/renew`, data),
  deleteCollege: (id) => api.delete(`/colleges/admin/${id}`),
};
