/**
 * Energy Slot Reservation Management API Service
 *
 * Communicates with the C# Web API for stations and energy booking slots.
 * Uses the shared Fetch-based httpClient only (no direct MongoDB access).
 */

import httpClient from '../../../services/http/httpClient.js';
import {
  mapEnergySlot,
  mapEnergySlotList,
  mapStationList,
  toCreateSlotRequest,
  toUpdateSlotRequest,
} from '../utils/slotMapper.js';

/**
 * Retrieves all microgrid stations for the station selector.
 *
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} httpClient result with normalized station list in data
 */
export const getStations = async (options = {}) => {
  const response = await httpClient.get('stations', options);

  if (response.success) {
    return {
      ...response,
      data: mapStationList(response.data),
    };
  }

  return response;
};

/**
 * Retrieves energy booking slots for one station.
 *
 * @param {string} stationId - MongoDB station identifier
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} httpClient result with normalized slot list in data
 */
export const getSlotsByStationId = async (stationId, options = {}) => {
  if (!stationId || typeof stationId !== 'string') {
    return {
      success: false,
      data: null,
      error: 'A station must be selected.',
      status: 400,
      validationErrors: { stationId: 'A station must be selected.' },
      isNetworkError: false,
      isAuthError: false,
      isForbidden: false,
    };
  }

  const endpoint = `stations/${encodeURIComponent(stationId)}/slots`;
  const response = await httpClient.get(endpoint, options);

  if (response.success) {
    return {
      ...response,
      data: mapEnergySlotList(response.data),
    };
  }

  return response;
};

/**
 * Creates a new energy booking slot for a station.
 *
 * @param {string} stationId - MongoDB station identifier
 * @param {object} slot - Normalized slot payload
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} httpClient result
 */
export const createSlot = async (stationId, slot, options = {}) => {
  if (!stationId) {
    return {
      success: false,
      data: null,
      error: 'A station must be selected.',
      status: 400,
      validationErrors: null,
      isNetworkError: false,
      isAuthError: false,
      isForbidden: false,
    };
  }

  const payload = toCreateSlotRequest(slot);
  const endpoint = `stations/${encodeURIComponent(stationId)}/slots`;
  const response = await httpClient.post(endpoint, payload, options);

  if (response.success && response.data) {
    return {
      ...response,
      data: mapEnergySlot(response.data),
    };
  }

  return response;
};

/**
 * Updates an existing energy booking slot.
 *
 * @param {string} slotId - MongoDB slot identifier
 * @param {object} slot - Normalized slot payload
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} httpClient result
 */
export const updateSlot = async (slotId, slot, options = {}) => {
  if (!slotId) {
    return {
      success: false,
      data: null,
      error: 'The slot identifier is missing.',
      status: 400,
      validationErrors: null,
      isNetworkError: false,
      isAuthError: false,
      isForbidden: false,
    };
  }

  const payload = toUpdateSlotRequest(slot);
  const endpoint = `slots/${encodeURIComponent(slotId)}`;
  const response = await httpClient.put(endpoint, payload, options);

  if (response.success && response.data) {
    return {
      ...response,
      data: mapEnergySlot(response.data),
    };
  }

  return response;
};

/**
 * Updates only the availability flag for a slot.
 *
 * @param {string} slotId - MongoDB slot identifier
 * @param {boolean} isAvailable - Desired availability state
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} httpClient result
 */
export const updateSlotAvailability = async (slotId, isAvailable, options = {}) => {
  if (!slotId) {
    return {
      success: false,
      data: null,
      error: 'The slot identifier is missing.',
      status: 400,
      validationErrors: null,
      isNetworkError: false,
      isAuthError: false,
      isForbidden: false,
    };
  }

  const endpoint = `slots/${encodeURIComponent(slotId)}/availability`;
  const response = await httpClient.patch(endpoint, { isAvailable }, options);

  if (response.success && response.data) {
    return {
      ...response,
      data: mapEnergySlot(response.data),
    };
  }

  return response;
};

/**
 * Deletes an energy booking slot by id.
 *
 * @param {string} slotId - MongoDB slot identifier
 * @param {object} [options={}] - Additional request options
 * @returns {Promise<object>} httpClient result
 */
export const deleteSlot = async (slotId, options = {}) => {
  if (!slotId) {
    return {
      success: false,
      data: null,
      error: 'The slot identifier is missing.',
      status: 400,
      validationErrors: null,
      isNetworkError: false,
      isAuthError: false,
      isForbidden: false,
    };
  }

  const endpoint = `slots/${encodeURIComponent(slotId)}`;
  return httpClient.delete(endpoint, options);
};

export default {
  getStations,
  getSlotsByStationId,
  createSlot,
  updateSlot,
  updateSlotAvailability,
  deleteSlot,
};
