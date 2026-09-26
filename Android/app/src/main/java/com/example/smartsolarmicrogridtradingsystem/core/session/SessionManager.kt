package com.example.smartsolarmicrogridtradingsystem.core.session
import android.content.ContentValues
import android.content.Context
import com.example.smartsolarmicrogridtradingsystem.data.local.sqlite.AppDatabaseHelper
import com.example.smartsolarmicrogridtradingsystem.data.local.sqlite.DatabaseContract.SessionEntry

class SessionManager(private val context: Context) {
    fun saveSession(token: String, userIdentifier: String, role: String) {
        val db = AppDatabaseHelper.getInstance(context).writableDatabase
        db.execSQL("DELETE FROM ${SessionEntry.TABLE_NAME}")
        val values = ContentValues().apply {
            put(SessionEntry.COLUMN_USER_IDENTIFIER, userIdentifier)
            put(SessionEntry.COLUMN_ROLE, role)
            put(SessionEntry.COLUMN_TOKEN, token)
            put(SessionEntry.COLUMN_LAST_UPDATED, System.currentTimeMillis())
        }
        db.insert(SessionEntry.TABLE_NAME, null, values)
    }

    private fun getSessionData(): Triple<String, String, String>? {
        val db = AppDatabaseHelper.getInstance(context).readableDatabase
        val cursor = db.query(SessionEntry.TABLE_NAME, null, null, null, null, null, null)
        return if (cursor.moveToFirst()) {
            val role = cursor.getString(cursor.getColumnIndexOrThrow(SessionEntry.COLUMN_ROLE))
            val token = cursor.getString(cursor.getColumnIndexOrThrow(SessionEntry.COLUMN_TOKEN))
            val user = cursor.getString(cursor.getColumnIndexOrThrow(SessionEntry.COLUMN_USER_IDENTIFIER))
            cursor.close()
            Triple(token, user, role)
        } else {
            cursor.close()
            null
        }
    }

    fun getToken(): String? = getSessionData()?.first
    fun getUserIdentifier(): String? = getSessionData()?.second
    fun getRole(): String? = getSessionData()?.third
    fun isLoggedIn(): Boolean = getSessionData() != null

    fun clearSession() {
        val db = AppDatabaseHelper.getInstance(context).writableDatabase
        db.execSQL("DELETE FROM ${SessionEntry.TABLE_NAME}")
    }
}
