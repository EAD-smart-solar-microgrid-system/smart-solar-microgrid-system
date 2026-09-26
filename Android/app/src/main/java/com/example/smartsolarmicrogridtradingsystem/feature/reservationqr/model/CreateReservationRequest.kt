package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

import org.json.JSONObject

/**
 * Request payload for creating a new energy slot reservation via POST /api/reservations.
 *
 * @property prosumerNic National Identity Card number of the reserving prosumer.
 * @property stationId Identifier of the target charging station.
 * @property slotId Identifier of the selected slot at the station.
 * @property reservationDateTime Scheduled reservation start timestamp in ISO-8601 format.
 * @property reservationType Optional operational type (e.g. "DropOff", "Charging").
 */
data class CreateReservationRequest(
    val prosumerNic: String,
    val stationId: String,
    val slotId: String,
    val reservationDateTime: String,
    val reservationType: String? = null
) {
    /**
     * Serializes this request into a [JSONObject] matching backend C# property conventions.
     */
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("prosumerNic", prosumerNic)
            put("stationId", stationId)
            put("slotId", slotId)
            put("reservationDateTime", reservationDateTime)
            if (!reservationType.isNullOrBlank()) {
                put("reservationType", reservationType)
            }
        }
    }
}
