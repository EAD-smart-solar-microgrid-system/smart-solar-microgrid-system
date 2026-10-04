package com.example.smartsolarmicrogridtradingsystem.core.utils

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build

/**
 * Utility for inspecting network connectivity states.
 * Correctly supports minimum SDK API 24 through target SDK 36.
 */
object ConnectivityUtil {

    /**
     * Determines whether the device currently has an active and usable network connection.
     *
     * @param context Android application or activity context.
     * @return True if a Wi-Fi, Cellular, or Ethernet connection with Internet capability is active.
     */
    fun isNetworkAvailable(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return false

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val activeNetwork = connectivityManager.activeNetwork ?: return false
            val networkCapabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false

            return networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                    (networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                     networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                     networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET))
        } else {
            @Suppress("DEPRECATION")
            val activeNetworkInfo = connectivityManager.activeNetworkInfo
            @Suppress("DEPRECATION")
            return activeNetworkInfo != null && activeNetworkInfo.isConnected
        }
    }
}
