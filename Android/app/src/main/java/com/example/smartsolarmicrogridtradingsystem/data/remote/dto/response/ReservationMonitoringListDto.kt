package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

import org.json.JSONObject

/**
 * Paginated reservation monitoring list returned by GET /api/member4/reservation-monitoring.
 */
data class ReservationMonitoringListDto(
    val items: List<DashboardBookingDto>,
    val totalCount: Int,
    val page: Int,
    val pageSize: Int
) {
    companion object {
        fun fromJson(json: JSONObject): ReservationMonitoringListDto {
            val itemsJson = json.optJSONArray("items") ?: json.optJSONArray("Items")

            return ReservationMonitoringListDto(
                items = DashboardBookingDto.fromJsonArray(itemsJson),
                totalCount = json.optInt("totalCount", json.optInt("TotalCount", 0)),
                page = json.optInt("page", json.optInt("Page", 1)),
                pageSize = json.optInt("pageSize", json.optInt("PageSize", 20))
            )
        }
    }
}
