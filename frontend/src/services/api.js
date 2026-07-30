/**
 * Centralized fetch wrapper.
 * - Base URL: /api (proxied by Vite to http://localhost:5000)
 * - Sends cookies automatically (credentials: 'include')
 * - Parses JSON responses
 * - Throws on non-2xx responses with server error message
 *
 * Response unwrapping:
 *   The backend wraps all successful responses as:
 *   { success: true, data: <payload>, message: '...' }
 *
 *   This wrapper automatically returns `data` from that envelope,
 *   so all callers receive the payload directly without needing
 *   to do `response.data` everywhere.
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
  const json = contentType?.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const message = json?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  // Unwrap the standard envelope: { success, data, message, timestamp, requestId }
  // If the response has a `data` key (our standard shape), return `data`.
  // Otherwise fall through and return the full response (for non-standard endpoints).
  if (json !== null && typeof json === 'object' && 'success' in json) {
    return json.data ?? null;
  }

  return json;
};

export const api = {
  get:    (path, signal)       => request('GET',    path, null, signal),
  post:   (path, body, signal) => request('POST',   path, body, signal),
  put:    (path, body, signal) => request('PUT',    path, body, signal),
  delete: (path, signal)       => request('DELETE', path, null, signal),
};
