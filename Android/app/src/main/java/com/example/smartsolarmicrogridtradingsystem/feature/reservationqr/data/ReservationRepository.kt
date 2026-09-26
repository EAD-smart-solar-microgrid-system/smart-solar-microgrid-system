package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data

import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.CancelReservationRequest
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.CreateReservationRequest
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.QrTokenDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.ReservationDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.UpdateReservationRequest
import org.json.JSONObject
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/**
 * Member 2 repository for Reservation & QR Dispatch command APIs.
 *
 * Interacts with the backend C# Web API endpoints via [ApiClient]:
 * - POST   /api/reservations               -> Create new reservation
 * - PUT    /api/reservations/{id}          -> Update existing reservation (12-hour rule)
 * - POST   /api/reservations/{id}/cancel   -> Cancel reservation (12-hour rule)
 * - POST   /api/reservations/{id}/qr-token -> Generate cryptographically secure QR token (Approved only)
 */
class ReservationRepository {

    companion object {
        @Volatile
        private var instance: ReservationRepository? = null

        /**
         * Returns the shared singleton instance of [ReservationRepository].
         */
        fun getInstance(): ReservationRepository {
            return instance ?: synchronized(this) {
                instance ?: ReservationRepository().also { instance = it }
            }
        }

        /**
         * Extracts a user-friendly error message from a [NetworkResult] error outcome,
         * inspecting backend JSON error payloads ("message", "title") or falling back safely.
         */
        fun extractErrorMessage(error: NetworkResult<*>): String {
            return when (error) {
                is NetworkResult.HttpError -> parseErrorBody(error.errorBody) ?: "Server error (${error.statusCode})"
                is NetworkResult.Unauthorized -> parseErrorBody(error.errorBody) ?: "Authentication session expired or unauthorized."
                is NetworkResult.NetworkError -> error.message ?: error.exception?.localizedMessage ?: "Unable to connect to the server."
                is NetworkResult.Success -> "Operation succeeded."
            }
        }

        private fun parseErrorBody(body: String?): String? {
            if (body.isNullOrBlank()) return null
            return try {
                val json = JSONObject(body)
                when {
                    json.has("message") && !json.isNull("message") -> json.optString("message")
                    json.has("Message") && !json.isNull("Message") -> json.optString("Message")
                    json.has("title") && !json.isNull("title") -> json.optString("title")
                    json.has("Title") && !json.isNull("Title") -> json.optString("Title")
                    else -> null
                }
            } catch (_: Exception) {
                // If body is plain text and reasonably short, return it
                body.takeIf { it.length < 250 }
            }
        }
    }

    /**
     * Creates a new scheduled energy slot reservation.
     *
     * @param request Reservation creation parameters.
     * @param bearerToken Optional Bearer authorization token if present in session.
     * @param callback Callback delivering the created [ReservationDto] on the main UI thread.
     */
    fun createReservation(
        request: CreateReservationRequest,
        bearerToken: String? = null,
        callback: ApiCallback<ReservationDto>
    ) {
        val endpoint = "reservations"
        val payload = request.toJson()

        ApiClient.sendRequest(
            method = HttpMethod.POST,
            endpoint = endpoint,
            requestBody = payload,
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val dto = ReservationDto.fromJson(json)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, dto))
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Failed to parse reservation creation response.")
                        )
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    /**
     * Modifies the slot or scheduled timestamp of an existing reservation.
     * Enforces the 12-hour notice rule on the server.
     *
     * @param id Unique reservation identifier.
     * @param request Update parameters (dateTime, optional slotId, optional reservationType).
     * @param bearerToken Optional Bearer authorization token.
     * @param callback Callback delivering the updated [ReservationDto] on the main UI thread.
     */
    fun updateReservation(
        id: String,
        request: UpdateReservationRequest,
        bearerToken: String? = null,
        callback: ApiCallback<ReservationDto>
    ) {
        val endpoint = "reservations/${encode(id)}"
        val payload = request.toJson()

        ApiClient.sendRequest(
            method = HttpMethod.PUT,
            endpoint = endpoint,
            requestBody = payload,
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val dto = ReservationDto.fromJson(json)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, dto))
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Failed to parse reservation update response.")
                        )
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    /**
     * Cancels an existing reservation, subject to the 12-hour notice policy.
     *
     * @param id Unique reservation identifier.
     * @param request Optional cancellation remarks.
     * @param bearerToken Optional Bearer authorization token.
     * @param callback Callback delivering the cancelled [ReservationDto] on the main UI thread.
     */
    fun cancelReservation(
        id: String,
        request: CancelReservationRequest? = null,
        bearerToken: String? = null,
        callback: ApiCallback<ReservationDto>
    ) {
        val endpoint = "reservations/${encode(id)}/cancel"
        val payload = request?.toJson() ?: JSONObject()

        ApiClient.sendRequest(
            method = HttpMethod.POST,
            endpoint = endpoint,
            requestBody = payload,
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val dto = ReservationDto.fromJson(json)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, dto))
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Failed to parse reservation cancellation response.")
                        )
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    /**
     * Requests generation of a cryptographically secure QR token for mobile presentation.
     * Per business rules, this requires the reservation to be in "Approved" status.
     *
     * @param id Unique reservation identifier.
     * @param bearerToken Optional Bearer authorization token.
     * @param callback Callback delivering the [QrTokenDto] on the main UI thread.
     */
    fun generateQrToken(
        id: String,
        bearerToken: String? = null,
        callback: ApiCallback<QrTokenDto>
    ) {
        val endpoint = "reservations/${encode(id)}/qr-token"

        ApiClient.sendRequest(
            method = HttpMethod.POST,
            endpoint = endpoint,
            requestBody = JSONObject(),
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val dto = QrTokenDto.fromJson(json)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, dto))
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Failed to parse QR token response.")
                        )
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    private fun encode(value: String): String {
        return URLEncoder.encode(value.trim(), StandardCharsets.UTF_8.name())
    }
}
