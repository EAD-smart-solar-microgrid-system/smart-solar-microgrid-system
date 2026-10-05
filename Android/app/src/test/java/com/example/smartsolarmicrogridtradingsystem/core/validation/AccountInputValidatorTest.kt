package com.example.smartsolarmicrogridtradingsystem.core.validation

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class AccountInputValidatorTest {
    @Test
    fun `NIC validation accepts old and new Sri Lankan formats`() {
        assertNull(AccountInputValidator.nicError("991234567v"))
        assertNull(AccountInputValidator.nicError("200012345678"))
        assertEquals("991234567V", AccountInputValidator.normalizeNic(" 991234567v "))
    }

    @Test
    fun `NIC validation rejects malformed values`() {
        assertTrue(AccountInputValidator.nicError("1234")!!.contains("9 digits"))
        assertTrue(AccountInputValidator.nicError(" ")!!.contains("required"))
    }

    @Test
    fun `Prosumer registration validates every supplied field`() {
        val valid = AccountInputValidator.validateProsumerRegistration(
            "200012345678",
            "Solar Citizen",
            "prosumer@example.com",
            "+94 71 234 5678",
            "Colombo, Sri Lanka"
        )
        assertFalse(valid.hasErrors)

        val invalid = AccountInputValidator.validateProsumerRegistration(
            "bad",
            "A",
            "bad-email",
            "123",
            "No"
        )
        assertTrue(invalid.hasErrors)
        assertTrue(listOf(invalid.nic, invalid.fullName, invalid.email, invalid.phone, invalid.address).all { it != null })
    }

    @Test
    fun `Login validation does not trim the password`() {
        assertNull(AccountInputValidator.loginPasswordError(" Password123 "))
        assertEquals("Password is required", AccountInputValidator.loginPasswordError(""))
    }
}
