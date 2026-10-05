package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.NearbyStationDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.NearbyStationScheduleDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.StationReferenceDto
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.sqlite.StationCacheContract
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.sqlite.StationCacheHelper
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Local station/reference cache used by Member 4 screens for offline name lookup
 * and nearby-map fallback when the network request fails.
 */
class StationCacheRepository(context: Context) {

    private val helper = StationCacheHelper.getInstance(context)

    private val appContext = context.applicationContext

    fun replaceAll(stations: List<StationReferenceDto>, onComplete: (() -> Unit)? = null) {
        AppExecutors.executeInBackground {
            val db = helper.writableDatabase
            db.beginTransaction()
            try {
                db.delete(StationCacheContract.StationEntry.TABLE_NAME, null, null)
                val now = System.currentTimeMillis()
                stations.forEach { station ->
                    val resolvedHubId = station.hubId.ifBlank { station.id }
                    cacheStation(station.id, resolvedHubId, station.name)
                    insertStation(
                        db = db,
                        stationId = station.id,
                        name = station.name,
                        latitude = station.latitude,
                        longitude = station.longitude,
                        status = station.status,
                        capacityKwPerHour = station.capacityKwPerHour,
                        batteryStorageSlotCapacity = station.batteryStorageSlotCapacity,
                        scheduleJson = "[]",
                        lastSynced = now
                    )
                    if (station.hubId.isNotBlank() && station.hubId != station.id) {
                        insertStation(
                            db = db,
                            stationId = station.hubId,
                            name = station.name,
                            latitude = station.latitude,
                            longitude = station.longitude,
                            status = station.status,
                            capacityKwPerHour = station.capacityKwPerHour,
                            batteryStorageSlotCapacity = station.batteryStorageSlotCapacity,
                            scheduleJson = "[]",
                            lastSynced = now
                        )
                    }
                }
                db.setTransactionSuccessful()
            } finally {
                db.endTransaction()
            }

            AppExecutors.executeOnMainThread {
                onComplete?.invoke()
            }
        }
    }

    /**
     * Upserts nearby API results so maps can fall back to SQLite when offline.
     */
    fun upsertNearbyStations(stations: List<NearbyStationDto>, onComplete: (() -> Unit)? = null) {
        AppExecutors.executeInBackground {
            val db = helper.writableDatabase
            db.beginTransaction()
            try {
                val now = System.currentTimeMillis()
                stations.forEach { station ->
                    insertStation(
                        db = db,
                        stationId = station.id,
                        name = station.name,
                        latitude = station.latitude,
                        longitude = station.longitude,
                        status = station.status,
                        capacityKwPerHour = station.capacityKwPerHour,
                        batteryStorageSlotCapacity = station.batteryStorageSlotCapacity,
                        scheduleJson = NearbyStationScheduleDto.toJsonString(station.operatingSchedule),
                        lastSynced = now
                    )
                }
                db.setTransactionSuccessful()
            } finally {
                db.endTransaction()
            }

            AppExecutors.executeOnMainThread {
                onComplete?.invoke()
            }
        }
    }

    fun getStationName(stationId: String, onResult: (String?) -> Unit) {
        if (stationId.isBlank()) {
            onResult(null)
            return
        }

        val memName = stationNameMemoryCache[stationId]
        if (!memName.isNullOrBlank()) {
            onResult(memName)
            return
        }

        AppExecutors.executeInBackground {
            val db = helper.readableDatabase
            val cursor = db.query(
                StationCacheContract.StationEntry.TABLE_NAME,
                arrayOf(StationCacheContract.StationEntry.COLUMN_STATION_NAME),
                "${StationCacheContract.StationEntry.COLUMN_STATION_ID} = ?",
                arrayOf(stationId),
                null,
                null,
                null,
                "1"
            )

            var name: String? = null
            cursor.use {
                if (it.moveToFirst()) {
                    name = it.getString(0)
                }
            }

            if (!name.isNullOrBlank()) {
                stationNameMemoryCache[stationId] = name!!
                AppExecutors.executeOnMainThread {
                    onResult(name)
                }
                return@executeInBackground
            }

            // Fallback: If not found in SQLite cache, fetch stations list from API and populate cache
            val token = com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager(appContext).getToken()
            com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient.sendRequest(
                method = com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod.GET,
                endpoint = "stations",
                bearerToken = token,
                callback = object : com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback<String> {
                    override fun onSuccess(result: com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult.Success<String>) {
                        try {
                            val stations = StationReferenceDto.fromJsonPayload(result.responseBody)
                            if (stations.isNotEmpty()) {
                                replaceAll(stations) {
                                    val matched = stations.firstOrNull { it.id == stationId || it.hubId == stationId }
                                    onResult(matched?.name)
                                }
                                return
                            }
                        } catch (_: Exception) {}
                        AppExecutors.executeOnMainThread { onResult(null) }
                    }

                    override fun onError(error: com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult<Nothing>) {
                        AppExecutors.executeOnMainThread { onResult(null) }
                    }
                }
            )
        }
    }

