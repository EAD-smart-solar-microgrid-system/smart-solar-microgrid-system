/**
 * Generic HTTP Client
 *
 * Built on native browser Fetch API.
 * Handles path resolution with appConfig.apiBaseUrl, JSON headers,
 * safe response parsing, and consistent result structures.
 *
 * Security Notice: Never log auth tokens, passwords, NICs or personal information.
 */

import { appConfig } from '../../config/appConfig.js';

/**
 * Builds the full URL from base URL and relative endpoint.
 * @param {string} endpoint
 * @returns {string}
 */
const buildUrl = (endpoint) => {
  if (!endpoint || typeof endpoint !== 'string') {
    return appConfig.apiBaseUrl;
  }
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${appConfig.apiBaseUrl}/${cleanEndpoint}`;
};

/**
 * Generic request executor using native Fetch API.
 *
 * @param {string} endpoint - Relative path (e.g. 'users' or '/users')
 * @param {object} [options={}] - Request options
 * @param {string} [options.method='GET'] - HTTP method (GET, POST, PUT, PATCH, DELETE)
 * @param {any} [options.data] - Request body data (will be serialized to JSON)
 * @param {Record<string, string>} [options.headers] - Additional request headers
 * @param {string} [options.token] - Optional bearer token
 * @param {AbortSignal} [options.signal] - Optional AbortSignal
 * @returns {Promise<{
 *   success: boolean,
 *   data: any,
 *   error: string | null,
 *   status: number | null,
 *   validationErrors: any | null,
 *   isNetworkError: boolean,
 *   isAuthError: boolean,
 *   isForbidden: boolean
 * }>}
 */
export const request = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    data,
    headers = {},
    token,
    signal,
  } = options;

  const url = buildUrl(endpoint);
  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = {
    method: method.toUpperCase(),
    headers: requestHeaders,
    signal,
  };

  if (data !== undefined && data !== null) {
    if (!requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }
    fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    let parsedData = null;
    if (rawText && rawText.trim().length > 0) {
      if (contentType.includes('application/json')) {
        try {
          parsedData = JSON.parse(rawText);
        } catch {
          parsedData = rawText;
        }
      } else {
        parsedData = rawText;
      }
    }

    // 1. Successful Responses (2xx)
    if (response.ok) {
      return {
        success: true,
        data: parsedData,
        error: null,
        status: response.status,
        validationErrors: null,
        isNetworkError: false,
        isAuthError: false,
        isForbidden: false,
      };
    }

    // 2. Unauthorized (401)
    if (response.status === 401) {
      return {
        success: false,
        data: null,
        error: (parsedData && parsedData.message) || 'Authentication required.',
        status: 401,
        validationErrors: null,
        isNetworkError: false,
        isAuthError: true,
        isForbidden: false,
      };
    }

    // 3. Forbidden (403)
    if (response.status === 403) {
      return {
        success: false,
        data: null,
        error: (parsedData && parsedData.message) || 'You do not have permission to perform this action.',
        status: 403,
        validationErrors: null,
        isNetworkError: false,
        isAuthError: false,
        isForbidden: true,
      };
    }

    // 4. HTTP Validation Errors (400, 422)
    if (response.status === 400 || response.status === 422) {
      const errorMsg =
        (parsedData && (parsedData.message || parsedData.title)) ||
        'Validation failed for the submitted data.';
      const validationDetails =
        (parsedData && (parsedData.errors || parsedData.validationErrors)) ||
        parsedData ||
        null;

      return {
        success: false,
        data: null,
        error: errorMsg,
        status: response.status,
        validationErrors: validationDetails,
        isNetworkError: false,
        isAuthError: false,
        isForbidden: false,
      };
    }

    // 5. Other HTTP Server/Client Errors (404, 500, etc.)
    return {
      success: false,
      data: null,
      error:
        (parsedData && (parsedData.message || parsedData.title)) ||
        `Request failed with HTTP status ${response.status}.`,
      status: response.status,
      validationErrors: null,
      isNetworkError: false,
      isAuthError: false,
      isForbidden: false,
    };
  } catch (err) {
    const isAborted = err.name === 'AbortError';
    return {
      success: false,
      data: null,
      error: isAborted ? 'Request was aborted.' : (err.message || 'Network communication failure.'),
      status: null,
      validationErrors: null,
      isNetworkError: !isAborted,
      isAuthError: false,
      isForbidden: false,
    };
  }
};

export const httpClient = {
  request,
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'POST', data }),
  put: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'PUT', data }),
  patch: (endpoint, data, options = {}) => request(endpoint, { ...options, method: 'PATCH', data }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  del: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};

export default httpClient;
