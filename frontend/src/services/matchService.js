import { api } from './api';

const buildQuery = (params) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '' && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return q ? `?${q}` : '';
};

export const matchService = {
  getMatches:   (filters = {}) => api.get(`/match${buildQuery(filters)}`),
  getDirectory: (filters = {}) => api.get(`/match/directory${buildQuery(filters)}`),
  getAlumniById:(id)           => api.get(`/match/${id}`),
};