    fun getHubId(stationId: String, onResult: (String?) -> Unit) {
        if (stationId.isBlank()) {
            onResult(null)
            return
        }

        if (stationId.startsWith("HUB-", ignoreCase = true)) {
            onResult(stationId)
            return
        }

        val memHub = hubIdMemoryCache[stationId]
        if (!memHub.isNullOrBlank()) {
            onResult(memHub)
            return
        }

        val token = com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager(appContext).getToken()
        com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient.sendRequest(
            method = com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod.GET,
            endpoint = "stations",
            bearerToken = token,
            callback = object : com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback<String> {
                override fun onSuccess(result: com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult.Success<String>) {
                    try {
                        val stations = StationReferenceDto.fromJsonPayload(result.responseBody)
                        if (stations.isNotEmpty()) {
                            replaceAll(stations) {
                                val matched = stations.firstOrNull { it.id.equals(stationId, true) || it.hubId.equals(stationId, true) }
                                val found = matched?.hubId?.takeIf { it.isNotBlank() } ?: matched?.id
                                onResult(found)
                            }
                            return
                        }
                    } catch (_: Exception) {}
                    AppExecutors.executeOnMainThread { onResult(null) }
                }

                override fun onError(error: com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult<Nothing>) {
                    AppExecutors.executeOnMainThread { onResult(null) }
                }
            }
        )
    }

    fun getAll(onResult: (List<StationReferenceDto>) -> Unit) {
        AppExecutors.executeInBackground {
            val stations = readAllStations()
            AppExecutors.executeOnMainThread {
                onResult(
                    stations.map { nearby ->
                        StationReferenceDto(
                            id = nearby.id,
                            name = nearby.name,
                            latitude = nearby.latitude,
                            longitude = nearby.longitude,
                            status = nearby.status,
                            capacityKwPerHour = nearby.capacityKwPerHour,
                            batteryStorageSlotCapacity = nearby.batteryStorageSlotCapacity
                        )
                    }
                )
            }
        }
    }

    /**
     * Returns cached stations within [radiusKm] of the given coordinates (haversine).
     */
    fun getNearbyFromCache(
        latitude: Double,
        longitude: Double,
        radiusKm: Double,
        onResult: (List<NearbyStationDto>) -> Unit
    ) {
        AppExecutors.executeInBackground {
            val nearby = readAllStations()
                .map { station ->
                    station.copy(
                        distanceKm = haversineKm(
                            latitude,
                            longitude,
                            station.latitude,
                            station.longitude
                        ),
                        isFromCache = true
                    )
                }
                .filter { it.distanceKm <= radiusKm }
                .sortedBy { it.distanceKm }

            AppExecutors.executeOnMainThread {
                onResult(nearby)
            }
        }
    }

