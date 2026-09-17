package com.example.smartsolarmicrogridtradingsystem.core.session

import android.content.Context
import android.content.SharedPreferences

/**
 * Manages lightweight authentication session persistence using private SharedPreferences.
 *
 * Security rules:
 * - Passwords are NEVER stored here or anywhere on the client.
 * - Stores only authentication token, user identifier (NIC), role, and login state flag.
 * - Login and registration network workflows are decoupled and must be implemented in their respective modules.
 */
class SessionManager(context: Context) {

    private val prefs: SharedPreferences = context.applicationContext.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )

    companion object {
        private const val PREFS_NAME = "smart_solar_session_prefs"
        private const val KEY_AUTH_TOKEN = "key_auth_token"
        private const val KEY_USER_IDENTIFIER = "key_user_identifier"
        private const val KEY_ROLE = "key_role"
        private const val KEY_IS_LOGGED_IN = "key_is_logged_in"
    }

    /**
     * Saves user session data upon successful server authentication.
     *
     * @param token Authentication Bearer token provided by the C# Web API.
     * @param userIdentifier Unique user identifier or NIC.
     * @param role User role (e.g. "Solar Prosumer", "Grid Operator", "Backoffice").
     */
    fun saveSession(token: String, userIdentifier: String, role: String) {
        prefs.edit()
            .putString(KEY_AUTH_TOKEN, token)
            .putString(KEY_USER_IDENTIFIER, userIdentifier)
            .putString(KEY_ROLE, role)
            .putBoolean(KEY_IS_LOGGED_IN, true)
            .apply()
    }

    /**
     * Retrieves the stored authentication token.
     */
    fun getToken(): String? {
        return prefs.getString(KEY_AUTH_TOKEN, null)
    }

    /**
     * Retrieves the stored user identifier (NIC).
     */
    fun getUserIdentifier(): String? {
        return prefs.getString(KEY_USER_IDENTIFIER, null)
    }

    /**
     * Retrieves the stored user role.
     */
    fun getRole(): String? {
        return prefs.getString(KEY_ROLE, null)
    }

    /**
     * Returns whether an active user session exists.
     */
    fun isLoggedIn(): Boolean {
        return prefs.getBoolean(KEY_IS_LOGGED_IN, false)
    }

    /**
     * Clears all session data from private storage upon sign-out.
     */
    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
