package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

/**
 * Operational transfer types for an energy slot reservation.
 * Strictly matches the backend ReservationType enum ("DropOff", "Charging").
 */
enum class ReservationType(val apiValue: String, val displayName: String) {
    DROP_OFF("DropOff", "Drop Off"),
    CHARGING("Charging", "Charging");

    companion object {
        /**
         * Safely resolves a raw API or display string to a valid [ReservationType].
         * Defaults to [DROP_OFF] if null, empty, or unrecognized.
         */
        fun fromString(value: String?): ReservationType {
            if (value.isNullOrBlank()) return DROP_OFF
            val normalized = value.trim()
            return entries.firstOrNull {
                it.apiValue.equals(normalized, ignoreCase = true) ||
                it.name.equals(normalized, ignoreCase = true)
            } ?: when (normalized.lowercase()) {
                "charging" -> CHARGING
                else -> DROP_OFF
            }
        }
    }
}
