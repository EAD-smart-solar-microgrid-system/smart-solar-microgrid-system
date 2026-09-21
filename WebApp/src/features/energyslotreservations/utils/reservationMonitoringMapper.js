/**
 * Reservation Monitoring Mapper Utilities
 *
 * Normalizes Member 4 reservation-monitoring API DTOs into camelCase UI models.
 */

import { formatSlotDateTime } from './slotMapper.js';

/**
 * Maps a single reservation monitoring item from the API.
 *
 * @param {object|null} dto - Raw monitoring DTO
 * @returns {object|null} Normalized monitoring view model
 */
export const mapReservationMonitoringItem = (dto) => {
  if (!dto || typeof dto !== 'object') {
    return null;
  }

  return {
    id: String(dto.id ?? dto.Id ?? '').trim(),
    stationId: String(dto.stationId ?? dto.StationId ?? '').trim(),
    slotId: String(dto.slotId ?? dto.SlotId ?? '').trim(),
    prosumerId: String(dto.prosumerId ?? dto.ProsumerId ?? '').trim(),
    reservationDateTime: dto.reservationDateTime ?? dto.ReservationDateTime ?? null,
    status: String(dto.status ?? dto.Status ?? '').trim(),
    reservationType: String(dto.reservationType ?? dto.ReservationType ?? '').trim(),
    createdAt: dto.createdAt ?? dto.CreatedAt ?? null,
    updatedAt: dto.updatedAt ?? dto.UpdatedAt ?? null,
  };
};

/**
 * Maps a paginated reservation monitoring list response.
 *
 * @param {object|null} response - API list payload
 * @returns {{ items: object[], totalCount: number, page: number, pageSize: number }}
 */
export const mapReservationMonitoringList = (response) => {
  if (!response || typeof response !== 'object') {
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20,
    };
  }

  const rawItems = response.items ?? response.Items ?? [];
  const items = Array.isArray(rawItems)
    ? rawItems.map(mapReservationMonitoringItem).filter(Boolean)
    : [];

  return {
    items,
    totalCount: Number(response.totalCount ?? response.TotalCount ?? items.length),
    page: Number(response.page ?? response.Page ?? 1),
    pageSize: Number(response.pageSize ?? response.PageSize ?? 20),
  };
};

/**
 * Formats a reservation timestamp for display.
 *
 * @param {string|null} iso - UTC timestamp
 * @returns {string} Localized date/time label
 */
export const formatReservationDateTime = (iso) => formatSlotDateTime(iso);

/**
 * Builds Bootstrap badge classes for a reservation status.
 *
 * @param {string} status - Reservation status string
 * @returns {string} Badge className
 */
export const getReservationStatusBadgeClass = (status) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'pending':
      return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
    case 'approved':
      return 'bg-success-subtle text-success-emphasis border border-success-subtle';
    case 'cancelled':
      return 'bg-secondary-subtle text-secondary border';
    case 'completed':
      return 'bg-primary-subtle text-primary-emphasis border border-primary-subtle';
    default:
      return 'bg-light text-dark border';
  }
};

export default {
  mapReservationMonitoringItem,
  mapReservationMonitoringList,
  formatReservationDateTime,
  getReservationStatusBadgeClass,
};
