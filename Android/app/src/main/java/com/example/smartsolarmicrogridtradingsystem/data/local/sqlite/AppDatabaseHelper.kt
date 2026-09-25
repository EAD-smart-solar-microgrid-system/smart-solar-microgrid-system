package com.example.smartsolarmicrogridtradingsystem.data.local.sqlite
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import android.database.sqlite.SQLiteOpenHelper
import android.util.Log

class AppDatabaseHelper private constructor(context: Context) : SQLiteOpenHelper(
    context.applicationContext, DatabaseContract.DATABASE_NAME, null, DatabaseContract.DATABASE_VERSION
) {
    companion object {
        private const val TAG = "AppDatabaseHelper"
        @Volatile private var instance: AppDatabaseHelper? = null
        fun getInstance(context: Context): AppDatabaseHelper {
            return instance ?: synchronized(this) {
                instance ?: AppDatabaseHelper(context.applicationContext).also { instance = it }
            }
        }
    }
    override fun onCreate(db: SQLiteDatabase) {
        db.execSQL(DatabaseContract.SessionEntry.SQL_CREATE_TABLE)
    }
    override fun onUpgrade(db: SQLiteDatabase, oldVersion: Int, newVersion: Int) {
        if (oldVersion < 2) {
            db.execSQL("ALTER TABLE ${DatabaseContract.SessionEntry.TABLE_NAME} ADD COLUMN ${DatabaseContract.SessionEntry.COLUMN_TOKEN} TEXT NOT NULL DEFAULT ''")
        }
    }
}
