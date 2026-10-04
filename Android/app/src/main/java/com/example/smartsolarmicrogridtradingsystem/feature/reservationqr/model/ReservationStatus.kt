package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

/**
 * Lifecycle statuses for an energy slot reservation.
 * Maps to backend ReservationStatus enum values ("Pending", "Approved", "Cancelled", "Completed").
 */
enum class ReservationStatus(val apiValue: String, val displayName: String) {
    PENDING("Pending", "Pending"),
    APPROVED("Approved", "Approved"),
    CANCELLED("Cancelled", "Cancelled"),
    COMPLETED("Completed", "Completed");

    companion object {
        /**
         * Safely resolves a raw API string to a valid [ReservationStatus].
         * Defaults to [PENDING] if null or unrecognized.
         */
        fun fromString(value: String?): ReservationStatus {
            if (value.isNullOrBlank()) return PENDING
            val normalized = value.trim()
            return entries.firstOrNull {
                it.apiValue.equals(normalized, ignoreCase = true) ||
                it.name.equals(normalized, ignoreCase = true)
            } ?: PENDING
        }
    }
}
