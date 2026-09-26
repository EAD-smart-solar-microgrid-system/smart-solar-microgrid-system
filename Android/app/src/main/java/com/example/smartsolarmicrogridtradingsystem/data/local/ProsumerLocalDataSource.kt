package com.example.smartsolarmicrogridtradingsystem.data.local

import android.content.ContentValues
import android.content.Context
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import com.example.smartsolarmicrogridtradingsystem.data.local.sqlite.AppDatabaseHelper
import com.example.smartsolarmicrogridtradingsystem.data.local.sqlite.DatabaseContract
import com.example.smartsolarmicrogridtradingsystem.domain.model.ProsumerProfile

/** SQLite cache for the last server-confirmed Prosumer profile. */
class ProsumerLocalDataSource(context: Context) {

    private val databaseHelper = AppDatabaseHelper.getInstance(context)

    fun save(profile: ProsumerProfile, callback: (Boolean) -> Unit) {
        AppExecutors.executeInBackground {
            val values = ContentValues().apply {
                put(DatabaseContract.ProsumerProfileEntry.COLUMN_NIC, profile.nic)
                put(DatabaseContract.ProsumerProfileEntry.COLUMN_FULL_NAME, profile.fullName)
                put(DatabaseContract.ProsumerProfileEntry.COLUMN_EMAIL, profile.email)
                put(DatabaseContract.ProsumerProfileEntry.COLUMN_PHONE_NUMBER, profile.phoneNumber)
                put(DatabaseContract.ProsumerProfileEntry.COLUMN_ADDRESS, profile.address)
                put(DatabaseContract.ProsumerProfileEntry.COLUMN_ACCOUNT_STATUS, profile.accountStatus)
                put(DatabaseContract.ProsumerProfileEntry.COLUMN_UPDATED_AT, profile.updatedAt)
            }
            val saved = try {
                databaseHelper.writableDatabase.insertWithOnConflict(
                    DatabaseContract.ProsumerProfileEntry.TABLE_NAME,
                    null,
                    values,
                    android.database.sqlite.SQLiteDatabase.CONFLICT_REPLACE
                ) != -1L
            } catch (_: Exception) {
                false
            }
            AppExecutors.executeOnMainThread { callback(saved) }
        }
    }

    fun get(callback: (ProsumerProfile?) -> Unit) {
        AppExecutors.executeInBackground {
            val profile = try {
                databaseHelper.readableDatabase.query(
                    DatabaseContract.ProsumerProfileEntry.TABLE_NAME,
                    null,
                    null,
                    null,
                    null,
                    null,
                    "${DatabaseContract.ProsumerProfileEntry.COLUMN_UPDATED_AT} DESC",
                    "1"
                ).use { cursor ->
                    if (!cursor.moveToFirst()) {
                        null
                    } else {
                        ProsumerProfile(
                            nic = cursor.getString(cursor.getColumnIndexOrThrow(DatabaseContract.ProsumerProfileEntry.COLUMN_NIC)),
                            fullName = cursor.getString(cursor.getColumnIndexOrThrow(DatabaseContract.ProsumerProfileEntry.COLUMN_FULL_NAME)),
                            email = cursor.getString(cursor.getColumnIndexOrThrow(DatabaseContract.ProsumerProfileEntry.COLUMN_EMAIL)),
                            phoneNumber = cursor.getNullableString(DatabaseContract.ProsumerProfileEntry.COLUMN_PHONE_NUMBER),
                            address = cursor.getNullableString(DatabaseContract.ProsumerProfileEntry.COLUMN_ADDRESS),
                            accountStatus = cursor.getString(cursor.getColumnIndexOrThrow(DatabaseContract.ProsumerProfileEntry.COLUMN_ACCOUNT_STATUS)),
                            updatedAt = cursor.getString(cursor.getColumnIndexOrThrow(DatabaseContract.ProsumerProfileEntry.COLUMN_UPDATED_AT))
                        )
                    }
                }
            } catch (_: Exception) {
                null
            }
            AppExecutors.executeOnMainThread { callback(profile) }
        }
    }

    private fun android.database.Cursor.getNullableString(column: String): String? {
        val index = getColumnIndexOrThrow(column)
        return if (isNull(index)) null else getString(index)
    }
}
