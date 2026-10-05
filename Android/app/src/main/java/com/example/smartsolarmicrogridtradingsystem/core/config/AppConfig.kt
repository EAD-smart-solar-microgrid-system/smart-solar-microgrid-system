package com.example.smartsolarmicrogridtradingsystem.core.config

import android.os.Build
import com.example.smartsolarmicrogridtradingsystem.BuildConfig

/**
 * Global application configuration settings.
 *
 * Automatically resolves emulator loopback (10.0.2.2) vs LAN IP from BuildConfig
 * so networking works seamlessly across both Android Emulator and physical devices.
 */
object AppConfig {
    /**
     * Detects whether the app is executing inside an Android emulator.
     */
    val isEmulator: Boolean
        get() {
            val fp = Build.FINGERPRINT.orEmpty()
            val model = Build.MODEL.orEmpty()
            val manufacturer = Build.MANUFACTURER.orEmpty()
            val brand = Build.BRAND.orEmpty()
            val device = Build.DEVICE.orEmpty()
            val product = Build.PRODUCT.orEmpty()
            val hardware = Build.HARDWARE.orEmpty()

            return fp.startsWith("generic") ||
                    fp.startsWith("unknown") ||
                    model.contains("google_sdk") ||
                    model.contains("Emulator") ||
                    model.contains("Android SDK built for") ||
                    manufacturer.contains("Genymotion") ||
                    (brand.startsWith("generic") && device.startsWith("generic")) ||
                    "google_sdk" == product ||
                    hardware.contains("goldfish") ||
                    hardware.contains("ranchu")
        }

    /**
     * Base URL for the central C# Web API endpoints.
     */
    val BASE_URL: String
        get() = if (isEmulator) {
            "http://10.0.2.2:5278/api/"
        } else {
            BuildConfig.API_BASE_URL_LAN
        }

    /**
     * Connection timeout in milliseconds for HTTP connections.
     */
    const val CONNECT_TIMEOUT_MS: Int = 15_000

    /**
     * Read timeout in milliseconds for reading HTTP response streams.
     */
    const val READ_TIMEOUT_MS: Int = 15_000
}
