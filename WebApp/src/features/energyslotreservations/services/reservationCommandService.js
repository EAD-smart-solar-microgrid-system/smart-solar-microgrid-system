/**
 * Reservation command calls against the existing booking endpoints.
 */

import httpClient from '../../../services/http/httpClient.js';

const withAuth = (options = {}) => {
  const token =
    options.token ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);

  return {
    ...options,
    token: token || undefined,
  };
};

export const approveReservation = async (reservationId, options = {}) => {
  if (!reservationId) {
    return {
      success: false,
      data: null,
      error: 'The reservation identifier is missing.',
      status: 400,
      validationErrors: null,
      isNetworkError: false,
      isAuthError: false,
      isForbidden: false,
    };
  }

  return httpClient.post(
    `reservations/${encodeURIComponent(reservationId)}/approve`,
    undefined,
    withAuth(options)
  );
};
