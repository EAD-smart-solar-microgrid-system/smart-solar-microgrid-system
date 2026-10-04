/**
 * Prosumer DTO & ViewModel Mapper Utilities
 *
 * Provides bidirectional mapping and data normalization between
 * the C# Web API DTOs and the Web client UI models.
 */

/**
 * Supported Prosumer account lifecycle status constants.
 */
export const PROSUMER_STATUS = Object.freeze({
  PENDING: 'Pending',
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
});

/**
 * Normalizes an NIC input safely.
 * Trims whitespace, converts letters to uppercase, and safely handles null/undefined.
 *
 * @param {string|any} nic - Raw NIC input
 * @returns {string} Normalized uppercase NIC string
 */
export const normalizeNic = (nic) => {
  if (nic === null || nic === undefined) {
    return '';
  }
  return String(nic).trim().toUpperCase();
};

/**
 * Maps a single prosumer DTO from the server into a predictable camelCase UI model.
 * Handles both camelCase and PascalCase property conventions without fabricating business values.
 *
 * @param {object|null} dto - Raw prosumer DTO from API response
 * @returns {object|null} Normalized prosumer view model or null if input is invalid
 */
export const mapProsumer = (dto) => {
  if (!dto || typeof dto !== 'object') {
    return null;
  }

  const rawNic = dto.nic ?? dto.Nic ?? dto.NIC ?? '';
  const rawStatus = dto.status ?? dto.Status;

  let normalizedStatus = '';
  if (typeof rawStatus === 'string') {
    const trimmedStatus = rawStatus.trim();
    const matchedStatus = Object.values(PROSUMER_STATUS).find(
      (val) => val.toLowerCase() === trimmedStatus.toLowerCase()
    );
    normalizedStatus = matchedStatus || trimmedStatus;
  }

  return {
    nic: normalizeNic(rawNic),
    fullName: (dto.fullName ?? dto.FullName ?? '').trim(),
    email: (dto.email ?? dto.Email ?? '').trim(),
    phone: (dto.phone ?? dto.Phone ?? '').trim(),
    address: (dto.address ?? dto.Address ?? '').trim(),
    status: normalizedStatus,
    registeredAt: dto.registeredAt ?? dto.RegisteredAt ?? dto.createdAt ?? dto.CreatedAt ?? null,
    updatedAt: dto.updatedAt ?? dto.UpdatedAt ?? null,
  };
};

/**
 * Maps a prosumer list response (direct array or paginated object) into a standardized structure.
 *
 * @param {Array|object} response - Server response payload
 * @returns {{ data: Array, total: number, page: number, pageSize: number }} Standardized list
 */
export const mapProsumerList = (response) => {
  if (!response) {
    return { data: [], total: 0, page: 1, pageSize: 0 };
  }

  // Case 1: Direct array response
  if (Array.isArray(response)) {
    const data = response.map(mapProsumer).filter(Boolean);
    return {
      data,
      total: data.length,
      page: 1,
      pageSize: data.length,
    };
  }

  // Case 2: Paginated object response (supporting data, items, or prosumers arrays)
  if (typeof response === 'object') {
    const rawItems = Array.isArray(response.data)
      ? response.data
      : Array.isArray(response.items)
      ? response.items
      : Array.isArray(response.prosumers)
      ? response.prosumers
      : [];

    const data = rawItems.map(mapProsumer).filter(Boolean);
    const total =
      typeof response.total === 'number'
        ? response.total
        : typeof response.Total === 'number'
        ? response.Total
        : data.length;

    const page =
      typeof response.page === 'number'
        ? response.page
        : typeof response.Page === 'number'
        ? response.Page
        : 1;

    const pageSize =
      typeof response.pageSize === 'number'
        ? response.pageSize
        : typeof response.PageSize === 'number'
        ? response.PageSize
        : data.length;

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  return { data: [], total: 0, page: 1, pageSize: 0 };
};

/**
 * Transforms form values into a payload for prosumer creation.
 * Excludes status and guarantees NIC is normalized.
 *
 * @param {object} formData - Raw UI form input
 * @returns {object} API request body for POST /prosumers
 */
export const toCreateProsumerRequest = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return {
      nic: '',
      fullName: '',
      email: '',
      phone: '',
      address: '',
    };
  }

  return {
    nic: normalizeNic(formData.nic),
    fullName: (formData.fullName || '').trim(),
    email: (formData.email || '').trim(),
    phone: (formData.phone || '').trim(),
    address: (formData.address || '').trim(),
  };
};

/**
 * Transforms form values into a payload for prosumer update.
 * Strictly excludes NIC (immutable primary key) and status.
 *
 * @param {object} formData - Raw UI form input
 * @returns {object} API request body for PUT /prosumers/{nic}
 */
export const toUpdateProsumerRequest = (formData) => {
  if (!formData || typeof formData !== 'object') {
    return {
      fullName: '',
      email: '',
      phone: '',
      address: '',
    };
  }

  return {
    fullName: (formData.fullName || '').trim(),
    email: (formData.email || '').trim(),
    phone: (formData.phone || '').trim(),
    address: (formData.address || '').trim(),
  };
};

export default {
  PROSUMER_STATUS,
  normalizeNic,
  mapProsumer,
  mapProsumerList,
  toCreateProsumerRequest,
  toUpdateProsumerRequest,
};
