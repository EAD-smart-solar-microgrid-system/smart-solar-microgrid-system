package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

import org.json.JSONArray
import org.json.JSONObject

/**
 * Station reference DTO used for Member 4 SQLite station cache.
 */
data class StationReferenceDto(
    val id: String,
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val status: String,
    val capacityKwPerHour: Double,
    val batteryStorageSlotCapacity: Int
) {
    companion object {
        fun fromJson(json: JSONObject): StationReferenceDto {
            return StationReferenceDto(
                id = json.optString("id", json.optString("Id", "")),
                name = json.optString("stationName", json.optString("StationName", "")),
                latitude = json.optDouble("latitude", json.optDouble("Latitude", 0.0)),
                longitude = json.optDouble("longitude", json.optDouble("Longitude", 0.0)),
                status = json.optString("status", json.optString("Status", "")),
                capacityKwPerHour = json.optDouble(
                    "capacityKwPerHour",
                    json.optDouble("CapacityKwPerHour", 0.0)
                ),
                batteryStorageSlotCapacity = json.optInt(
                    "batteryStorageSlotCapacity",
                    json.optInt("BatteryStorageSlotCapacity", 0)
                )
            )
        }

        fun fromJsonArray(array: JSONArray?): List<StationReferenceDto> {
            if (array == null) {
                return emptyList()
            }

            val items = mutableListOf<StationReferenceDto>()
            for (index in 0 until array.length()) {
                val item = array.optJSONObject(index) ?: continue
                items.add(fromJson(item))
            }
            return items
        }

        fun fromJsonPayload(raw: String): List<StationReferenceDto> {
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
