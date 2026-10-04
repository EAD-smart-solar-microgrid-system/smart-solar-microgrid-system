package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data

import android.content.ContentValues
import android.content.Context
import android.database.Cursor
import android.database.sqlite.SQLiteDatabase
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data.ReservationCacheContract.ReservationEntry
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationDto
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Member 2 local SQLite repository for offline caching and fast retrieval of prosumer reservations.
 * Backed by [ReservationDatabaseHelper] in the isolated member2_reservations.db database.
 */
class ReservationLocalRepository(context: Context) {

    private val helper: ReservationDatabaseHelper = ReservationDatabaseHelper.getInstance(context)

    companion object {
        @Volatile
        private var instance: ReservationLocalRepository? = null

        /**
         * Returns the application-scoped singleton instance of [ReservationLocalRepository].
         */
        fun getInstance(context: Context): ReservationLocalRepository {
            return instance ?: synchronized(this) {
                instance ?: ReservationLocalRepository(context.applicationContext).also { instance = it }
            }
        }

        /**
         * Generates current timestamp formatted as an ISO-8601 UTC string.
         */
        fun currentIsoUtc(): String {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            return format.format(Date())
        }

        /**
         * Maps a [ReservationDto] to Android [ContentValues] for SQLite insertion or update.
         */
        fun toContentValues(
            reservation: ReservationDto,
            localUpdatedAt: String = currentIsoUtc()
        ): ContentValues {
            return ContentValues().apply {
                put(ReservationEntry.COLUMN_ID, reservation.id)
                put(ReservationEntry.COLUMN_PROSUMER_NIC, reservation.prosumerNic)
                put(ReservationEntry.COLUMN_STATION_ID, reservation.stationId)
                put(ReservationEntry.COLUMN_SLOT_ID, reservation.slotId)
                put(ReservationEntry.COLUMN_RESERVATION_DATE_TIME, reservation.reservationDateTime)
                put(ReservationEntry.COLUMN_RESERVATION_TYPE, reservation.reservationType)
                put(ReservationEntry.COLUMN_STATUS, reservation.status)
                put(ReservationEntry.COLUMN_CANCELLATION_REASON, reservation.cancellationReason)
                put(ReservationEntry.COLUMN_CANCELLED_AT, reservation.cancelledAt)
                put(ReservationEntry.COLUMN_QR_TOKEN, reservation.qrToken)
                put(ReservationEntry.COLUMN_CREATED_AT, reservation.createdAt)
                put(ReservationEntry.COLUMN_UPDATED_AT, reservation.updatedAt)
                put(ReservationEntry.COLUMN_LOCAL_UPDATED_AT, localUpdatedAt)
            }
        }

        /**
         * Maps the current row of an active [Cursor] to a typed [ReservationDto].
         * Safely handles null values for optional cancellation details and QR tokens.
         */
        fun fromCursor(cursor: Cursor): ReservationDto {
            val idIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_ID)
            val nicIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_PROSUMER_NIC)
            val stationIdIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_STATION_ID)
            val slotIdIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_SLOT_ID)
            val dateTimeIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_RESERVATION_DATE_TIME)
            val typeIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_RESERVATION_TYPE)
            val statusIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_STATUS)
            val reasonIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_CANCELLATION_REASON)
            val cancelledAtIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_CANCELLED_AT)
            val qrTokenIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_QR_TOKEN)
            val createdAtIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_CREATED_AT)
            val updatedAtIndex = cursor.getColumnIndexOrThrow(ReservationEntry.COLUMN_UPDATED_AT)

            return ReservationDto(
                id = cursor.getString(idIndex),
                prosumerNic = cursor.getString(nicIndex),
                stationId = cursor.getString(stationIdIndex),
                slotId = cursor.getString(slotIdIndex),
                reservationDateTime = cursor.getString(dateTimeIndex),
                reservationType = cursor.getString(typeIndex),
                status = cursor.getString(statusIndex),
                cancellationReason = if (cursor.isNull(reasonIndex)) null else cursor.getString(reasonIndex),
                cancelledAt = if (cursor.isNull(cancelledAtIndex)) null else cursor.getString(cancelledAtIndex),
                qrToken = if (cursor.isNull(qrTokenIndex)) null else cursor.getString(qrTokenIndex),
                createdAt = cursor.getString(createdAtIndex),
                updatedAt = cursor.getString(updatedAtIndex)
            )
        }
    }

    /**
     * Upserts a single reservation using [SQLiteDatabase.CONFLICT_REPLACE].
     *
     * @param reservation Domain DTO to persist.
     * @return Row ID of the inserted/replaced record, or -1 on failure.
     */
    fun upsert(reservation: ReservationDto): Long {
        val db = helper.writableDatabase
        val values = toContentValues(reservation)
        return db.insertWithOnConflict(
            ReservationEntry.TABLE_NAME,
            null,
            values,
            SQLiteDatabase.CONFLICT_REPLACE
        )
    }

    /**
     * Atomically upserts a collection of reservations within a single transaction.
     *
     * @param reservations List of reservations to cache.
     * @return Total count of successfully upserted records.
     */
    fun upsertAll(reservations: List<ReservationDto>): Int {
        if (reservations.isEmpty()) return 0
        val db = helper.writableDatabase
        var count = 0
        db.beginTransaction()
        try {
            val now = currentIsoUtc()
            for (reservation in reservations) {
                val values = toContentValues(reservation, now)
                val rowId = db.insertWithOnConflict(
                    ReservationEntry.TABLE_NAME,
                    null,
                    values,
                    SQLiteDatabase.CONFLICT_REPLACE
                )
                if (rowId != -1L) {
                    count++
                }
            }
            db.setTransactionSuccessful()
        } finally {
            db.endTransaction()
        }
        return count
    }

    /**
     * Retrieves a single reservation by its unique identifier.
     *
     * @param id Unique reservation identifier.
     * @return The cached [ReservationDto], or null if not found.
     */
    fun getById(id: String): ReservationDto? {
        val db = helper.readableDatabase
        val cursor = db.query(
            ReservationEntry.TABLE_NAME,
            null,
            "${ReservationEntry.COLUMN_ID} = ?",
            arrayOf(id.trim()),
            null,
            null,
            null
        )
        return cursor.use {
            if (it.moveToFirst()) fromCursor(it) else null
        }
    }

    /**
     * Retrieves all cached reservations for a given prosumer NIC, ordered deterministically
     * by scheduled date/time descending (most recent first).
     *
     * @param prosumerNic Prosumer National Identity Card number.
     * @return List of matched reservations.
     */
    fun getByProsumerNic(prosumerNic: String): List<ReservationDto> {
        val db = helper.readableDatabase
        val cursor = db.query(
            ReservationEntry.TABLE_NAME,
            null,
            "${ReservationEntry.COLUMN_PROSUMER_NIC} = ?",
            arrayOf(prosumerNic.trim()),
            null,
            null,
            "${ReservationEntry.COLUMN_RESERVATION_DATE_TIME} DESC"
        )
        val list = mutableListOf<ReservationDto>()
        cursor.use {
            while (it.moveToNext()) {
                list.add(fromCursor(it))
            }
        }
        return list
    }

    /**
     * Retrieves all cached reservations ordered by scheduled date/time descending.
     *
     * @return List of all cached reservations.
     */
    fun getAll(): List<ReservationDto> {
        val db = helper.readableDatabase
        val cursor = db.query(
            ReservationEntry.TABLE_NAME,
            null,
            null,
            null,
            null,
            null,
            "${ReservationEntry.COLUMN_RESERVATION_DATE_TIME} DESC"
        )
        val list = mutableListOf<ReservationDto>()
        cursor.use {
            while (it.moveToNext()) {
                list.add(fromCursor(it))
            }
        }
        return list
    }

    /**
     * Deletes a cached reservation by its unique identifier.
     *
     * @param id Identifier of the reservation to delete.
     * @return True if a record was removed, false otherwise.
     */
    fun deleteById(id: String): Boolean {
        val db = helper.writableDatabase
        return db.delete(
            ReservationEntry.TABLE_NAME,
            "${ReservationEntry.COLUMN_ID} = ?",
            arrayOf(id.trim())
        ) > 0
    }

    /**
     * Removes all cached reservations belonging to a specified prosumer.
     * Typically invoked prior to refreshing full booking sets from server.
     *
     * @param prosumerNic Prosumer National Identity Card number.
     * @return Count of rows deleted.
     */
    fun clearByProsumerNic(prosumerNic: String): Int {
        val db = helper.writableDatabase
        return db.delete(
            ReservationEntry.TABLE_NAME,
            "${ReservationEntry.COLUMN_PROSUMER_NIC} = ?",
            arrayOf(prosumerNic.trim())
        )
    }

    /**
     * Completely purges the local reservation cache table.
     *
     * @return Count of rows deleted.
     */
    fun clearAll(): Int {
        val db = helper.writableDatabase
        return db.delete(ReservationEntry.TABLE_NAME, null, null)
    }
}
