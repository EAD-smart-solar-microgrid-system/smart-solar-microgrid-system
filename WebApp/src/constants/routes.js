/**
 * Application Route Constants
 *
 * Defines canonical path definitions for the shared app and Member 3 feature.
 */

export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  USER_MANAGEMENT: '/user-management',
  ADMIN_SETTINGS: '/admin-settings',
  PROSUMER_MANAGEMENT: '/prosumer-management',
  MICROGRID_NODES: '/microgrid-nodes',
  STATIONS: '/stations',
  ENERGY_SLOT_RESERVATIONS: '/energy-slot-reservations',
  RESERVATION_MONITORING: '/reservation-monitoring',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  NOT_FOUND: '*',
});

export default ROUTES;
