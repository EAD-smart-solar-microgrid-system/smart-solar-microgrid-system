package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

import org.json.JSONArray
import org.json.JSONObject

/**
 * One operating-schedule entry from GET /api/member4/stations/nearby.
 */
data class NearbyStationScheduleDto(
    val dayOfWeek: String,
    val openTime: String,
    val closeTime: String
) {
    companion object {
        fun fromJson(json: JSONObject): NearbyStationScheduleDto {
            return NearbyStationScheduleDto(
                dayOfWeek = json.optString("dayOfWeek", json.optString("DayOfWeek", "")),
                openTime = json.optString("openTime", json.optString("OpenTime", "")),
                closeTime = json.optString("closeTime", json.optString("CloseTime", ""))
            )
        }

        fun fromJsonArray(array: JSONArray?): List<NearbyStationScheduleDto> {
            if (array == null) {
                return emptyList()
            }
            val items = mutableListOf<NearbyStationScheduleDto>()
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                items.add(fromJson(item))
            }
            return items
        }

        fun fromJsonString(raw: String?): List<NearbyStationScheduleDto> {
            if (raw.isNullOrBlank()) {
                return emptyList()
            }
            return try {
                fromJsonArray(JSONArray(raw))
            } catch (_: Exception) {
                emptyList()
            }
        }

        fun toJsonString(schedule: List<NearbyStationScheduleDto>): String {
            val array = JSONArray()
            schedule.forEach { entry ->
                array.put(
                    JSONObject()
                        .put("dayOfWeek", entry.dayOfWeek)
                        .put("openTime", entry.openTime)
                        .put("closeTime", entry.closeTime)
                )
            }
            return array.toString()
        }
    }
}