    private fun readAllStations(): List<NearbyStationDto> {
        val db = helper.readableDatabase
        val cursor = db.query(
            StationCacheContract.StationEntry.TABLE_NAME,
            null,
            null,
            null,
            null,
            null,
            "${StationCacheContract.StationEntry.COLUMN_STATION_NAME} ASC"
        )

        val stations = mutableListOf<NearbyStationDto>()
        cursor.use {
            val idIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_STATION_ID)
            val nameIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_STATION_NAME)
            val latIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_LATITUDE)
            val lonIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_LONGITUDE)
            val statusIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_STATUS)
            val capacityIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_CAPACITY_KW)
            val batteryIndex =
                it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_BATTERY_SLOT_CAPACITY)
            val scheduleIndex =
                it.getColumnIndex(StationCacheContract.StationEntry.COLUMN_SCHEDULE_JSON)

            while (it.moveToNext()) {
                val scheduleRaw = if (scheduleIndex >= 0) it.getString(scheduleIndex) else "[]"
                stations.add(
                    NearbyStationDto(
                        id = it.getString(idIndex),
                        name = it.getString(nameIndex),
                        latitude = it.getDouble(latIndex),
                        longitude = it.getDouble(lonIndex),
                        distanceKm = 0.0,
                        status = it.getString(statusIndex),
                        capacityKwPerHour = it.getDouble(capacityIndex),
                        batteryStorageSlotCapacity = it.getInt(batteryIndex),
                        operatingSchedule = NearbyStationScheduleDto.fromJsonString(scheduleRaw),
                        isFromCache = true
                    )
                )
            }
        }
        return stations
    }

    private fun insertStation(
        db: SQLiteDatabase,
        stationId: String,
        name: String,
        latitude: Double,
        longitude: Double,
        status: String,
        capacityKwPerHour: Double,
        batteryStorageSlotCapacity: Int,
        scheduleJson: String,
        lastSynced: Long
    ) {
        val values = ContentValues().apply {
            put(StationCacheContract.StationEntry.COLUMN_STATION_ID, stationId)
            put(StationCacheContract.StationEntry.COLUMN_STATION_NAME, name)
            put(StationCacheContract.StationEntry.COLUMN_LATITUDE, latitude)
            put(StationCacheContract.StationEntry.COLUMN_LONGITUDE, longitude)
            put(StationCacheContract.StationEntry.COLUMN_STATUS, status)
            put(StationCacheContract.StationEntry.COLUMN_CAPACITY_KW, capacityKwPerHour)
            put(
                StationCacheContract.StationEntry.COLUMN_BATTERY_SLOT_CAPACITY,
                batteryStorageSlotCapacity
            )
            put(StationCacheContract.StationEntry.COLUMN_SCHEDULE_JSON, scheduleJson)
            put(StationCacheContract.StationEntry.COLUMN_LAST_SYNCED, lastSynced)
        }
        db.insertWithOnConflict(
            StationCacheContract.StationEntry.TABLE_NAME,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    companion object {
        private const val EARTH_RADIUS_KM = 6371.0

        private val hubIdMemoryCache = java.util.concurrent.ConcurrentHashMap<String, String>()
        private val stationNameMemoryCache = java.util.concurrent.ConcurrentHashMap<String, String>()

        fun resolveHubIdSync(stationId: String): String? {
            if (stationId.isBlank()) return null
            if (stationId.startsWith("HUB-", ignoreCase = true)) return stationId
            return hubIdMemoryCache[stationId]
        }

        fun cacheStation(id: String, hubId: String, name: String) {
            if (id.isNotBlank() && hubId.isNotBlank()) {
                hubIdMemoryCache[id] = hubId
                hubIdMemoryCache[hubId] = hubId
            }
            if (id.isNotBlank() && name.isNotBlank()) {
                stationNameMemoryCache[id] = name
            }
            if (hubId.isNotBlank() && name.isNotBlank()) {
                stationNameMemoryCache[hubId] = name
            }
        }

        fun haversineKm(
            latitude1: Double,
            longitude1: Double,
            latitude2: Double,
            longitude2: Double
        ): Double {
            val lat1Rad = Math.toRadians(latitude1)
            val lat2Rad = Math.toRadians(latitude2)
            val deltaLat = Math.toRadians(latitude2 - latitude1)
            val deltaLon = Math.toRadians(longitude2 - longitude1)

            val a = sin(deltaLat / 2) * sin(deltaLat / 2) +
                cos(lat1Rad) * cos(lat2Rad) *
                sin(deltaLon / 2) * sin(deltaLon / 2)
            val c = 2 * atan2(sqrt(a), sqrt(1 - a))
            return EARTH_RADIUS_KM * c
        }
    }
}
