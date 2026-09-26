package com.example.smartsolarmicrogridtradingsystem.core.config

/**
 * Global application configuration settings.
 *
 * IMPORTANT NETWORKING NOTES:
 * - A physical phone cannot use 'localhost' or '127.0.0.1' to access the development computer.
 *   On Android, 'localhost' refers to the loopback interface of the mobile device itself.
 * - The development computer and the physical testing phone must be connected to the same local network (e.g., Wi-Fi).
 * - The Android emulator reaches the host computer through 10.0.2.2. A physical phone must use the
 *   development machine's LAN IPv4 address and API port instead.
 * - SECURITY NOTICE: Never commit passwords, private API tokens, or database connection strings into this file
 *   or anywhere within the source repository.
 */
object AppConfig {
    /**
     * Base URL for the central C# Web API endpoints.
     */
    // Android Emulator development URL. 10.0.2.2 maps to the host machine.
    const val BASE_URL = "http://10.0.2.2:5278/api/"

    /**
     * Connection timeout in milliseconds for HTTP connections.
     */
    const val CONNECT_TIMEOUT_MS: Int = 15_000

    /**
     * Read timeout in milliseconds for reading HTTP response streams.
     */
    const val READ_TIMEOUT_MS: Int = 15_000
}
