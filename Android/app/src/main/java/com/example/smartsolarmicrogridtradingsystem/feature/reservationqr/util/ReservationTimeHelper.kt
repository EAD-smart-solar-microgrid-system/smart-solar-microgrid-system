package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.regex.Pattern

/**
 * Member 2 date and time utility for parsing ISO-8601 backend timestamps,
 * formatting UTC ISO strings for command endpoints, and evaluating the 12-hour advance notice policy.
 */
object ReservationTimeHelper {

    const val TWELVE_HOURS_MILLIS: Long = 12L * 60L * 60L * 1000L

    // Regex pattern matching ISO-8601 timestamps:
    // Group 1: Year (4 digits)
    // Group 2: Month (2 digits)
    // Group 3: Day (2 digits)
    // Group 4: Hour (2 digits)
    // Group 5: Minute (2 digits)
    // Group 6: Second (2 digits)
    // Group 7: Fractional seconds (1 to 9 digits)
    // Group 8: UTC 'Z' or 'z'
    // Group 9: Offset sign '+' or '-'
    // Group 10: Offset hours (2 digits)
    // Group 11: Offset minutes (2 digits, optional)
    private val ISO_REGEX = Pattern.compile(
        """^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:([zZ])|(?:([+-])(\d{2})(?::?(\d{2}))?))?$"""
    )

    /**
     * Parses an ISO-8601 formatted timestamp string from the backend into a [Date] instant.
     * Safely handles arbitrary .NET fractional second precision (e.g. 7-digit ticks) and explicit
     * offsets without SimpleDateFormat millisecond distortion or calendar drift.
     * Fails safely by returning null on malformed, unparseable, or invalid calendar values.
     */
    fun parseUtcInstant(raw: String?): Date? {
        if (raw.isNullOrBlank()) return null
        val trimmed = raw.trim()

        val matcher = ISO_REGEX.matcher(trimmed)
        if (!matcher.matches()) return null

        try {
            val year = matcher.group(1)?.toIntOrNull() ?: return null
            val month = matcher.group(2)?.toIntOrNull() ?: return null
            val day = matcher.group(3)?.toIntOrNull() ?: return null
            val hour = matcher.group(4)?.toIntOrNull() ?: return null
            val minute = matcher.group(5)?.toIntOrNull() ?: return null
            val second = matcher.group(6)?.toIntOrNull() ?: return null

            if (month !in 1..12 || day !in 1..31 || hour !in 0..23 || minute !in 0..59 || second !in 0..59) {
                return null
            }

            // Fractional seconds conversion to milliseconds without integer millisecond misinterpretation
            val fractionStr = matcher.group(7)
            val millis = if (fractionStr != null && fractionStr.isNotEmpty()) {
                val padded = fractionStr.padEnd(3, '0')
                padded.substring(0, 3).toIntOrNull() ?: 0
            } else {
                0
            }

            val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
                isLenient = false
                clear()
                set(Calendar.YEAR, year)
                set(Calendar.MONTH, month - 1)
                set(Calendar.DAY_OF_MONTH, day)
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, second)
                set(Calendar.MILLISECOND, millis)
            }

            val utcMillis = cal.timeInMillis

            // Offset handling:
            // 'Z' / 'z' indicates UTC (offset 0)
            // Explicit offset (+HH:mm or -HH:mm) is subtracted to get UTC epoch instant
            val isZ = matcher.group(8) != null
            val sign = matcher.group(9)
            val offsetHours = matcher.group(10)?.toIntOrNull() ?: 0
            val offsetMins = matcher.group(11)?.toIntOrNull() ?: 0

            val totalOffsetMillis: Long = if (!isZ && sign != null) {
                if (offsetHours !in 0..23 || offsetMins !in 0..59) return null
                val rawOffset = (offsetHours * 3600L + offsetMins * 60L) * 1000L
                if (sign == "+") rawOffset else -rawOffset
            } else {
                0L
            }

            val instantMillis = utcMillis - totalOffsetMillis
            return Date(instantMillis)
        } catch (_: Exception) {
            return null
        }
    }

    /**
     * Determines whether at least 12 hours notice remains before the scheduled reservation slot.
     * Evaluates: (reservationDateTime - now) >= 12 hours.
     * If timestamp parsing fails, fails safely and returns false.
     */
    fun hasTwelveHoursNotice(
        rawIsoDateTime: String?,
        nowMillis: Long = System.currentTimeMillis()
    ): Boolean {
        val targetDate = parseUtcInstant(rawIsoDateTime) ?: return false
        val targetMillis = targetDate.time
        return (targetMillis - nowMillis) >= TWELVE_HOURS_MILLIS
    }

    /**
     * Converts a [Date] instant into an ISO-8601 UTC string formatted for backend API submission.
     * Always outputs a standard "yyyy-MM-dd'T'HH:mm:ss'Z'" string in UTC.
     */
    fun toIsoUtcString(date: Date): String {
        val formatter = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        return formatter.format(date)
    }
}
