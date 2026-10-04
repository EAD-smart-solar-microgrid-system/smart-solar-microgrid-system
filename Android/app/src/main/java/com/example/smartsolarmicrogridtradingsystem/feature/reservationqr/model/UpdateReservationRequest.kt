package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

import org.json.JSONObject

/**
 * Request payload for modifying a scheduled energy slot reservation via PUT /api/reservations/{id}.
 * Note: Per backend contract, station changes are not allowed on existing reservations.
 *
 * @property reservationDateTime Updated reservation timestamp in ISO-8601 format.
 * @property slotId Optional updated slot identifier.
 * @property reservationType Optional updated operational type (e.g. "DropOff", "Charging").
 */
data class UpdateReservationRequest(
    val reservationDateTime: String,
    val slotId: String? = null,
    val reservationType: String? = null
) {
    /**
     * Serializes this request into a [JSONObject] matching backend C# property conventions.
     */
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("reservationDateTime", reservationDateTime)
            if (!slotId.isNullOrBlank()) {
                put("slotId", slotId)
            }
            if (!reservationType.isNullOrBlank()) {
                put("reservationType", reservationType)
            }
        }
    }
}
