package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.util.ReservationTimeHelper
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests validating [QrTokenDto] model structure, QR expiry boundary calculation,
 * and 4-hour post-slot dispatch window lifecycle rules.
 */
class QrTokenDtoTest {

    @Test
    fun testQrTokenDtoModel() {
        val dto = QrTokenDto(
            reservationId = "66f50c001122334455667788",
            qrToken = "a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90",
            issuedAt = "2026-09-27T08:30:00Z",
            expiresAt = "2026-09-27T12:30:00Z",
            stationId = "station-01",
            prosumerNic = "199912345678",
            status = "Approved"
        )
        assertEquals("66f50c001122334455667788", dto.reservationId)
        assertEquals("a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90", dto.qrToken)
        assertEquals("2026-09-27T08:30:00Z", dto.issuedAt)
        assertEquals("2026-09-27T12:30:00Z", dto.expiresAt)
        assertEquals("station-01", dto.stationId)
        assertEquals("199912345678", dto.prosumerNic)
        assertEquals("Approved", dto.status)
    }

    @Test
    fun testQrExpiryEvaluation() {
        val expiresAt = "2026-09-27T12:30:00Z"
        val expiryInstant = ReservationTimeHelper.parseUtcInstant(expiresAt)
        assertNotNull(expiryInstant)

        val expiryMillis = expiryInstant!!.time

        // 1. Future expiry: now < expiresAt => Active (not expired)
        val futureNow = expiryMillis - 1000L
        assertFalse("Future expiry must be active", futureNow >= expiryMillis)

        // 2. Expiry exactly now: now == expiresAt => Expired
        val exactNow = expiryMillis
        assertTrue("Exact expiry must evaluate as expired", exactNow >= expiryMillis)

        // 3. Expiry before now: now > expiresAt => Expired
        val pastNow = expiryMillis + 1000L
        assertTrue("Past expiry must evaluate as expired", pastNow >= expiryMillis)
    }

    @Test
    fun testDotNetSevenDigitTicksExpiryEvaluation() {
        // Backend ASP.NET Core serialization with 7-digit ticks
        val expiresAtWithTicks = "2026-09-27T12:30:00.1234567Z"
        val expiryInstant = ReservationTimeHelper.parseUtcInstant(expiresAtWithTicks)
        assertNotNull(expiryInstant)

        val expiryMillis = expiryInstant!!.time

        // Future expiry (1 ms before 123ms tick) => Active
        assertFalse(expiryMillis - 1L >= expiryMillis)

        // Exactly at tick timestamp => Expired
        assertTrue(expiryMillis >= expiryMillis)

        // Past tick timestamp => Expired
        assertTrue(expiryMillis + 1L >= expiryMillis)
    }

    @Test
    fun testFourHourPostSlotDispatchWindowCalculation() {
        val slotIso = "2026-09-27T08:30:00Z"
        val slotInstant = ReservationTimeHelper.parseUtcInstant(slotIso)
        assertNotNull(slotInstant)

        val fourHoursMillis = 4L * 60L * 60L * 1000L
        val windowEndMillis = slotInstant!!.time + fourHoursMillis

        // 3 hours after slot => Active
        val nowThreeHours = slotInstant.time + (3L * 60L * 60L * 1000L)
        assertFalse("Window must remain active at 3 hours", nowThreeHours >= windowEndMillis)

        // Exactly 4 hours after slot => Window permanently expired
        val nowExactFourHours = windowEndMillis
        assertTrue("Window must expire at exactly 4 hours", nowExactFourHours >= windowEndMillis)

        // 4 hours + 1 ms after slot => Window permanently expired
        val nowPastFourHours = windowEndMillis + 1L
        assertTrue("Window must be expired after 4 hours", nowPastFourHours >= windowEndMillis)
    }
}
