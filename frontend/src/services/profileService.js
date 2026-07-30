import { api } from './api';

export const profileService = {
  getMyProfile:  ()       => api.get('/profile/my-profile'),
  getById:       (id)     => api.get(`/profile/${id}`),
  update:        (data)   => api.put('/profile', data),
  uploadPicture: (data)   => api.post('/profile/upload-picture', data),
  deleteAccount: ()       => api.delete('/profile'),
};
