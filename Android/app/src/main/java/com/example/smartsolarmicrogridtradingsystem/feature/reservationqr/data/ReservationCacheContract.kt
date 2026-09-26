package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data

import android.provider.BaseColumns

/**
 * Member 2 SQLite contract for caching energy slot reservations.
 * Maintains local persistence in a dedicated database to prevent schema conflicts
 * with other member databases.
 */
object ReservationCacheContract {

    const val DATABASE_NAME = "member2_reservations.db"
    const val DATABASE_VERSION = 1

    object ReservationEntry : BaseColumns {
        const val TABLE_NAME = "cached_reservations"

        const val COLUMN_ID = "id"
        const val COLUMN_PROSUMER_NIC = "prosumer_nic"
        const val COLUMN_STATION_ID = "station_id"
        const val COLUMN_SLOT_ID = "slot_id"
        const val COLUMN_RESERVATION_DATE_TIME = "reservation_date_time"
        const val COLUMN_RESERVATION_TYPE = "reservation_type"
        const val COLUMN_STATUS = "status"
        const val COLUMN_CANCELLATION_REASON = "cancellation_reason"
        const val COLUMN_CANCELLED_AT = "cancelled_at"
        const val COLUMN_QR_TOKEN = "qr_token"
        const val COLUMN_CREATED_AT = "created_at"
        const val COLUMN_UPDATED_AT = "updated_at"
        const val COLUMN_LOCAL_UPDATED_AT = "local_updated_at"

        const val SQL_CREATE_TABLE = """
            CREATE TABLE $TABLE_NAME (
                $COLUMN_ID TEXT PRIMARY KEY NOT NULL,
                $COLUMN_PROSUMER_NIC TEXT NOT NULL,
                $COLUMN_STATION_ID TEXT NOT NULL,
                $COLUMN_SLOT_ID TEXT NOT NULL,
                $COLUMN_RESERVATION_DATE_TIME TEXT NOT NULL,
                $COLUMN_RESERVATION_TYPE TEXT NOT NULL,
                $COLUMN_STATUS TEXT NOT NULL,
                $COLUMN_CANCELLATION_REASON TEXT,
                $COLUMN_CANCELLED_AT TEXT,
                $COLUMN_QR_TOKEN TEXT,
                $COLUMN_CREATED_AT TEXT NOT NULL,
                $COLUMN_UPDATED_AT TEXT NOT NULL,
                $COLUMN_LOCAL_UPDATED_AT TEXT NOT NULL
            );
        """

        const val SQL_CREATE_INDEX_PROSUMER = """
            CREATE INDEX IF NOT EXISTS idx_reservations_prosumer_time 
            ON $TABLE_NAME ($COLUMN_PROSUMER_NIC, $COLUMN_RESERVATION_DATE_TIME DESC);
        """
    }
}
