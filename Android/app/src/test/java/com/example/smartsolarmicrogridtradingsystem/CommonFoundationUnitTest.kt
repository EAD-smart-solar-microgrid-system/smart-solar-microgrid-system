package com.example.smartsolarmicrogridtradingsystem

import com.example.smartsolarmicrogridtradingsystem.core.config.AppConfig
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.data.local.model.LocalSession
import com.example.smartsolarmicrogridtradingsystem.data.local.sqlite.DatabaseContract
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests verifying common foundation classes, models, and configuration.
 */
class CommonFoundationUnitTest {

    @Test
    fun testAppConfigConstants() {
        assertEquals("http://YOUR_PC_LAN_IP:PORT/api/", AppConfig.BASE_URL)
        assertEquals(15000, AppConfig.CONNECT_TIMEOUT_MS)
        assertEquals(15000, AppConfig.READ_TIMEOUT_MS)
    }

    @Test
    fun testHttpMethods() {
        val methods = HttpMethod.values().map { it.name }
        assertTrue(methods.contains("GET"))
        assertTrue(methods.contains("POST"))
        assertTrue(methods.contains("PUT"))
        assertTrue(methods.contains("PATCH"))
        assertTrue(methods.contains("DELETE"))
        assertEquals(5, methods.size)
    }

    @Test
    fun testNetworkResultHierarchy() {
        val success = NetworkResult.Success(200, "{\"status\":\"ok\"}")
        assertEquals(200, success.statusCode)
        assertEquals("{\"status\":\"ok\"}", success.responseBody)

        val httpError = NetworkResult.HttpError(400, "Bad Request")
        assertEquals(400, httpError.statusCode)
        assertEquals("Bad Request", httpError.errorBody)

        val unauthorized = NetworkResult.Unauthorized(401, "Token expired")
        assertEquals(401, unauthorized.statusCode)
        assertEquals("Token expired", unauthorized.errorBody)

        val networkError = NetworkResult.NetworkError(null, "No internet")
        assertEquals("No internet", networkError.message)
    }

    @Test
    fun testLocalSessionModel() {
        val session = LocalSession(
            id = 1L,
            userIdentifier = "200012345678",
            role = "Solar Prosumer",
            lastUpdated = 1700000000000L
        )
        assertEquals(1L, session.id)
        assertEquals("200012345678", session.userIdentifier)
        assertEquals("Solar Prosumer", session.role)
        assertEquals(1700000000000L, session.lastUpdated)
    }

    @Test
    fun testDatabaseContract() {
        assertEquals("smart_solar_microgrid.db", DatabaseContract.DATABASE_NAME)
        assertEquals(1, DatabaseContract.DATABASE_VERSION)
        assertEquals("local_session", DatabaseContract.SessionEntry.TABLE_NAME)
        assertTrue(DatabaseContract.SessionEntry.SQL_CREATE_TABLE.contains("CREATE TABLE local_session"))
        assertTrue(DatabaseContract.SessionEntry.SQL_CREATE_TABLE.contains("user_identifier TEXT NOT NULL"))
        assertTrue(DatabaseContract.SessionEntry.SQL_CREATE_TABLE.contains("role TEXT NOT NULL"))
        assertTrue(DatabaseContract.SessionEntry.SQL_CREATE_TABLE.contains("last_updated INTEGER NOT NULL"))
    }

    @Test
    fun testApiClientResolveUrl() {
        val resolvedWithSlash = ApiClient.resolveUrl("/energy/slots")
        assertEquals("http://YOUR_PC_LAN_IP:PORT/api/energy/slots", resolvedWithSlash)

        val resolvedWithoutSlash = ApiClient.resolveUrl("energy/slots")
        assertEquals("http://YOUR_PC_LAN_IP:PORT/api/energy/slots", resolvedWithoutSlash)

        val absoluteUrl = ApiClient.resolveUrl("http://example.com/api/test")
        assertEquals("http://example.com/api/test", absoluteUrl)
    }
}
