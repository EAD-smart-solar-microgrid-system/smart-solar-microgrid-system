package com.example.smartsolarmicrogridtradingsystem.core.network

import android.util.Log
import com.example.smartsolarmicrogridtradingsystem.BuildConfig
import com.example.smartsolarmicrogridtradingsystem.core.config.AppConfig
import com.example.smartsolarmicrogridtradingsystem.core.threading.AppExecutors
import org.json.JSONObject
import java.io.InputStream
import java.io.IOException
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

    private const val TAG = "SmartSolarApi"

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
                logDebug("Request ${method.name} $fullUrl")
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

                if (statusCode == HttpURLConnection.HTTP_UNAUTHORIZED) {
                    val errorBody = readStream(connection.errorStream)
                    logResponse(method, fullUrl, statusCode, errorBody)
                    AppExecutors.executeOnMainThread {
                        callback.onError(NetworkResult.Unauthorized(statusCode, errorBody))
                    }
                } else if (statusCode in 200..299) {
                    val responseBody = readStream(connection.inputStream) ?: ""
                    logResponse(method, fullUrl, statusCode, responseBody)
                    AppExecutors.executeOnMainThread {
                        callback.onSuccess(NetworkResult.Success(statusCode, responseBody))
                    }
                } else {
                    val errorBody = readStream(connection.errorStream)
                    logResponse(method, fullUrl, statusCode, errorBody)
                    AppExecutors.executeOnMainThread {
                        callback.onError(NetworkResult.HttpError(statusCode, errorBody))
                    }
                }
            } catch (e: IOException) {
                logException("Transport failure for ${method.name} ${resolveUrl(endpoint)}", e)
                AppExecutors.executeOnMainThread {
                    callback.onError(NetworkResult.NetworkError(e, e.localizedMessage ?: "Network connection error"))
                }
            } catch (e: Exception) {
                logException("Unexpected client failure for ${method.name} ${resolveUrl(endpoint)}", e)
                AppExecutors.executeOnMainThread {
                    callback.onError(NetworkResult.UnexpectedError(e, e.localizedMessage ?: "Unexpected client error"))
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

    private fun logDebug(message: String) {
        if (BuildConfig.DEBUG) Log.d(TAG, message)
    }

    private fun logResponse(method: HttpMethod, url: String, statusCode: Int, body: String?) {
        logDebug("Response ${method.name} $url status=$statusCode body=${safeBodyForLog(body)}")
    }

    private fun logException(message: String, exception: Exception) {
        if (BuildConfig.DEBUG) {
            Log.e(TAG, "$message exception=${exception.javaClass.name} message=${exception.message}", exception)
        }
    }

    private fun safeBodyForLog(body: String?): String {
        if (body.isNullOrBlank()) return "<empty>"

        return try {
            val json = JSONObject(body)
            val sensitiveKeys = listOf(
                "nic", "fullName", "email", "phoneNumber", "address",
                "token", "accessToken", "refreshToken", "password", "secret",
                "authorization"
            )
            sensitiveKeys.forEach { key ->
                if (json.has(key)) json.put(key, "<redacted>")
            }
            json.toString()
        } catch (_: Exception) {
            "<non-JSON body omitted>"
        }
    }
}
