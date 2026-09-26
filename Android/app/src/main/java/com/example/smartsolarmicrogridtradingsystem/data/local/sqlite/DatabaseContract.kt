package com.example.smartsolarmicrogridtradingsystem.data.local.sqlite
import android.provider.BaseColumns
object DatabaseContract {
    const val DATABASE_NAME = "smart_solar_microgrid.db"
    const val DATABASE_VERSION = 2 // Incremented for token

    object SessionEntry : BaseColumns {
        const val TABLE_NAME = "local_session"
        const val COLUMN_ID = BaseColumns._ID
        const val COLUMN_USER_IDENTIFIER = "user_identifier"
        const val COLUMN_ROLE = "role"
        const val COLUMN_TOKEN = "token"
        const val COLUMN_LAST_UPDATED = "last_updated"

        const val SQL_CREATE_TABLE = """
            CREATE TABLE $TABLE_NAME (
                $COLUMN_ID INTEGER PRIMARY KEY AUTOINCREMENT,
                $COLUMN_USER_IDENTIFIER TEXT NOT NULL,
                $COLUMN_ROLE TEXT NOT NULL,
                $COLUMN_TOKEN TEXT NOT NULL,
                $COLUMN_LAST_UPDATED INTEGER NOT NULL
            );
        """
        const val SQL_DROP_TABLE = "DROP TABLE IF EXISTS $TABLE_NAME;"
    }
}
