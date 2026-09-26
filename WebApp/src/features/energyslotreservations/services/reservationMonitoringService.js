/**
 * Reservation Monitoring API Service
 *
 * Read-only Member 4 monitoring calls against the C# Web API.
 */

import httpClient from '../../../services/http/httpClient.js';
import {
  mapReservationMonitoringItem,
  mapReservationMonitoringList,
} from '../utils/reservationMonitoringMapper.js';

/**
 * Builds a query string from monitoring filter values.
 *
 * @param {object} filters - Applied filter and pagination values
 * @returns {string} URL-encoded query string without a leading '?'
 */
const buildQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.stationId) {
    params.set('stationId', filters.stationId.trim());
  }
  if (filters.prosumerId) {
    params.set('prosumerId', filters.prosumerId.trim());
  }
  if (filters.status) {
    params.set('status', filters.status.trim());
  }
  if (filters.startDate) {
    params.set('startDate', filters.startDate);
  }
  if (filters.endDate) {
    params.set('endDate', filters.endDate);
  }
  if (filters.search) {
    params.set('search', filters.search.trim());
  }
  if (filters.page) {
    params.set('page', String(filters.page));
  }
  if (filters.pageSize) {
    params.set('pageSize', String(filters.pageSize));
  }

  return params.toString();
};

/**
 * Retrieves a filtered, paginated reservation monitoring list.
 *
 * @param {object} [filters={}] - Filter and pagination options
 * @param {object} [options={}] - Additional httpClient options
 * @returns {Promise<object>} httpClient result with normalized list payload
 */
export const getReservationMonitoringList = async (filters = {}, options = {}) => {
  const query = buildQueryString(filters);
  const endpoint = query
    ? `member4/reservation-monitoring?${query}`
    : 'member4/reservation-monitoring';

  const response = await httpClient.get(endpoint, options);

  if (response.success) {
    return {
      ...response,
      data: mapReservationMonitoringList(response.data),
    };
  }

  return response;
};

/**
 * Retrieves one reservation monitoring record by identifier.
 *
 * @param {string} reservationId - MongoDB reservation identifier
 * @param {object} [options={}] - Additional httpClient options
 * @returns {Promise<object>} httpClient result with normalized item payload
 */
export const getReservationMonitoringById = async (reservationId, options = {}) => {
  if (!reservationId || typeof reservationId !== 'string') {
    return {
      success: false,
      data: null,
      error: 'A reservation identifier is required.',
      status: 400,
      validationErrors: null,
      isNetworkError: false,
      isAuthError: false,
      isForbidden: false,
    };
  }

  const endpoint = `member4/reservation-monitoring/${encodeURIComponent(reservationId.trim())}`;
  const response = await httpClient.get(endpoint, options);

  if (response.success && response.data) {
    return {
      ...response,
      data: mapReservationMonitoringItem(response.data),
    };
  }

  return response;
};

export default {
  getReservationMonitoringList,
  getReservationMonitoringById,
};
