package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

import org.json.JSONObject

/**
 * Prosumer dashboard summary returned by GET /api/member4/dashboard/prosumer/{prosumerId}.
 */
data class ProsumerDashboardDto(
    val prosumerId: String,
    val pendingReservationCount: Int,
    val approvedFutureReservationCount: Int,
    val recentBookings: List<DashboardBookingDto>
) {
    companion object {
        fun fromJson(json: JSONObject): ProsumerDashboardDto {
            val bookingsJson = json.optJSONArray("recentBookings")
                ?: json.optJSONArray("RecentBookings")

            return ProsumerDashboardDto(
                prosumerId = json.optString("prosumerId", json.optString("ProsumerId", "")),
                pendingReservationCount = json.optInt(
                    "pendingReservationCount",
                    json.optInt("PendingReservationCount", 0)
                ),
                approvedFutureReservationCount = json.optInt(
                    "approvedFutureReservationCount",
                    json.optInt("ApprovedFutureReservationCount", 0)
                ),
                recentBookings = DashboardBookingDto.fromJsonArray(bookingsJson)
            )
        }
    }
}
