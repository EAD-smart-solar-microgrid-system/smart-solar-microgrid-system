import apiClient from './apiClient.js';

const STATIONS_ROUTE = '/api/stations';

export const getStations = (options = {}) => apiClient.get(STATIONS_ROUTE, options);

export const createStation = (data, options = {}) =>
  apiClient.post(STATIONS_ROUTE, data, options);

export const updateStation = (id, data, options = {}) =>
  apiClient.put(`${STATIONS_ROUTE}/${encodeURIComponent(id)}`, data, options);

export const updateStationStatus = (id, status, options = {}) =>
  apiClient.patch(`${STATIONS_ROUTE}/${encodeURIComponent(id)}/status`, { status }, options);

export default {
  getStations,
  createStation,
  updateStation,
  updateStationStatus,
};
