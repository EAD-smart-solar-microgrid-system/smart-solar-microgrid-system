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
    val updatedAt: String,
    val hubId: String = "",
    val prosumerName: String = "",
    val stationName: String = "",
    val bookingId: String = ""
) {
    companion object {
        fun fromJson(json: JSONObject): DashboardBookingDto {
            val rawId = json.optString("id", json.optString("Id", ""))
            val rawBookingId = json.optString(
                "bookingId",
                json.optString(
                    "BookingId",
                    com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui.DashboardUiFormatter.formatBookingId(rawId)
                )
            )

            return DashboardBookingDto(
                id = rawId,
                stationId = json.optString("stationId", json.optString("StationId", "")),
                slotId = json.optString("slotId", json.optString("SlotId", "")),
                prosumerId = json.optString(
                    "prosumerId",
                    json.optString(
                        "ProsumerId",
                        json.optString("prosumerNic", json.optString("ProsumerNic", ""))
                    )
                ),
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
                updatedAt = json.optString("updatedAt", json.optString("UpdatedAt", "")),
                hubId = json.optString("hubId", json.optString("HubId", "")),
                prosumerName = json.optString("prosumerName", json.optString("ProsumerName", "")),
                stationName = json.optString("stationName", json.optString("StationName", "")),
                bookingId = rawBookingId
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
