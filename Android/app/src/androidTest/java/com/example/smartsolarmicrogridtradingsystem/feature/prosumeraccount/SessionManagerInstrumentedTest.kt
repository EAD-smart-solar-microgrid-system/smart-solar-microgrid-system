package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount

import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

/** Verifies the SQLite session flow used by Prosumer login and logout. */
@RunWith(AndroidJUnit4::class)
class SessionManagerInstrumentedTest {

    private lateinit var sessionManager: SessionManager

    @Before
    fun setUp() {
        sessionManager = SessionManager(ApplicationProvider.getApplicationContext())
        sessionManager.clearSession()
    }

    @After
    fun tearDown() {
        sessionManager.clearSession()
    }

    @Test
    fun saveSessionRestoresProsumerIdentityAndToken() {
        sessionManager.saveSession("test-jwt-token", "NIC-123", "Prosumer")

        assertTrue(sessionManager.isLoggedIn())
        assertEquals("test-jwt-token", sessionManager.getToken())
        assertEquals("NIC-123", sessionManager.getUserIdentifier())
        assertEquals("Prosumer", sessionManager.getRole())
    }

    @Test
    fun clearSessionLogsUserOutAndRemovesStoredCredentials() {
        sessionManager.saveSession("test-jwt-token", "NIC-123", "Prosumer")

        sessionManager.clearSession()

        assertFalse(sessionManager.isLoggedIn())
        assertEquals(null, sessionManager.getToken())
        assertEquals(null, sessionManager.getUserIdentifier())
        assertEquals(null, sessionManager.getRole())
    }
}
