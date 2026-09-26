import { apiConfig } from '../config/apiConfig.js';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const buildUrl = (route) => {
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  return `${apiConfig.baseUrl}${cleanRoute}`;
};

const parseResponse = async (response) => {
  const text = await response.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

export const apiRequest = async (route, options = {}) => {
  const { method = 'GET', body, headers = {}, token, signal } = options;
  const requestHeaders = { Accept: 'application/json', ...headers };

  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';

  // Member 1 can provide a real access token here when authentication is integrated.
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(route), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Unable to reach the API. Check that the server is running.', null);
  }

  const payload = await parseResponse(response);
  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      (payload && typeof payload === 'object' && payload.title) ||
      (typeof payload === 'string' && payload) ||
      `Request failed with HTTP status ${response.status}.`;
    throw new ApiError(message, response.status);
  }

  return payload;
};

export const apiClient = Object.freeze({
  request: apiRequest,
  get: (route, options = {}) => apiRequest(route, { ...options, method: 'GET' }),
  post: (route, body, options = {}) => apiRequest(route, { ...options, method: 'POST', body }),
  put: (route, body, options = {}) => apiRequest(route, { ...options, method: 'PUT', body }),
  patch: (route, body, options = {}) => apiRequest(route, { ...options, method: 'PATCH', body }),
});

export default apiClient;
