import { api } from './api';

export const collegeService = {
  // Public — used on registration page (no auth needed)
  getAll: () => api.get('/colleges'),
  validate: (collegeId, rollNumber) =>
    api.post('/colleges/validate', { collegeId, rollNumber }),
};
