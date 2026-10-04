package com.example.smartsolarmicrogridtradingsystem.feature.dashboardmaps.ui

import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone

/**
 * Shared formatting helpers for Member 4 dashboard and booking screens.
 */
object DashboardUiFormatter {

    fun formatDateTime(raw: String?): String {
        if (raw.isNullOrBlank()) {
            return "—"
        }

        return try {
            val parsers = listOf(
                "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
                "yyyy-MM-dd'T'HH:mm:ss'Z'",
                "yyyy-MM-dd'T'HH:mm:ss.SSSSSSSXXX",
                "yyyy-MM-dd'T'HH:mm:ssXXX"
            )

            var parsed: java.util.Date? = null
            for (pattern in parsers) {
                try {
                    val parser = SimpleDateFormat(pattern, Locale.US).apply {
                        timeZone = TimeZone.getTimeZone("UTC")
                    }
                    parsed = parser.parse(raw)
                    if (parsed != null) {
                        break
                    }
                } catch (_: Exception) {
                    // Try the next known API format.
                }
            }

            if (parsed == null) {
                return raw
            }

            val display = SimpleDateFormat("dd MMM yyyy, HH:mm", Locale.getDefault())
            display.format(parsed)
        } catch (_: Exception) {
            raw
        }
    }

    fun shortenId(id: String?): String {
        if (id.isNullOrBlank()) {
            return "—"
        }
        return if (id.length <= 10) id else "${id.take(6)}…${id.takeLast(4)}"
    }
}
