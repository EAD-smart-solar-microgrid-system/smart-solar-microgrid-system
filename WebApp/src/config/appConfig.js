/**
 * Shared application configuration.
 * Secrets and database credentials must never be placed in Vite client variables.
 */

import { apiConfig } from './apiConfig.js';

export const appConfig = Object.freeze({
  apiBaseUrl: `${apiConfig.baseUrl}/api`,
  /** Same Google Maps key as Android MAPS_API_KEY (Maps JavaScript API must be enabled). */
  googleMapsApiKey: (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim(),
  isDevelopment: Boolean(import.meta.env.DEV),
  isProduction: Boolean(import.meta.env.PROD),
});

export default appConfig;
