package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.StationReferenceDto
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.sqlite.StationCacheContract
import com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.sqlite.StationCacheHelper

/**
 * Local station/reference cache used by Member 4 screens for offline name lookup.
 */
class StationCacheRepository(context: Context) {

    private val helper = StationCacheHelper.getInstance(context)

    fun replaceAll(stations: List<StationReferenceDto>, onComplete: (() -> Unit)? = null) {
        AppExecutors.executeInBackground {
            val db = helper.writableDatabase
            db.beginTransaction()
            try {
                db.delete(StationCacheContract.StationEntry.TABLE_NAME, null, null)
                val now = System.currentTimeMillis()
                stations.forEach { station ->
                    val values = ContentValues().apply {
                        put(StationCacheContract.StationEntry.COLUMN_STATION_ID, station.id)
                        put(StationCacheContract.StationEntry.COLUMN_STATION_NAME, station.name)
                        put(StationCacheContract.StationEntry.COLUMN_LATITUDE, station.latitude)
                        put(StationCacheContract.StationEntry.COLUMN_LONGITUDE, station.longitude)
                        put(StationCacheContract.StationEntry.COLUMN_STATUS, station.status)
                        put(StationCacheContract.StationEntry.COLUMN_CAPACITY_KW, station.capacityKwPerHour)
                        put(
                            StationCacheContract.StationEntry.COLUMN_BATTERY_SLOT_CAPACITY,
                            station.batteryStorageSlotCapacity
                        )
                        put(StationCacheContract.StationEntry.COLUMN_LAST_SYNCED, now)
                    }
                    db.insertWithOnConflict(
                        StationCacheContract.StationEntry.TABLE_NAME,
                        null,
                        values,
                        SQLiteDatabase.CONFLICT_REPLACE
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

            AppExecutors.executeOnMainThread {
                onResult(name)
            }
        }
    }

    fun getAll(onResult: (List<StationReferenceDto>) -> Unit) {
        AppExecutors.executeInBackground {
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

            val stations = mutableListOf<StationReferenceDto>()
            cursor.use {
                val idIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_STATION_ID)
                val nameIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_STATION_NAME)
                val latIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_LATITUDE)
                val lonIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_LONGITUDE)
                val statusIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_STATUS)
                val capacityIndex = it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_CAPACITY_KW)
                val batteryIndex =
                    it.getColumnIndexOrThrow(StationCacheContract.StationEntry.COLUMN_BATTERY_SLOT_CAPACITY)

                while (it.moveToNext()) {
                    stations.add(
                        StationReferenceDto(
                            id = it.getString(idIndex),
                            name = it.getString(nameIndex),
                            latitude = it.getDouble(latIndex),
                            longitude = it.getDouble(lonIndex),
                            status = it.getString(statusIndex),
                            capacityKwPerHour = it.getDouble(capacityIndex),
                            batteryStorageSlotCapacity = it.getInt(batteryIndex)
                        )
                    )
                }
            }

            AppExecutors.executeOnMainThread {
                onResult(stations)
            }
        }
    }
}
