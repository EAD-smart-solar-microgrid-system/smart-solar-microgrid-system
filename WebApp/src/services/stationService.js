import apiClient from './apiClient.js';

const STATIONS_ROUTE = '/api/stations';

export const getStations = (options = {}) => apiClient.get(STATIONS_ROUTE, options);

export const getStationByHubId = (hubId, options = {}) =>
  apiClient.get(`${STATIONS_ROUTE}/${encodeURIComponent(hubId)}`, options);

export const createStation = (data, options = {}) =>
  apiClient.post(STATIONS_ROUTE, data, options);

export const updateStation = (hubId, data, options = {}) =>
  apiClient.put(`${STATIONS_ROUTE}/${encodeURIComponent(hubId)}`, data, options);

export const updateStationStatus = (hubId, status, options = {}) =>
  apiClient.patch(`${STATIONS_ROUTE}/${encodeURIComponent(hubId)}/status`, { status }, options);

export default {
  getStations,
  getStationByHubId,
  createStation,
  updateStation,
  updateStationStatus,
};
