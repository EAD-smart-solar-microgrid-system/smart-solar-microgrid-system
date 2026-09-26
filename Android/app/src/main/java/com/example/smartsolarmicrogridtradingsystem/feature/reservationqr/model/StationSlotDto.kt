package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

import org.json.JSONArray
import org.json.JSONObject

/**
 * Public response contract for an energy booking slot at a microgrid station.
 * Exactly matches backend EnergyBookingSlotResponse DTO from GET /api/stations/{stationId}/slots.
 *
 * @property id Unique slot identifier.
 * @property stationId Identifier of the parent charging station.
 * @property slotStartUtc ISO-8601 start timestamp of the slot window.
 * @property slotEndUtc ISO-8601 end timestamp of the slot window.
 * @property capacityKw Power rating capacity in kilowatts.
 * @property isAvailable Availability flag indicating if slot can accept bookings.
 */
data class StationSlotDto(
    val id: String,
    val stationId: String,
    val slotStartUtc: String,
    val slotEndUtc: String,
    val capacityKw: Double,
    val isAvailable: Boolean
) {
    companion object {
        /**
         * Parses a single [JSONObject] into a [StationSlotDto].
         */
        fun fromJson(json: JSONObject): StationSlotDto {
            return StationSlotDto(
                id = json.optString("id", json.optString("Id", "")),
                stationId = json.optString("stationId", json.optString("StationId", "")),
                slotStartUtc = json.optString("slotStartUtc", json.optString("SlotStartUtc", "")),
                slotEndUtc = json.optString("slotEndUtc", json.optString("SlotEndUtc", "")),
                capacityKw = json.optDouble("capacityKw", json.optDouble("CapacityKw", 0.0)),
                isAvailable = json.optBoolean("isAvailable", json.optBoolean("IsAvailable", true))
            )
        }

        /**
         * Parses a [JSONArray] of slot objects into a list of [StationSlotDto].
         */
        fun fromJsonArray(array: JSONArray?): List<StationSlotDto> {
            if (array == null) return emptyList()
            val list = mutableListOf<StationSlotDto>()
            for (i in 0 until array.length()) {
                val item = array.optJSONObject(i) ?: continue
                list.add(fromJson(item))
            }
            return list
        }

        /**
         * Parses raw JSON string payload (either direct array or wrapped object).
         */
        fun fromJsonPayload(raw: String): List<StationSlotDto> {
            val trimmed = raw.trim()
            if (trimmed.startsWith("[")) {
                return fromJsonArray(JSONArray(trimmed))
            }
            val obj = JSONObject(trimmed)
            val nested = obj.optJSONArray("items")
                ?: obj.optJSONArray("Items")
                ?: obj.optJSONArray("data")
                ?: obj.optJSONArray("Data")
            return fromJsonArray(nested)
        }
    }
}
