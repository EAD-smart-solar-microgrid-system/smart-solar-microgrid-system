package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

import org.json.JSONArray
import org.json.JSONObject

/**
 * Nearby station payload from GET /api/member4/stations/nearby.
 */
data class NearbyStationDto(
    val id: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val distanceKm: Double,
    val status: String,
    val capacityKwPerHour: Double,
    val batteryStorageSlotCapacity: Int,
    val operatingSchedule: List<NearbyStationScheduleDto>,
    val isFromCache: Boolean = false
) {
    companion object {
        fun fromJson(json: JSONObject): NearbyStationDto {
            val scheduleJson = json.optJSONArray("operatingSchedule")
                ?: json.optJSONArray("OperatingSchedule")

            return NearbyStationDto(
                id = json.optString("id", json.optString("Id", "")),
                name = json.optString("name", json.optString("Name", "")),
                latitude = json.optDouble("latitude", json.optDouble("Latitude", 0.0)),
                longitude = json.optDouble("longitude", json.optDouble("Longitude", 0.0)),
                distanceKm = json.optDouble("distanceKm", json.optDouble("DistanceKm", 0.0)),
                status = json.optString("status", json.optString("Status", "")),
                capacityKwPerHour = json.optDouble(
                    "capacityKwPerHour",
                    json.optDouble("CapacityKwPerHour", 0.0)
                ),
                batteryStorageSlotCapacity = json.optInt(
                    "batteryStorageSlotCapacity",
                    json.optInt("BatteryStorageSlotCapacity", 0)
                ),
                operatingSchedule = NearbyStationScheduleDto.fromJsonArray(scheduleJson),
                isFromCache = false
            )
        }

        fun fromJsonArray(array: JSONArray?): List<NearbyStationDto> {
            if (array == null) {
                return emptyList()
            }
            val items = mutableListOf<NearbyStationDto>()
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                items.add(fromJson(item))
            }
            return items
        }

        fun fromJsonPayload(raw: String): List<NearbyStationDto> {
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
