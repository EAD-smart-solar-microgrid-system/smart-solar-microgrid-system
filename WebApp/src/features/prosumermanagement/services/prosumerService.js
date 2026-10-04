/**
 * Prosumer Management API Service
 *
 * Encapsulates administrative RESTful communication for Solar Prosumer profiles.
 * Interacts with the C# Web API endpoints under /api/admin/prosumers.
 * Reuses the shared apiClient and Member 1 JWT authentication flow.
 */

import apiClient, { ApiError } from '../../../services/apiClient.js';
import {
  mapProsumer,
  normalizeNic,
  toCreateProsumerRequest,
  toUpdateProsumerRequest,
} from '../utils/prosumerMapper.js';

const PROSUMERS_ROUTE = '/api/admin/prosumers';

/**
 * Builds request options including the Bearer token from localStorage or options.
 *
 * @param {object} [options={}] - Additional request options
 * @returns {object} Options object with token injected
 */
const getAuthOptions = (options = {}) => {
  const token =
    options.token ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  return {
    ...options,
    token: token || undefined,
  };
};

/**
 * Validates and normalizes an NIC, throwing ApiError if invalid.
 *
 * @param {string} nic - National Identity Card
 * @returns {string} Normalized NIC
 */
const requireValidNic = (nic) => {
  const normalized = normalizeNic(nic);
  if (!normalized) {
    throw new ApiError('A valid National Identity Card (NIC) is required.', 400);
  }
  return normalized;
};

/**
 * Retrieves a list of prosumer profiles, optionally filtered by status (Pending, Active, Deactivated).
 *
 * @param {string|object} [statusOrFilters] - Status filter string or filters object
 * @param {object} [options={}] - Additional request options (e.g. signal)
 * @returns {Promise<Array<object>>} Normalized list of prosumer models
 */
export const getProsumers = async (statusOrFilters, options = {}) => {
  let query = '';
  let requestOptions = options;

  if (typeof statusOrFilters === 'string' && statusOrFilters.trim()) {
    query = `?status=${encodeURIComponent(statusOrFilters.trim())}`;
  } else if (statusOrFilters && typeof statusOrFilters === 'object') {
    if (statusOrFilters.status && typeof statusOrFilters.status === 'string') {
      query = `?status=${encodeURIComponent(statusOrFilters.status.trim())}`;
    }
    requestOptions = { ...statusOrFilters, ...options };
  }

  const response = await apiClient.get(
    `${PROSUMERS_ROUTE}${query}`,
    getAuthOptions(requestOptions)
  );

  return Array.isArray(response) ? response.map(mapProsumer).filter(Boolean) : [];
};

/**
 * Retrieves a single prosumer profile by National Identity Card (NIC).
 *
 * @param {string} nic - National Identity Card
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} Normalized prosumer model
 */
export const getProsumerByNic = async (nic, options = {}) => {
  const normalizedNic = requireValidNic(nic);

  const response = await apiClient.get(
    `${PROSUMERS_ROUTE}/${encodeURIComponent(normalizedNic)}`,
    getAuthOptions(options)
  );

  return mapProsumer(response);
};

/**
 * Creates a new solar prosumer profile.
 *
 * @param {object} data - Form data (nic, fullName, email, phone, address)
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} Normalized created prosumer model
 */
export const createProsumer = async (data, options = {}) => {
  const payload = toCreateProsumerRequest(data);

  const response = await apiClient.post(
    PROSUMERS_ROUTE,
    payload,
    getAuthOptions(options)
  );

  return mapProsumer(response);
};

/**
 * Updates contact and address details of an existing prosumer profile.
 * NIC is immutable and excluded from the request body.
 *
 * @param {string} nic - National Identity Card
 * @param {object} data - Updated fields (fullName, email, phone, address)
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} Normalized updated prosumer model
 */
export const updateProsumer = async (nic, data, options = {}) => {
  const normalizedNic = requireValidNic(nic);
  const payload = toUpdateProsumerRequest(data);

  const response = await apiClient.put(
    `${PROSUMERS_ROUTE}/${encodeURIComponent(normalizedNic)}`,
    payload,
    getAuthOptions(options)
  );

  return mapProsumer(response);
};

/**
 * Updates the lifecycle status of a prosumer (Pending, Active, Deactivated).
 *
 * @param {string} nic - National Identity Card
 * @param {string|object} status - Target lifecycle status
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} Normalized updated prosumer model
 */
export const updateProsumerStatus = async (nic, status, options = {}) => {
  const normalizedNic = requireValidNic(nic);
  const targetStatus =
    typeof status === 'string'
      ? status.trim()
      : typeof status?.status === 'string'
      ? status.status.trim()
      : '';

  const response = await apiClient.patch(
    `${PROSUMERS_ROUTE}/${encodeURIComponent(normalizedNic)}/status`,
    { status: targetStatus },
    getAuthOptions(options)
  );

  return mapProsumer(response);
};

export default {
  getProsumers,
  getProsumerByNic,
  createProsumer,
  updateProsumer,
  updateProsumerStatus,
};
