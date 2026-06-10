import { api } from './api';

export const profileService = {
  getMyProfile:  ()       => api.get('/profile'),
  getById:       (id)     => api.get(`/profile/${id}`),
  update:        (data)   => api.put('/profile', data),
  uploadPicture: (data)   => api.put('/profile/picture', data),
  deleteAccount: ()       => api.delete('/profile/me'),
};
