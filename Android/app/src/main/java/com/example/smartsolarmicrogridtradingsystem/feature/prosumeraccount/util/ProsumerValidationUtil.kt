package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.util

import android.util.Patterns

/**
 * Validation utilities for Solar Prosumer registration and profile editing.
 * Implements strict adherence to Sri Lankan NIC, phone, and standard profile rules.
 */
object ProsumerValidationUtil {

    private val OLD_NIC_REGEX = Regex("^\\d{9}[VX]$")
    private val NEW_NIC_REGEX = Regex("^\\d{12}$")
    private val SRI_LANKAN_PHONE_REGEX = Regex("^(0\\d{9}|\\+94\\d{9})$")
    private val FULL_NAME_REGEX = Regex("^[\\p{L}\\p{M} .'-]+$")
    private val FALLBACK_EMAIL_REGEX = Regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")

    /**
     * Normalizes an NIC string by trimming whitespace and converting to uppercase.
     */
    fun normalizeNic(nic: String?): String {
        return nic?.trim()?.uppercase() ?: ""
    }

    /**
     * Validates whether an NIC matches the standard Sri Lankan format:
     * - Old NIC: 9 digits followed by V or X (case-insensitive before normalization)
     * - New NIC: 12 digits
     */
    fun isValidNic(nic: String?): Boolean {
        val normalized = normalizeNic(nic)
        if (normalized.isEmpty()) return false
        return OLD_NIC_REGEX.matches(normalized) || NEW_NIC_REGEX.matches(normalized)
    }

    /**
     * Validates whether a full name is syntactically valid:
     * - At least 2 characters and at most 100 characters
     * - Contains legitimate name characters (letters, spaces, periods, apostrophes, hyphens)
     * - Rejects numbers and special symbols
     */
    fun isValidFullName(name: String?): Boolean {
        val trimmed = name?.trim().orEmpty()
        if (trimmed.length < 2 || trimmed.length > 100) return false
        return FULL_NAME_REGEX.matches(trimmed)
    }

    /**
     * Validates email format using platform Patterns or RFC-compliant fallback regex.
     */
    fun isValidEmail(email: String?): Boolean {
        val trimmed = email?.trim().orEmpty()
        if (trimmed.isEmpty()) return false
        val platformPattern = try {
            Patterns.EMAIL_ADDRESS
        } catch (_: Throwable) {
            null
        }
        return if (platformPattern != null) {
            platformPattern.matcher(trimmed).matches()
        } else {
            FALLBACK_EMAIL_REGEX.matches(trimmed)
        }
    }

    /**
     * Validates a Sri Lankan phone number (optional field).
     * If blank/null, considered valid (absent).
     * If provided, must match either:
     * - 07XXXXXXXX (or 0XXXXXXXXX - 10 digits starting with 0)
     * - +947XXXXXXXX (or +94XXXXXXXXX - starting with +94 followed by 9 digits)
     * Spaces and hyphens are permitted during input. Letters are rejected.
     */
    fun isValidPhoneNumber(phone: String?): Boolean {
        val trimmed = phone?.trim().orEmpty()
        if (trimmed.isEmpty()) return true
        if (trimmed.any { it.isLetter() }) return false
        val cleaned = trimmed.replace(" ", "").replace("-", "")
        return SRI_LANKAN_PHONE_REGEX.matches(cleaned)
    }

    /**
     * Validates a residential address (optional field).
     * If provided, enforces a reasonable maximum length (250 chars) without restricting valid address symbols.
     */
    fun isValidAddress(address: String?): Boolean {
        val trimmed = address?.trim().orEmpty()
        if (trimmed.isEmpty()) return true
        return trimmed.length <= 250
    }
}
