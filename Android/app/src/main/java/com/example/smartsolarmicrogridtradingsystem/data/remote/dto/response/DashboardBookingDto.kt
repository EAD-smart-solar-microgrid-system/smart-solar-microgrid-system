package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

import org.json.JSONArray
import org.json.JSONObject

/**
 * Single recent or monitored booking row returned by Member 4 dashboard/monitoring APIs.
 */
data class DashboardBookingDto(
    val id: String,
    val stationId: String,
    val slotId: String,
    val prosumerId: String,
    val reservationDateTime: String,
    val status: String,
    val reservationType: String,
    val createdAt: String,
    val updatedAt: String
) {
    companion object {
        fun fromJson(json: JSONObject): DashboardBookingDto {
            return DashboardBookingDto(
                id = json.optString("id", json.optString("Id", "")),
                stationId = json.optString("stationId", json.optString("StationId", "")),
                slotId = json.optString("slotId", json.optString("SlotId", "")),
                prosumerId = json.optString("prosumerId", json.optString("ProsumerId", "")),
                reservationDateTime = json.optString(
                    "reservationDateTime",
                    json.optString("ReservationDateTime", "")
                ),
                status = json.optString("status", json.optString("Status", "")),
                reservationType = json.optString(
                    "reservationType",
                    json.optString("ReservationType", "")
                ),
                createdAt = json.optString("createdAt", json.optString("CreatedAt", "")),
                updatedAt = json.optString("updatedAt", json.optString("UpdatedAt", ""))
            )
        }

        fun fromJsonArray(array: JSONArray?): List<DashboardBookingDto> {
            if (array == null) {
                return emptyList()
            }

            val items = mutableListOf<DashboardBookingDto>()
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                items.add(fromJson(item))
            }
            return items
        }
    }
}
