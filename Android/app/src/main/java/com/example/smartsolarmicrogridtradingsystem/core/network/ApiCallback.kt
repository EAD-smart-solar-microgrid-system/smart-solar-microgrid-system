package com.example.smartsolarmicrogridtradingsystem.core.network

/**
 * Common generic callback interface for handling asynchronous network responses.
 * Implementations are guaranteed to receive callback invocations on the Android main (UI) thread.
 */
interface ApiCallback<T> {
    /**
     * Invoked when the network request succeeds with a 2xx HTTP status code.
     *
     * @param result Encapsulates the HTTP status code and response body.
     */
    fun onSuccess(result: NetworkResult.Success<T>)

    /**
     * Invoked when an HTTP error (4xx/5xx), connectivity failure, or unauthorized status occurs.
     *
     * @param error Encapsulates the error details (HttpError, NetworkError, or Unauthorized).
     */
    fun onError(error: NetworkResult<Nothing>)
}
