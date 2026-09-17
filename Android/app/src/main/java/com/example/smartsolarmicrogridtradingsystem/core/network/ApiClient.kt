package com.example.smartsolarmicrogridtradingsystem.core.network

import android.util.Log
import com.example.smartsolarmicrogridtradingsystem.core.config.AppConfig
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import org.json.JSONObject
import java.io.InputStream
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.ProtocolException
import java.net.URL
import java.nio.charset.StandardCharsets

/**
 * Pure native HTTP REST client using HttpURLConnection.
 * Dispatches all network I/O to background threads and marshals callbacks back to the main UI thread.
 *
 * Strictly adheres to security rules:
 * - No sensitive data (passwords, tokens, NICs, PII) is logged.
 * - No feature-specific business logic or model parsing is included.
 */
object ApiClient {

    private const val TAG = "ApiClient"

    /**
     * Executes an asynchronous HTTP network request.
     *
     * @param method HTTP method (GET, POST, PUT, PATCH, DELETE).
     * @param endpoint Relative endpoint path (e.g., "energy/slots").
     * @param requestBody Optional JSON payload for the request body.
     * @param headers Optional custom HTTP headers.
     * @param bearerToken Optional Bearer authorization token.
     * @param callback Callback delivering the result on the main (UI) thread.
     */
    fun sendRequest(
        method: HttpMethod,
        endpoint: String,
        requestBody: JSONObject? = null,
        headers: Map<String, String>? = null,
        bearerToken: String? = null,
        callback: ApiCallback<String>
    ) {
        AppExecutors.executeInBackground {
            var connection: HttpURLConnection? = null
            try {
                val fullUrl = resolveUrl(endpoint)
                val url = URL(fullUrl)

                connection = (url.openConnection() as HttpURLConnection).apply {
                    connectTimeout = AppConfig.CONNECT_TIMEOUT_MS
                    readTimeout = AppConfig.READ_TIMEOUT_MS
                    setRequestProperty("Accept", "application/json")
                    setRequestProperty("Content-Type", "application/json; charset=utf-8")

                    // Apply bearer token securely without logging
                    if (!bearerToken.isNullOrBlank()) {
                        setRequestProperty("Authorization", "Bearer $bearerToken")
                    }

                    // Apply optional custom headers
                    headers?.forEach { (headerKey, headerValue) ->
                        setRequestProperty(headerKey, headerValue)
                    }

                    configureMethod(this, method)

                    // Write payload if present for applicable HTTP methods
                    if (requestBody != null && method != HttpMethod.GET) {
                        doOutput = true
                        val payloadString = requestBody.toString()
                        OutputStreamWriter(outputStream, StandardCharsets.UTF_8).use { writer ->
                            writer.write(payloadString)
                            writer.flush()
                        }
                    }
                }

                val statusCode = connection.responseCode
                Log.d(TAG, "Received HTTP status $statusCode for ${method.name} request")

                if (statusCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
                    val errorBody = readStream(connection.errorStream)
                    AppExecutors.executeOnMainThread {
                        callback.onError(NetworkResult.Unauthorized(statusCode, errorBody))
                    }
                } else if (statusCode in 200..299) {
                    val responseBody = readStream(connection.inputStream) ?: ""
                    AppExecutors.executeOnMainThread {
                        callback.onSuccess(NetworkResult.Success(statusCode, responseBody))
                    }
                } else {
                    val errorBody = readStream(connection.errorStream)
                    AppExecutors.executeOnMainThread {
                        callback.onError(NetworkResult.HttpError(statusCode, errorBody))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Network request failure: ${e.javaClass.simpleName}")
                AppExecutors.executeOnMainThread {
                    callback.onError(NetworkResult.NetworkError(e, e.localizedMessage ?: "Network connection error"))
                }
            } finally {
                connection?.disconnect()
            }
        }
    }

    /**
     * Safely joins relative endpoint paths with the base URL.
     */
    fun resolveUrl(endpoint: String): String {
        return if (endpoint.startsWith("http://", ignoreCase = true) || endpoint.startsWith("https://", ignoreCase = true)) {
            endpoint
        } else {
            val base = AppConfig.BASE_URL.trimEnd('/')
            val relative = endpoint.trimStart('/')
            "$base/$relative"
        }
    }

    /**
     * Configures the HTTP method, providing fallback override support for PATCH if required by runtime.
     */
    private fun configureMethod(connection: HttpURLConnection, method: HttpMethod) {
        try {
            connection.requestMethod = method.name
        } catch (e: ProtocolException) {
            if (method == HttpMethod.PATCH) {
                connection.requestMethod = "POST"
                connection.setRequestProperty("X-HTTP-Method-Override", "PATCH")
            } else {
                throw e
            }
        }
    }

    /**
     * Reads the entire content of an InputStream to String using UTF-8 encoding.
     */
    private fun readStream(stream: InputStream?): String? {
        if (stream == null) return null
        return stream.bufferedReader(StandardCharsets.UTF_8).use { it.readText() }
    }
}
