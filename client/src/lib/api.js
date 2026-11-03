import { cache } from './cache';

const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, errors, offline = false) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.offline = offline;
  }
}

export const isAbortError = (err) => err?.name === 'AbortError';

let authToken = null;
let onUnauthorized = null;

export const setAuthToken = (token) => {
  authToken = token;
};
/** Called when a logged-in request gets 401 (expired/invalid session). */
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

function buildUrl(path, params) {
  if (!params) return path;
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return query ? `${path}?${query}` : path;
}

async function request(path, { method = 'GET', body, params, signal } = {}) {
  const url = buildUrl(path, params);
  const cacheable = method === 'GET';
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res;
  try {
    res = await fetch(`${BASE}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined, signal });
  } catch (err) {
    if (isAbortError(err)) throw err;
    // Network failure: serve the last saved copy for reads (offline support).
    if (cacheable) {
      const cached = cache.get(url);
      if (cached !== undefined) return cached;
    }
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    throw new ApiError(offline ? 'You’re offline' : 'Can’t reach the server', 0, undefined, true);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && authToken) onUnauthorized?.(data?.error);
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.errors);
  }
  if (cacheable) cache.set(url, data);
  return data;
}

export const api = {
  /** Last cached response for a GET, for instant first paint (stale-while-revalidate). */
  peek: (path, params) => cache.get(buildUrl(path, params)),

  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  guest: () => request('/auth/guest', { method: 'POST' }),
  upgrade: (body) => request('/auth/upgrade', { method: 'POST', body }),
  me: (opts) => request('/auth/me', opts),

  weeks: (tz, opts) => request('/tasks/weeks', { params: { tz }, ...opts }),
  tags: (opts) => request('/tasks/tags', opts),
  // Unpaged list (e.g. one week's tasks) → array.
  list: (params, opts) => request('/tasks', { params, ...opts }),
  // Paginated, filtered, sorted list → { items, nextCursor }.
  search: (params, opts) => request('/tasks', { params: { limit: 20, ...params }, ...opts }),
  get: (id, opts) => request(`/tasks/${id}`, opts),
  create: (task) => request('/tasks', { method: 'POST', body: task }),
  update: (id, changes) => request(`/tasks/${id}`, { method: 'PATCH', body: changes }),
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  reorder: (ids) => request('/tasks/reorder', { method: 'PUT', body: { ids } }),
};
