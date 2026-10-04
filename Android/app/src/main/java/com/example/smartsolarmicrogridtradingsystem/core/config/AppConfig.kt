package com.example.smartsolarmicrogridtradingsystem.core.config

/**
 * Global application configuration settings.
 *
 * IMPORTANT NETWORKING NOTES:
 * - Emulator: use http://10.0.2.2:5278/api/ (maps to the host PC loopback).
 * - Physical phone: use http://YOUR_PC_LAN_IP:5278/api/ on the same Wi-Fi
 *   (current LAN example: http://192.168.1.14:5278/api/), and run the API with
 *   --urls http://0.0.0.0:5278 so it accepts LAN traffic.
 * - Never use localhost/127.0.0.1 on a physical phone — that points at the phone itself.
 * - SECURITY NOTICE: Never commit passwords, private API tokens, or database connection strings.
 */
object AppConfig {
    /**
     * Base URL for the central C# Web API endpoints.
     * Default targets the Android emulator talking to a local Kestrel API on port 5278.
     */
    const val BASE_URL: String = "http://127.0.0.1:5278/api/"

    /**
     * Connection timeout in milliseconds for HTTP connections.
     */
    const val CONNECT_TIMEOUT_MS: Int = 15_000

    /**
     * Read timeout in milliseconds for reading HTTP response streams.
     */
    const val READ_TIMEOUT_MS: Int = 15_000
}
