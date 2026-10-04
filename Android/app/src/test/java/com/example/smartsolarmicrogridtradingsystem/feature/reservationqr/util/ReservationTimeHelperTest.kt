package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.util

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.Date
import java.util.TimeZone

/**
 * Unit tests validating [ReservationTimeHelper] parsing against real ASP.NET Core outputs
 * including UTC 'Z', arbitrary fractional second precision, explicit offsets, and the 12-hour rule.
 */
class ReservationTimeHelperTest {

    @Test
    fun testParseStandardUtcTimestamp() {
        val parsed = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00Z")
        assertNotNull(parsed)

        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
            time = parsed!!
        }
        assertEquals(2026, cal.get(Calendar.YEAR))
        assertEquals(Calendar.SEPTEMBER, cal.get(Calendar.MONTH))
        assertEquals(27, cal.get(Calendar.DAY_OF_MONTH))
        assertEquals(8, cal.get(Calendar.HOUR_OF_DAY))
        assertEquals(30, cal.get(Calendar.MINUTE))
        assertEquals(0, cal.get(Calendar.SECOND))
        assertEquals(0, cal.get(Calendar.MILLISECOND))
    }

    @Test
    fun testParseThreeDigitFractionalSeconds() {
        val parsed = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00.123Z")
        assertNotNull(parsed)

        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
            time = parsed!!
        }
        assertEquals(8, cal.get(Calendar.HOUR_OF_DAY))
        assertEquals(30, cal.get(Calendar.MINUTE))
        assertEquals(0, cal.get(Calendar.SECOND))
        assertEquals(123, cal.get(Calendar.MILLISECOND))
    }

    @Test
    fun testParseDotNetSevenDigitTicksWithoutMillisecondDrift() {
        // In ASP.NET Core .NET DateTime serialization, ticks are formatted with 7 digits (e.g. .1234567Z).
        // SimpleDateFormat with 'SSSSSSS' incorrectly parses 1234567 as milliseconds (~20.5 min error).
        // ReservationTimeHelper must truncate/scale to 123ms and preserve exact minute and second.
        val baseDate = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00Z")
        val tickDate = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00.1234567Z")

        assertNotNull(baseDate)
        assertNotNull(tickDate)

        val diff = tickDate!!.time - baseDate!!.time
        // Diff must be 123 milliseconds, NOT 1,234,567 milliseconds
        assertEquals(123L, diff)

        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
            time = tickDate
        }
        assertEquals(8, cal.get(Calendar.HOUR_OF_DAY))
        assertEquals(30, cal.get(Calendar.MINUTE))
        assertEquals(0, cal.get(Calendar.SECOND))
        assertEquals(123, cal.get(Calendar.MILLISECOND))
    }

    @Test
    fun testParseArbitraryFractionalDigits() {
        val singleDigit = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00.5Z")
        assertNotNull(singleDigit)
        val cal1 = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply { time = singleDigit!! }
        assertEquals(500, cal1.get(Calendar.MILLISECOND))

        val fourDigits = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00.1234Z")
        assertNotNull(fourDigits)
        val cal4 = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply { time = fourDigits!! }
        assertEquals(123, cal4.get(Calendar.MILLISECOND))
    }

    @Test
    fun testParseExplicitUtcOffsetZero() {
        val parsedZ = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00Z")
        val parsedOffset = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00+00:00")
        val parsedFractionOffset = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00.1234567+00:00")

        assertNotNull(parsedZ)
        assertNotNull(parsedOffset)
        assertNotNull(parsedFractionOffset)

        assertEquals(parsedZ!!.time, parsedOffset!!.time)
        assertEquals(123L, parsedFractionOffset!!.time - parsedOffset.time)
    }

    @Test
    fun testParseNonUtcOffsetWithoutTimezoneDistortion() {
        // 14:00:00 at +05:30 corresponds exactly to 08:30:00 UTC
        val parsedUtc = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00.123Z")
        val parsedLocal = ReservationTimeHelper.parseUtcInstant("2026-09-27T14:00:00.123+05:30")

        assertNotNull(parsedUtc)
        assertNotNull(parsedLocal)
        assertEquals(parsedUtc!!.time, parsedLocal!!.time)
    }

    @Test
    fun testParseNegativeOffset() {
        // 03:00:00 at -05:30 corresponds exactly to 08:30:00 UTC
        val parsedUtc = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00.123Z")
        val parsedLocal = ReservationTimeHelper.parseUtcInstant("2026-09-27T03:00:00.123-05:30")

        assertNotNull(parsedUtc)
        assertNotNull(parsedLocal)
        assertEquals(parsedUtc!!.time, parsedLocal!!.time)
    }

    @Test
    fun testParseUnspecifiedOffsetTreatedAsUtc() {
        val parsedNoOffset = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00")
        val parsedZ = ReservationTimeHelper.parseUtcInstant("2026-09-27T08:30:00Z")

        assertNotNull(parsedNoOffset)
        assertNotNull(parsedZ)
        assertEquals(parsedZ!!.time, parsedNoOffset!!.time)
    }

    @Test
    fun testMalformedTimestampsFailSafely() {
        assertNull(ReservationTimeHelper.parseUtcInstant(null))
        assertNull(ReservationTimeHelper.parseUtcInstant(""))
        assertNull(ReservationTimeHelper.parseUtcInstant("   "))
        assertNull(ReservationTimeHelper.parseUtcInstant("not-a-date"))
        assertNull(ReservationTimeHelper.parseUtcInstant("2026-02-31T08:30:00Z")) // Non-existent date
        assertNull(ReservationTimeHelper.parseUtcInstant("2026-13-01T08:30:00Z")) // Invalid month
        assertNull(ReservationTimeHelper.parseUtcInstant("2026-09-27T25:00:00Z")) // Invalid hour
        assertNull(ReservationTimeHelper.parseUtcInstant("2026-09-27 08:30:00")) // Missing 'T'

        // Malformed strings must cause hasTwelveHoursNotice to fail safe (return false)
        assertFalse(ReservationTimeHelper.hasTwelveHoursNotice(null))
        assertFalse(ReservationTimeHelper.hasTwelveHoursNotice(""))
        assertFalse(ReservationTimeHelper.hasTwelveHoursNotice("invalid"))
        assertFalse(ReservationTimeHelper.hasTwelveHoursNotice("2026-02-31T08:30:00Z"))
    }

    @Test
    fun testTwelveHourNoticeBoundaryLogic() {
        val slotIso = "2026-09-27T20:00:00Z"
        val slotDate = ReservationTimeHelper.parseUtcInstant(slotIso)
        assertNotNull(slotDate)
        val slotMillis = slotDate!!.time

        val twelveHours = 12L * 60L * 60L * 1000L

        // Exactly 12 hours before slot
        val nowExact12h = slotMillis - twelveHours
        assertTrue(ReservationTimeHelper.hasTwelveHoursNotice(slotIso, nowExact12h))

        // 12 hours + 1 millisecond before slot
        val nowMoreThan12h = slotMillis - twelveHours - 1L
        assertTrue(ReservationTimeHelper.hasTwelveHoursNotice(slotIso, nowMoreThan12h))

        // 12 hours - 1 millisecond before slot (11h 59m 59s 999ms)
        val nowLessThan12h = slotMillis - twelveHours + 1L
        assertFalse(ReservationTimeHelper.hasTwelveHoursNotice(slotIso, nowLessThan12h))

        // 11 hours before slot
        val now11h = slotMillis - (11L * 60L * 60L * 1000L)
        assertFalse(ReservationTimeHelper.hasTwelveHoursNotice(slotIso, now11h))

        // In the past
        val nowPast = slotMillis + 1000L
        assertFalse(ReservationTimeHelper.hasTwelveHoursNotice(slotIso, nowPast))
    }

    @Test
    fun testToIsoUtcString() {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
            clear()
            set(2026, Calendar.SEPTEMBER, 27, 8, 30, 0)
        }
        val iso = ReservationTimeHelper.toIsoUtcString(cal.time)
        assertEquals("2026-09-27T08:30:00Z", iso)
    }
}
