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
 * Builds a friendly booking label (no raw ObjectIds).
 *
 * @param {object} reservation - Normalized reservation
 * @returns {string}
 */
export const formatReservationLabel = (reservation) => {
  if (!reservation) {
    return '—';
  }

  const bookingId = formatBookingId(reservation.id);
  const type = reservation.reservationType || 'Booking';
  const when = formatReservationDateTime(reservation.reservationDateTime);

  if (when === '—') {
    return `${bookingId} · ${type}`;
  }

  return `${bookingId} · ${type} · ${when}`;
};

/**
 * Builds a short booking reference from a MongoDB id (not the full ObjectId).
 * Example: "6ab4bc60d234426b650c8fba" → "BK-C8FBA"
 *
 * @param {string} id - Reservation id
 * @returns {string}
 */
export const formatBookingId = (id) => {
  const raw = String(id || '').trim();
  if (!raw) {
    return 'BK-UNKNOWN';
  }

  const suffix = raw.slice(-6).toUpperCase();
  return `BK-${suffix}`;
};

/**
 * Formats a slot window for display.
 *
 * @param {object|null} slot - Normalized slot
 * @returns {string}
 */
export const formatSlotLabel = (slot) => {
  const parts = getSlotWindowParts(slot);
  if (!parts) {
    return 'Unknown slot';
  }

  return `${parts.start} → ${parts.end}${parts.capacity ? ` · ${parts.capacity}` : ''}`;
};

/**
 * Returns slot window parts for line-by-line UI rendering.
 *
 * @param {object|null} slot - Normalized slot
 * @returns {{ start: string, end: string, capacity: string }|null}
 */
export const getSlotWindowParts = (slot) => {
  if (!slot) {
    return null;
  }

  const start = formatSlotDateTime(slot.slotStartUtc);
  const end = formatSlotDateTime(slot.slotEndUtc);
  const capacity =
    Number.isFinite(slot.capacityKw) && slot.capacityKw > 0
      ? `${slot.capacityKw} kW`
      : '';

  return {
    start: start === '—' ? 'Unknown start' : start,
    end: end === '—' ? 'Unknown end' : end,
    capacity,
  };
};

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
  formatReservationLabel,
  formatBookingId,
  formatSlotLabel,
  getSlotWindowParts,
  getReservationStatusBadgeClass,
};
