package com.example.smartsolarmicrogridtradingsystem.core.network

/**
 * Common sealed hierarchy representing outcomes of API network calls.
 * This class is strictly generic and reusable across all features.
 */
sealed class NetworkResult<out T> {

    /**
     * Successful HTTP response (2xx).
     *
     * @param statusCode HTTP status code (e.g. 200, 201, 204).
     * @param responseBody Response payload content.
     */
    data class Success<out T>(
        val statusCode: Int,
        val responseBody: T
    ) : NetworkResult<T>()

    /**
     * Non-success HTTP error response (4xx, 5xx excluding 401 Unauthorized).
     *
     * @param statusCode HTTP status code returned by the server.
     * @param errorBody Error response body string (if available).
     */
    data class HttpError(
        val statusCode: Int,
        val errorBody: String?
    ) : NetworkResult<Nothing>()

    /**
     * Low-level connectivity, timeout, or parsing failure.
     *
     * @param exception The underlying throwable that caused the failure.
     * @param message Human-readable error message.
     */
    data class NetworkError(
        val exception: Throwable? = null,
        val message: String? = null
    ) : NetworkResult<Nothing>()

    /**
     * Authentication / authorization failure (HTTP 401 Unauthorized).
     *
     * @param statusCode Status code (defaults to 401).
     * @param errorBody Server error payload (if any).
     */
    data class Unauthorized(
        val statusCode: Int = 401,
        val errorBody: String? = null
    ) : NetworkResult<Nothing>()
}
