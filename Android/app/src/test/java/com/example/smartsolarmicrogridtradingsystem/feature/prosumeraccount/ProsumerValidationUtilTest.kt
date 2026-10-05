package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount

import com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.util.ProsumerValidationUtil
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests verifying Solar Prosumer form and input validation rules
 * for registration and profile update.
 */
class ProsumerValidationUtilTest {

    // ==========================================
    // STEP 3 & STEP 14: NIC Validation Test Cases
    // ==========================================

    @Test
    fun testNic_blank_rejected() {
        assertFalse(ProsumerValidationUtil.isValidNic(""))
        assertFalse(ProsumerValidationUtil.isValidNic("   "))
        assertFalse(ProsumerValidationUtil.isValidNic(null))
    }

    @Test
    fun testNic_validOldNicEndingV_allowed() {
        assertTrue(ProsumerValidationUtil.isValidNic("123456789V"))
    }

    @Test
    fun testNic_validOldNicEndingX_allowed() {
        assertTrue(ProsumerValidationUtil.isValidNic("123456789X"))
    }

    @Test
    fun testNic_lowercaseVAndX_normalizedAndAllowed() {
        assertTrue(ProsumerValidationUtil.isValidNic("123456789v"))
        assertTrue(ProsumerValidationUtil.isValidNic("123456789x"))
        assertEquals("123456789V", ProsumerValidationUtil.normalizeNic("123456789v"))
        assertEquals("123456789X", ProsumerValidationUtil.normalizeNic(" 123456789x "))
    }

    @Test
    fun testNic_valid12DigitNewNic_allowed() {
        assertTrue(ProsumerValidationUtil.isValidNic("200012345678"))
    }

    @Test
    fun testNic_malformedValues_rejected() {
        assertFalse(ProsumerValidationUtil.isValidNic("12345"))
        assertFalse(ProsumerValidationUtil.isValidNic("123456789A"))
        assertFalse(ProsumerValidationUtil.isValidNic("20001234567"))
        assertFalse(ProsumerValidationUtil.isValidNic("ABC123456789"))
        assertFalse(ProsumerValidationUtil.isValidNic("1234567890123"))
    }

    @Test
    fun testNic_whitespaceTrimmedBeforeValidation() {
        assertTrue(ProsumerValidationUtil.isValidNic("  123456789V  "))
        assertTrue(ProsumerValidationUtil.isValidNic("  200012345678  "))
    }

    // ==========================================
    // STEP 5 & STEP 14: Full Name Validation Test Cases
    // ==========================================

    @Test
    fun testFullName_blankAndWhitespace_rejected() {
        assertFalse(ProsumerValidationUtil.isValidFullName(""))
        assertFalse(ProsumerValidationUtil.isValidFullName(" "))
        assertFalse(ProsumerValidationUtil.isValidFullName("   "))
        assertFalse(ProsumerValidationUtil.isValidFullName(null))
    }

    @Test
    fun testFullName_shortAndSingleCharacter_rejected() {
        assertFalse(ProsumerValidationUtil.isValidFullName("A"))
        assertFalse(ProsumerValidationUtil.isValidFullName("a"))
        assertFalse(ProsumerValidationUtil.isValidFullName("1"))
    }

    @Test
    fun testFullName_normalValidNames_allowed() {
        assertTrue(ProsumerValidationUtil.isValidFullName("John Silva"))
        assertTrue(ProsumerValidationUtil.isValidFullName("Anne-Marie Silva"))
        assertTrue(ProsumerValidationUtil.isValidFullName("O'Connor"))
        assertTrue(ProsumerValidationUtil.isValidFullName("A. Silva"))
        assertTrue(ProsumerValidationUtil.isValidFullName("නිමල් පෙරේරා"))
    }

    @Test
    fun testFullName_invalidCharacters_rejected() {
        assertFalse(ProsumerValidationUtil.isValidFullName("ag6568"))
        assertFalse(ProsumerValidationUtil.isValidFullName("John123"))
        assertFalse(ProsumerValidationUtil.isValidFullName("123456"))
        assertFalse(ProsumerValidationUtil.isValidFullName("@@@"))
        assertFalse(ProsumerValidationUtil.isValidFullName("John@Silva"))
        assertFalse(ProsumerValidationUtil.isValidFullName("###"))
    }

