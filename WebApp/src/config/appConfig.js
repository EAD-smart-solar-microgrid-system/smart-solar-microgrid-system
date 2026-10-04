/**
 * Shared application configuration.
 * Secrets and database credentials must never be placed in Vite client variables.
 */

import { apiConfig } from './apiConfig.js';

export const appConfig = Object.freeze({
  apiBaseUrl: `${apiConfig.baseUrl}/api`,
  isDevelopment: Boolean(import.meta.env.DEV),
  isProduction: Boolean(import.meta.env.PROD),
});

export default appConfig;
