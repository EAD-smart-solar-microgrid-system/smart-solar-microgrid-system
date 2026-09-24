package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.data.sqlite

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper

/**
 * Member 4-only SQLiteOpenHelper for station/reference cache.
 * Keeps feature cache isolated from the common AppDatabaseHelper schema.
 */
class StationCacheHelper private constructor(context: Context) : SQLiteOpenHelper(
    context.applicationContext,
    StationCacheContract.DATABASE_NAME,
    null,
    StationCacheContract.DATABASE_VERSION
) {

    companion object {
        @Volatile
        private var instance: StationCacheHelper? = null

        fun getInstance(context: Context): StationCacheHelper {
            return instance ?: synchronized(this) {
                instance ?: StationCacheHelper(context.applicationContext).also { instance = it }
            }
        }
    }

    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(StationCacheContract.StationEntry.SQL_CREATE_TABLE)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        // No destructive upgrades yet; add sequential migrations when the cache schema changes.
    }
}
