/**
 * User Role Constants
 *
 * Authoritative role verification is performed by the C# Web API.
 * These constants represent the approved roles for the client application.
 */

export const BACKOFFICE = 'Backoffice';
export const GRID_OPERATOR = 'Grid Operator';

export const ROLES = Object.freeze({
  BACKOFFICE,
  GRID_OPERATOR,
});

export default ROLES;
