/**
 * Centralized fetch wrapper.
 * - Base URL: /api (proxied by Vite to http://localhost:5000)
 * - Sends cookies automatically (credentials: 'include')
 * - Parses JSON responses
 * - Throws on non-2xx responses with server error message
 */

const BASE = '/api';

const request = async (method, path, body = null, signal = null) => {
  const opts = {
    method,
    credentials: 'include',
    headers: {},
    signal,
  };

  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE}${path}`, opts);
  const contentType = res.headers.get('content-type');
  const data = contentType?.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = data?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return data;
};

export const api = {
  get:    (path, signal)       => request('GET',    path, null, signal),
  post:   (path, body, signal) => request('POST',   path, body, signal),
  put:    (path, body, signal) => request('PUT',    path, body, signal),
  delete: (path, signal)       => request('DELETE', path, null, signal),
};