    // ==========================================
    // STEP 6 & STEP 14: Email Validation Test Cases
    // ==========================================

    @Test
    fun testEmail_blank_rejected() {
        assertFalse(ProsumerValidationUtil.isValidEmail(""))
        assertFalse(ProsumerValidationUtil.isValidEmail("   "))
        assertFalse(ProsumerValidationUtil.isValidEmail(null))
    }

    @Test
    fun testEmail_malformed_rejected() {
        assertFalse(ProsumerValidationUtil.isValidEmail("plainaddress"))
        assertFalse(ProsumerValidationUtil.isValidEmail("@missinguser.com"))
        assertFalse(ProsumerValidationUtil.isValidEmail("user@"))
        assertFalse(ProsumerValidationUtil.isValidEmail("user@.com"))
    }

    @Test
    fun testEmail_valid_allowed() {
        assertTrue(ProsumerValidationUtil.isValidEmail("prosumer@solar.lk"))
        assertTrue(ProsumerValidationUtil.isValidEmail("test.user+tag@domain.com"))
    }

    // ==========================================
    // STEP 7 & STEP 14: Phone Validation Test Cases
    // ==========================================

    @Test
    fun testPhone_blank_allowedWhenOptional() {
        assertTrue(ProsumerValidationUtil.isValidPhoneNumber(""))
        assertTrue(ProsumerValidationUtil.isValidPhoneNumber("   "))
        assertTrue(ProsumerValidationUtil.isValidPhoneNumber(null))
    }

    @Test
    fun testPhone_lettersInPhone_rejected() {
        assertFalse(ProsumerValidationUtil.isValidPhoneNumber("071234567a"))
        assertFalse(ProsumerValidationUtil.isValidPhoneNumber("phone123"))
        assertFalse(ProsumerValidationUtil.isValidPhoneNumber("abcdefghij"))
    }

    @Test
    fun testPhone_invalidFormatAndLength_rejected() {
        assertFalse(ProsumerValidationUtil.isValidPhoneNumber("071234567")) // 9 digits
        assertFalse(ProsumerValidationUtil.isValidPhoneNumber("071234567890")) // 12 digits
        assertFalse(ProsumerValidationUtil.isValidPhoneNumber("+9471234567")) // missing 2 digits
    }

    @Test
    fun testPhone_validSriLankanFormats_allowed() {
        assertTrue(ProsumerValidationUtil.isValidPhoneNumber("0712345678"))
        assertTrue(ProsumerValidationUtil.isValidPhoneNumber("+94712345678"))
        assertTrue(ProsumerValidationUtil.isValidPhoneNumber("071-234-5678"))
        assertTrue(ProsumerValidationUtil.isValidPhoneNumber("071 234 5678"))
        assertTrue(ProsumerValidationUtil.isValidPhoneNumber("+94 71 234 5678"))
    }

    // ==========================================
    // STEP 8 & STEP 14: Address Validation Test Cases
    // ==========================================

    @Test
    fun testAddress_blank_allowedWhenOptional() {
        assertTrue(ProsumerValidationUtil.isValidAddress(""))
        assertTrue(ProsumerValidationUtil.isValidAddress("   "))
        assertTrue(ProsumerValidationUtil.isValidAddress(null))
    }

    @Test
    fun testAddress_normalAndSpecialSymbols_allowed() {
        assertTrue(ProsumerValidationUtil.isValidAddress("No. 12/B, Galle Road, Colombo-03"))
        assertTrue(ProsumerValidationUtil.isValidAddress("Flat 4B, St. Peter's Lane, Kandy"))
    }

    @Test
    fun testAddress_tooLong_rejected() {
        val longAddress = "A".repeat(251)
        assertFalse(ProsumerValidationUtil.isValidAddress(longAddress))
        val maxAddress = "A".repeat(250)
        assertTrue(ProsumerValidationUtil.isValidAddress(maxAddress))
    }
}
