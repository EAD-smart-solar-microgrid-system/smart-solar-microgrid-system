package com.example.smartsolarmicrogridtradingsystem.data.repository

import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.NearbyStationDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ProsumerDashboardDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ReservationMonitoringListDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.StationReferenceDto
import org.json.JSONObject
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/**
 * Member 4 repository for dashboard and reservation-monitoring read APIs.
 */
class Member4DashboardRepository {

    /**
     * Loads the prosumer dashboard summary from the C# Web API.
     */
    fun getProsumerDashboard(
        prosumerId: String,
        bearerToken: String?,
        callback: ApiCallback<ProsumerDashboardDto>
    ) {
        val endpoint = "member4/dashboard/prosumer/${encode(prosumerId)}"
        ApiClient.sendRequest(
            method = HttpMethod.GET,
            endpoint = endpoint,
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val dto = ProsumerDashboardDto.fromJson(JSONObject(result.responseBody))
                        callback.onSuccess(
                            NetworkResult.Success(result.statusCode, dto)
                        )
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Unable to parse dashboard response.")
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
     * Loads filtered reservation monitoring rows from the C# Web API.
     */
    fun getReservationMonitoring(
        filters: Map<String, String>,
        bearerToken: String?,
        callback: ApiCallback<ReservationMonitoringListDto>
    ) {
        val query = buildQuery(filters)
        val endpoint = if (query.isEmpty()) {
            "member4/reservation-monitoring"
        } else {
            "member4/reservation-monitoring?$query"
        }

        ApiClient.sendRequest(
            method = HttpMethod.GET,
            endpoint = endpoint,
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val dto = ReservationMonitoringListDto.fromJson(JSONObject(result.responseBody))
                        callback.onSuccess(
                            NetworkResult.Success(result.statusCode, dto)
                        )
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(
                                ex,
                                "Unable to parse reservation monitoring response."
                            )
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
     * Loads nearby stations for the Member 4 Google Maps screen.
     */
    fun getNearbyStations(
        latitude: Double,
        longitude: Double,
        radiusKm: Double,
        bearerToken: String?,
        callback: ApiCallback<List<NearbyStationDto>>
    ) {
        val query = buildQuery(
            mapOf(
                "latitude" to latitude.toString(),
                "longitude" to longitude.toString(),
                "radiusKm" to radiusKm.toString()
            )
        )
        val endpoint = "member4/stations/nearby?$query"

        ApiClient.sendRequest(
            method = HttpMethod.GET,
            endpoint = endpoint,
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val stations = NearbyStationDto.fromJsonPayload(result.responseBody)
                        callback.onSuccess(
                            NetworkResult.Success(result.statusCode, stations)
                        )
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Unable to parse nearby stations response.")
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
     * Loads station reference data for Member 4 SQLite caching.
     */
    fun getStations(
        bearerToken: String?,
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
                        callback.onSuccess(
                            NetworkResult.Success(result.statusCode, stations)
                        )
                    } catch (ex: Exception) {
                        callback.onError(
                            NetworkResult.NetworkError(ex, "Unable to parse stations response.")
                        )
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    private fun buildQuery(filters: Map<String, String>): String {
        return filters
            .filterValues { it.isNotBlank() }
            .entries
            .joinToString("&") { (key, value) ->
                "${encode(key)}=${encode(value)}"
            }
    }

    private fun encode(value: String): String {
        return URLEncoder.encode(value, StandardCharsets.UTF_8.name())
    }
}
