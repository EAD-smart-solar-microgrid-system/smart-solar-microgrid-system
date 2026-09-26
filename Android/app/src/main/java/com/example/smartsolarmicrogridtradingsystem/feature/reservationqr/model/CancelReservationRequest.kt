package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

import org.json.JSONObject

/**
 * Optional remarks payload when cancelling a scheduled energy reservation via POST /api/reservations/{id}/cancel.
 *
 * @property reason Optional cancellation justification provided by the prosumer.
 */
data class CancelReservationRequest(
    val reason: String? = null
) {
    /**
     * Serializes this request into a [JSONObject] matching backend C# property conventions.
     */
    fun toJson(): JSONObject {
        return JSONObject().apply {
            if (!reason.isNullOrBlank()) {
                put("reason", reason)
            }
        }
    }
}
