package com.example.smartsolarmicrogridtradingsystem.data.local.sqlite

import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log

/**
 * SQLiteOpenHelper implementation managing database creation and migrations.
 *
 * CRITICAL THREADING RULE:
 * - All database read, write, and transaction operations MUST NOT run on the Android main (UI) thread.
 *   Executing database operations on the UI thread blocks rendering and causes ANR (Application Not Responding) dialogs.
 *   Always dispatch SQLite operations to background worker threads using AppExecutors.executeInBackground { ... }.
 *
 * MIGRATION RULES & DOCUMENTATION:
 * - Increment DatabaseContract.DATABASE_VERSION whenever schema alterations are required.
 * - Handle migrations sequentially in onUpgrade() without destructive drops, preserving user local persistence.
 * - Do not add feature-specific CRUD methods into this common helper. Feature repositories should
 *   manage their own queries using database handles obtained from this helper.
 */
class AppDatabaseHelper private constructor(context: Context) : SQLiteOpenHelper(
    context.applicationContext,
    DatabaseContract.DATABASE_NAME,
    null,
    DatabaseContract.DATABASE_VERSION
) {

    companion object {
        private const val TAG = "AppDatabaseHelper"

        @Volatile
        private var instance: AppDatabaseHelper? = null

        /**
         * Returns the thread-safe singleton instance of AppDatabaseHelper.
         */
        fun getInstance(context: Context): AppDatabaseHelper {
            return instance ?: synchronized(this) {
                instance ?: AppDatabaseHelper(context.applicationContext).also { instance = it }
            }
        }
    }

    override fun onCreate(db: SQLiteDatabase) {
        Log.d(TAG, "Creating database tables for version ${DatabaseContract.DATABASE_VERSION}")
        db.execSQL(DatabaseContract.SessionEntry.SQL_CREATE_TABLE)
    }

    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        Log.d(TAG, "Upgrading database from version $oldVersion to $newVersion")
        // Sequential migration structure:
        // Example:
        // if (oldVersion < 2) {
        //     // Execute version 2 migrations (e.g. ALTER TABLE ...)
        // }
        // if (oldVersion < 3) {
        //     // Execute version 3 migrations
        // }
    }
}
