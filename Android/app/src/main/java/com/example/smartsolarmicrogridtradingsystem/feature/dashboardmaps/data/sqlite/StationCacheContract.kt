package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.sqlite

import android.provider.BaseColumns

/**
 * Member 4 SQLite contract for caching station reference data only.
 * Booking/reservation records are never persisted here.
 */
object StationCacheContract {

    const val DATABASE_NAME = "member4_station_cache.db"
    const val DATABASE_VERSION = 1

    object StationEntry : BaseColumns {
        const val TABLE_NAME = "cached_stations"
        const val COLUMN_STATION_ID = "station_id"
        const val COLUMN_STATION_NAME = "station_name"
        const val COLUMN_LATITUDE = "latitude"
        const val COLUMN_LONGITUDE = "longitude"
        const val COLUMN_STATUS = "status"
        const val COLUMN_CAPACITY_KW = "capacity_kw"
        const val COLUMN_BATTERY_SLOT_CAPACITY = "battery_slot_capacity"
        const val COLUMN_LAST_SYNCED = "last_synced"

        const val SQL_CREATE_TABLE = """
            CREATE TABLE $TABLE_NAME (
                $COLUMN_STATION_ID TEXT PRIMARY KEY NOT NULL,
                $COLUMN_STATION_NAME TEXT NOT NULL,
                $COLUMN_LATITUDE REAL NOT NULL,
                $COLUMN_LONGITUDE REAL NOT NULL,
                $COLUMN_STATUS TEXT NOT NULL,
                $COLUMN_CAPACITY_KW REAL NOT NULL,
                $COLUMN_BATTERY_SLOT_CAPACITY INTEGER NOT NULL,
                $COLUMN_LAST_SYNCED INTEGER NOT NULL
            );
        """
    }
}
