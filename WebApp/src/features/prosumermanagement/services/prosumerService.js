/**
 * Prosumer Management API Service
 *
 * Encapsulates all RESTful communication for Solar Prosumer profiles.
 * Reuses the shared Fetch-based httpClient and sessionStorage token helper.
 * All authoritative validation and role enforcement are conducted by the C# Web API.
 */

import httpClient from '../../../services/http/httpClient.js';
import { getToken } from '../../../services/storage/sessionStorage.js';
import {
  mapProsumer,
  mapProsumerList,
  normalizeNic,
  toCreateProsumerRequest,
  toUpdateProsumerRequest,
} from '../utils/prosumerMapper.js';

/**
 * Builds request options including the Bearer token from sessionStorage.
 *
 * @param {object} [extraOptions={}] - Additional options (e.g. signal, headers)
 * @returns {object} Options object with token injected
 */
const getAuthOptions = (extraOptions = {}) => {
  const token = getToken();
  return {
    ...extraOptions,
    token: token || undefined,
  };
};

/**
 * Generates an early validation error response for missing/invalid NIC parameter.
 * Matches the standard httpClient result schema.
 *
 * @param {string} message - Error description
 * @returns {object} httpClient-compatible failure result
 */
const createMissingNicResult = (message = 'A valid National Identity Card (NIC) is required.') => ({
  success: false,
  data: null,
  error: message,
  status: 400,
  validationErrors: { nic: message },
  isNetworkError: false,
  isAuthError: false,
  isForbidden: false,
});

/**
 * Retrieves a list of prosumers with optional filtering and pagination.
 *
 * @param {object} [filters={}] - Query filters (nic, status, page, pageSize)
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<{ success: boolean, data: { data: Array, total: number, page: number, pageSize: number }, error: string|null, status: number|null }>}
 */
export const getProsumers = async (filters = {}, options = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const queryString = params.toString();
  const endpoint = queryString ? `prosumers?${queryString}` : 'prosumers';

  const response = await httpClient.get(endpoint, getAuthOptions(options));

  if (response.success && response.data) {
    return {
      ...response,
      data: mapProsumerList(response.data),
    };
  }

  return response;
};

/**
 * Retrieves a single prosumer profile by National Identity Card (NIC).
 *
 * @param {string} nic - National Identity Card
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null, status: number|null }>}
 */
export const getProsumerByNic = async (nic, options = {}) => {
  const normalizedNic = normalizeNic(nic);
  if (!normalizedNic) {
    return createMissingNicResult();
  }

  const endpoint = `prosumers/${encodeURIComponent(normalizedNic)}`;
  const response = await httpClient.get(endpoint, getAuthOptions(options));

  if (response.success && response.data) {
    return {
      ...response,
      data: mapProsumer(response.data),
    };
  }

  return response;
};

/**
 * Retrieves all pending prosumer profiles awaiting administrative activation.
 *
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<{ success: boolean, data: { data: Array, total: number, page: number, pageSize: number }, error: string|null, status: number|null }>}
 */
export const getPendingProsumers = async (options = {}) => {
  const endpoint = 'prosumers/pending';
  const response = await httpClient.get(endpoint, getAuthOptions(options));

  if (response.success && response.data) {
    return {
      ...response,
      data: mapProsumerList(response.data),
    };
  }

  return response;
};

/**
 * Creates a new prosumer profile.
 *
 * @param {object} prosumer - Prosumer form fields (nic, fullName, email, phone, address)
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null, status: number|null }>}
 */
export const createProsumer = async (prosumer, options = {}) => {
  const payload = toCreateProsumerRequest(prosumer);
  const response = await httpClient.post('prosumers', payload, getAuthOptions(options));

  if (response.success && response.data) {
    return {
      ...response,
      data: mapProsumer(response.data),
    };
  }

  return response;
};

/**
 * Updates an existing prosumer profile.
 * NIC is immutable and excluded from the request body.
 *
 * @param {string} nic - National Identity Card primary key
 * @param {object} prosumer - Updated fields (fullName, email, phone, address)
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null, status: number|null }>}
 */
export const updateProsumer = async (nic, prosumer, options = {}) => {
  const normalizedNic = normalizeNic(nic);
  if (!normalizedNic) {
    return createMissingNicResult();
  }

  const payload = toUpdateProsumerRequest(prosumer);
  const endpoint = `prosumers/${encodeURIComponent(normalizedNic)}`;
  const response = await httpClient.put(endpoint, payload, getAuthOptions(options));

  if (response.success && response.data) {
    return {
      ...response,
      data: mapProsumer(response.data),
    };
  }

  return response;
};

/**
 * Deactivates an active prosumer profile.
 *
 * @param {string} nic - National Identity Card primary key
 * @param {string} [reason=''] - Optional reason for deactivation
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null, status: number|null }>}
 */
export const deactivateProsumer = async (nic, reason = '', options = {}) => {
  const normalizedNic = normalizeNic(nic);
  if (!normalizedNic) {
    return createMissingNicResult();
  }

  const endpoint = `prosumers/${encodeURIComponent(normalizedNic)}/deactivate`;
  const payload = typeof reason === 'string' && reason.trim() ? { reason: reason.trim() } : {};

  const response = await httpClient.patch(endpoint, payload, getAuthOptions(options));

  if (response.success && response.data) {
    return {
      ...response,
      data: mapProsumer(response.data),
    };
  }

  return response;
};

/**
 * Reactivates a deactivated prosumer profile.
 * Restricted authoritatively by the C# Web API to Backoffice users.
 *
 * @param {string} nic - National Identity Card primary key
 * @param {string} [remarks=''] - Optional reactivation remarks
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null, status: number|null }>}
 */
export const reactivateProsumer = async (nic, remarks = '', options = {}) => {
  const normalizedNic = normalizeNic(nic);
  if (!normalizedNic) {
    return createMissingNicResult();
  }

  const endpoint = `prosumers/${encodeURIComponent(normalizedNic)}/reactivate`;
  const payload = typeof remarks === 'string' && remarks.trim() ? { remarks: remarks.trim() } : {};

  const response = await httpClient.patch(endpoint, payload, getAuthOptions(options));

  if (response.success && response.data) {
    return {
      ...response,
      data: mapProsumer(response.data),
    };
  }

  return response;
};

/**
 * Activates or approves a pending prosumer registration.
 *
 * @param {string} nic - National Identity Card primary key
 * @param {string} [remarks=''] - Optional approval remarks
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null, status: number|null }>}
 */
export const activatePendingProsumer = async (nic, remarks = '', options = {}) => {
  const normalizedNic = normalizeNic(nic);
  if (!normalizedNic) {
    return createMissingNicResult();
  }

  const endpoint = `prosumers/${encodeURIComponent(normalizedNic)}/activate`;
  const payload = typeof remarks === 'string' && remarks.trim() ? { remarks: remarks.trim() } : {};

  const response = await httpClient.patch(endpoint, payload, getAuthOptions(options));

  if (response.success && response.data) {
    return {
      ...response,
      data: mapProsumer(response.data),
    };
  }

  return response;
};

export default {
  getProsumers,
  getProsumerByNic,
  getPendingProsumers,
  createProsumer,
  updateProsumer,
  deactivateProsumer,
  reactivateProsumer,
  activatePendingProsumer,
};
