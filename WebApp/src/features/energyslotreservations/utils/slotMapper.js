/**
 * Energy Booking Slot DTO & ViewModel Mapper Utilities
 *
 * Normalizes C# Web API DTOs into predictable camelCase UI models.
 */

const normalizeBoolean = (value, fallback = false) => {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return value == null ? fallback : Boolean(value);
};

/**
 * Maps a single energy booking slot DTO from the server.
 *
 * @param {object|null} dto - Raw slot DTO from API response
 * @returns {object|null} Normalized slot view model or null if input is invalid
 */
export const mapEnergySlot = (dto) => {
  if (!dto || typeof dto !== 'object') {
    return null;
  }

  return {
    id: (dto.id ?? dto.Id ?? '').trim(),
    stationId: (dto.stationId ?? dto.StationId ?? '').trim(),
    slotStartUtc: dto.slotStartUtc ?? dto.SlotStartUtc ?? null,
    slotEndUtc: dto.slotEndUtc ?? dto.SlotEndUtc ?? null,
    capacityKw: Number(dto.capacityKw ?? dto.CapacityKw ?? 0),
    isAvailable: normalizeBoolean(dto.isAvailable ?? dto.IsAvailable, false),
    createdAt: dto.createdAt ?? dto.CreatedAt ?? null,
    updatedAt: dto.updatedAt ?? dto.UpdatedAt ?? null,
  };
};

/**
 * Maps a slot list response into an array of view models.
 *
 * @param {Array|object|null} response - Server response payload
 * @returns {Array} Normalized slot list
 */
export const mapEnergySlotList = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response.map(mapEnergySlot).filter(Boolean);
  }

  const nested = response.data ?? response.Data ?? response.items ?? response.Items;
  if (Array.isArray(nested)) {
    return nested.map(mapEnergySlot).filter(Boolean);
  }

  return [];
};

/**
 * Maps a station DTO from GET /api/stations.
 *
 * @param {object|null} dto - Raw station DTO
 * @returns {object|null} Normalized station view model
 */
export const mapStation = (dto) => {
  if (!dto || typeof dto !== 'object') {
    return null;
  }

  const rawId = String(dto.id ?? dto.Id ?? '').trim();
  const rawHubId = String(dto.hubId ?? dto.HubId ?? '').trim();
  const id = rawId || rawHubId;

  return {
    id,
    mongoId: rawId,
    hubId: rawHubId || rawId,
    stationName: (dto.stationName ?? dto.StationName ?? '').trim(),
    status: (dto.status ?? dto.Status ?? '').trim(),
    capacityKwPerHour: Number(dto.capacityKwPerHour ?? dto.CapacityKwPerHour ?? 0),
    batteryStorageSlotCapacity: Number(
      dto.batteryStorageSlotCapacity ?? dto.BatteryStorageSlotCapacity ?? 0
    ),
  };
};

/**
 * Maps a station list response.
 *
 * @param {Array|object|null} response - Server response payload
 * @returns {Array} Normalized station list
 */
export const mapStationList = (response) => {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response.map(mapStation).filter(Boolean);
  }

  const nested = response.data ?? response.Data ?? response.items ?? response.Items;
  if (Array.isArray(nested)) {
    return nested.map(mapStation).filter(Boolean);
  }

  return [];
};

/**
 * Builds the create-slot request body expected by the C# API.
 *
 * @param {object} form - Form values
 * @returns {object} API request payload
 */
export const toCreateSlotRequest = (form) => ({
  slotStartUtc: form.slotStartUtc,
  slotEndUtc: form.slotEndUtc,
  capacityKw: Number(form.capacityKw),
  isAvailable: Boolean(form.isAvailable),
});

/**
 * Builds the update-slot request body expected by the C# API.
 *
 * @param {object} form - Form values
 * @returns {object} API request payload
 */
export const toUpdateSlotRequest = (form) => ({
  slotStartUtc: form.slotStartUtc,
  slotEndUtc: form.slotEndUtc,
  capacityKw: Number(form.capacityKw),
  isAvailable: Boolean(form.isAvailable),
});

/**
 * Formats a Date as a datetime-local input value (local timezone).
 *
 * @param {Date} date - Date to format
 * @returns {string} Value suitable for datetime-local input
 */
export const toLocalDateTimeInputValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/**
 * Converts a UTC ISO string to a datetime-local input value.
 *
 * @param {string|null} iso - UTC timestamp from API
 * @returns {string} Value suitable for datetime-local input
 */
export const utcIsoToLocalDateTimeInput = (iso) => {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return toLocalDateTimeInputValue(date);
};

/**
 * Converts a datetime-local input value to a UTC ISO string for the API.
 *
 * @param {string} localValue - datetime-local input value
 * @returns {string|null} UTC ISO string or null when empty
 */
export const localDateTimeInputToUtcIso = (localValue) => {
  if (!localValue || typeof localValue !== 'string') {
    return null;
  }

  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

/**
 * Formats a UTC timestamp for display in the UI.
 *
 * @param {string|null} iso - UTC timestamp
 * @returns {string} Human-readable date/time
 */
export const formatSlotDateTime = (iso) => {
  const parts = formatSlotDateTimeParts(iso);
  if (!parts) {
    return '—';
  }

  return `${parts.date}, ${parts.time}`;
};

/**
 * Splits a UTC timestamp into date and time parts for line-by-line UI.
 *
 * @param {string|null} iso - UTC timestamp
 * @returns {{ date: string, time: string }|null}
 */
export const formatSlotDateTimeParts = (iso) => {
  if (!iso) {
    return null;
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return {
    date: date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: date
      .toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })
      .replace(/ (AM|PM)$/i, '\u00A0$1'),
  };
};
