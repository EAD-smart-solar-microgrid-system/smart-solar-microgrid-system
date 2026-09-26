package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Member 2 SQLiteOpenHelper for local reservation persistence.
 * Isolates reservation cache into member2_reservations.db to avoid mutating
 * Member 1 session or Member 4 station cache schemas.
 */
class ReservationDatabaseHelper private constructor(context: Context) : SQLiteOpenHelper(
    context.applicationContext,
    ReservationCacheContract.DATABASE_NAME,
    null,
    ReservationCacheContract.DATABASE_VERSION
) {

    companion object {
        @Volatile
        private var instance: ReservationDatabaseHelper? = null

        /**
         * Returns the application-scoped singleton instance of [ReservationDatabaseHelper].
         */
        fun getInstance(context: Context): ReservationDatabaseHelper {
            return instance ?: synchronized(this) {
                instance ?: ReservationDatabaseHelper(context.applicationContext).also { instance = it }
            }
        }
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(ReservationCacheContract.ReservationEntry.SQL_CREATE_TABLE)
        db.execSQL(ReservationCacheContract.ReservationEntry.SQL_CREATE_INDEX_PROSUMER)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // Initial schema version 1. Forward migration hooks reserved for future revisions.
    }
}
