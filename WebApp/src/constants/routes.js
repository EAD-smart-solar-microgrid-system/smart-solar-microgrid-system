/**
 * Application Route Constants
 *
 * Defines canonical path definitions for all application routes.
 * Specific feature routes are placeholders for future member implementation.
 */

export const ROUTES = Object.freeze({
  HOME: '/',
  LOGIN: '/login',
  USER_MANAGEMENT: '/user-management',
  PROSUMER_MANAGEMENT: '/prosumer-management',
  MICROGRID_NODES: '/microgrid-nodes',
  ENERGY_SLOT_RESERVATIONS: '/energy-slot-reservations',
  RESERVATION_MONITORING: '/reservation-monitoring',
  NOT_FOUND: '*',
});

export default ROUTES;
