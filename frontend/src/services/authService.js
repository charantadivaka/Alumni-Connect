import { api } from './api';

export const authService = {
  register:       (data)     => api.post('/auth/register', data),   // legacy
  sendOtp:        (data)     => api.post('/auth/send-otp', data),   // Step 1: send OTP
  verifyOtp:      (data)     => api.post('/auth/verify-otp', data), // Step 2: verify OTP
  resendOtp:      (data)     => api.post('/auth/resend-otp', data), // Resend OTP
  login:          (data)     => api.post('/auth/login', data),
  adminLogin:     (data)     => api.post('/auth/admin-login', data),
  logout:         ()         => api.post('/auth/logout'),
  getMe:          ()         => api.get('/auth/me'),
  changePassword: (data)     => api.put('/auth/change-password', data),

};
