package com.example.smartsolarmicrogridtradingsystem.data.local.model

/**
 * Entity representing a locally persisted user session in the SQLite database.
 *
 * Security rules:
 * - Passwords are strictly omitted.
 */
data class LocalSession(
    val id: Long = 0L,
    val userIdentifier: String,
    val role: String,
    val lastUpdated: Long
)
