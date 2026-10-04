package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.data

import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.StationReferenceDto
import com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model.StationSlotDto
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/**
 * Member 2 data access repository for querying available charging stations and slot records via [ApiClient].
 */
class StationSlotRepository {

    /**
     * Retrieves all charging stations from GET /api/stations.
     *
     * @param bearerToken Optional Bearer authorization token.
     * @param callback Callback delivering the list of stations on the UI thread.
     */
    fun getStations(
        bearerToken: String? = null,
        callback: ApiCallback<List<StationReferenceDto>>
    ) {
        ApiClient.sendRequest(
            method = HttpMethod.GET,
            endpoint = "stations",
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val stations = StationReferenceDto.fromJsonPayload(result.responseBody)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, stations))
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Failed to parse stations response.")
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
     * Retrieves all energy booking slots for a specific station from GET /api/stations/{stationId}/slots.
     *
     * @param stationId Unique identifier of the station.
     * @param bearerToken Optional Bearer authorization token.
     * @param callback Callback delivering the list of slots on the UI thread.
     */
    fun getStationSlots(
        stationId: String,
        bearerToken: String? = null,
        callback: ApiCallback<List<StationSlotDto>>
    ) {
        val encodedId = URLEncoder.encode(stationId.trim(), StandardCharsets.UTF_8.name())
        val endpoint = "stations/$encodedId/slots"

        ApiClient.sendRequest(
            method = HttpMethod.GET,
            endpoint = endpoint,
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val slots = StationSlotDto.fromJsonPayload(result.responseBody)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, slots))
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Failed to parse station slots response.")
                        )
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }
}
