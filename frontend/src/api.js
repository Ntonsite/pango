import { tokenStorage } from './tokenStorage';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const token = tokenStorage.get();
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let body = options.body;
  if (body && !(body instanceof URLSearchParams)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, body });

  if (response.status === 401) {
    tokenStorage.clear();
    if (window.location.pathname !== '/login') {
      window.location.href = '/login?expired=1';
    }
    throw new ApiError('Session expired. Please sign in again.', 401);
  }

  if (!response.ok) {
    let detail = 'Something went wrong. Please try again.';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
