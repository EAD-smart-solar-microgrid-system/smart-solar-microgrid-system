package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

import org.json.JSONArray
import org.json.JSONObject

/**
 * Normalized energy slot reservation details returned by the C# Web API.
 * Exactly matches backend ReservationResponse DTO.
 *
 * @property id Unique reservation identifier.
 * @property prosumerNic National Identity Card number of the reserving prosumer.
 * @property stationId Identifier of the charging station.
 * @property slotId Identifier of the booked slot at the station.
 * @property reservationDateTime Scheduled reservation timestamp in ISO-8601 format.
 * @property reservationType Operational reservation type ("DropOff", "Charging").
 * @property status Current reservation status ("Pending", "Approved", "Cancelled", "Completed").
 * @property cancellationReason Optional remarks provided if cancelled.
 * @property cancelledAt Timestamp when cancelled, or null.
 * @property qrToken Cryptographic token string if generated, null otherwise.
 * @property createdAt Timestamp when the reservation record was created.
 * @property updatedAt Timestamp when the reservation was last updated.
 */
data class ReservationDto(
    val id: String,
    val prosumerNic: String,
    val stationId: String,
    val slotId: String,
    val reservationDateTime: String,
    val reservationType: String,
    val status: String,
    val cancellationReason: String? = null,
    val cancelledAt: String? = null,
    val qrToken: String? = null,
    val createdAt: String = "",
    val updatedAt: String = ""
) {
    /**
     * Resolves the raw status string into a strongly-typed [ReservationStatus].
     */
    val parsedStatus: ReservationStatus
        get() = ReservationStatus.fromString(status)

    /**
     * Resolves the raw type string into a strongly-typed [ReservationType].
     */
    val parsedType: ReservationType
        get() = ReservationType.fromString(reservationType)

    companion object {
        /**
         * Parses a [JSONObject] into a [ReservationDto], checking both camelCase and PascalCase keys
         * and properly treating JSON null values.
         */
        fun fromJson(json: JSONObject): ReservationDto {
            return ReservationDto(
                id = json.optString("id", json.optString("Id", "")),
                prosumerNic = json.optString("prosumerNic", json.optString("ProsumerNic", "")),
                stationId = json.optString("stationId", json.optString("StationId", "")),
                slotId = json.optString("slotId", json.optString("SlotId", "")),
                reservationDateTime = json.optString(
                    "reservationDateTime",
                    json.optString("ReservationDateTime", "")
                ),
                reservationType = json.optString(
                    "reservationType",
                    json.optString("ReservationType", "")
                ),
                status = json.optString("status", json.optString("Status", "")),
                cancellationReason = optNullableString(json, "cancellationReason", "CancellationReason"),
                cancelledAt = optNullableString(json, "cancelledAt", "CancelledAt"),
                qrToken = optNullableString(json, "qrToken", "QrToken"),
                createdAt = json.optString("createdAt", json.optString("CreatedAt", "")),
                updatedAt = json.optString("updatedAt", json.optString("UpdatedAt", ""))
            )
        }

        /**
         * Parses a [JSONArray] of reservation JSON objects into a list of [ReservationDto].
         */
        fun fromJsonArray(array: JSONArray?): List<ReservationDto> {
            if (array == null) return emptyList()
            val items = mutableListOf<ReservationDto>()
            for (i in 0 until array.length()) {
                val obj = array.optJSONObject(i) ?: continue
                items.add(fromJson(obj))
            }
            return items
        }

        private fun optNullableString(json: JSONObject, camelKey: String, pascalKey: String): String? {
            val key = if (json.has(camelKey)) camelKey else if (json.has(pascalKey)) pascalKey else null
            if (key == null || json.isNull(key)) return null
            val value = json.optString(key, "")
            return if (value.isBlank()) null else value
        }
    }
}
