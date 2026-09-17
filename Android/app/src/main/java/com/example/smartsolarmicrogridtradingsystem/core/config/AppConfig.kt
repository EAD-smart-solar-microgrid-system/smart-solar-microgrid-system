package com.example.smartsolarmicrogridtradingsystem.core.config

/**
 * Global application configuration settings.
 *
 * IMPORTANT NETWORKING NOTES:
 * - A physical phone cannot use 'localhost' or '127.0.0.1' to access the development computer.
 *   On Android, 'localhost' refers to the loopback interface of the mobile device itself.
 * - The development computer and the physical testing phone must be connected to the same local network (e.g., Wi-Fi).
 * - Find your development machine's local IPv4 address (e.g. run 'ipconfig' on Windows) and replace YOUR_PC_LAN_IP
 *   and PORT with the actual host IP and port where the C# Web API is listening (e.g. http://192.168.1.100:5000/api/).
 * - SECURITY NOTICE: Never commit passwords, private API tokens, or database connection strings into this file
 *   or anywhere within the source repository.
 */
object AppConfig {
    /**
     * Base URL for the central C# Web API endpoints.
     */
    const val BASE_URL: String = "http://YOUR_PC_LAN_IP:PORT/api/"

    /**
     * Connection timeout in milliseconds for HTTP connections.
     */
    const val CONNECT_TIMEOUT_MS: Int = 15_000

    /**
     * Read timeout in milliseconds for reading HTTP response streams.
     */
    const val READ_TIMEOUT_MS: Int = 15_000
}
