package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.data

import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.request.RegisterProsumerRequestDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.request.UpdateProsumerProfileRequestDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ProsumerAuthResponseDto
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response.ProsumerProfileResponseDto
import org.json.JSONObject

/**
 * Repository for Solar Prosumer account operations:
 * - Registration (POST /api/prosumers/register)
 * - Authentication (POST /api/auth/prosumer-login)
 * - View Profile (GET /api/prosumers/me)
 * - Update Profile (PUT /api/prosumers/me)
 * - Deactivation Request (POST /api/prosumers/me/deactivation-request)
 */
class ProsumerAccountRepository {

    companion object {
        @Volatile
        private var instance: ProsumerAccountRepository? = null

        fun getInstance(): ProsumerAccountRepository {
            return instance ?: synchronized(this) {
                instance ?: ProsumerAccountRepository().also { instance = it }
            }
        }

        fun extractErrorMessage(error: NetworkResult<*>): String {
            return when (error) {
                is NetworkResult.HttpError -> parseErrorBody(error.errorBody) ?: "Server error (${error.statusCode})"
                is NetworkResult.Unauthorized -> parseErrorBody(error.errorBody) ?: "Unauthorized or session expired."
                is NetworkResult.NetworkError -> error.message ?: error.exception?.localizedMessage ?: "Unable to connect to the server."
                is NetworkResult.Success -> "Success"
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
                    else -> body
                }
            } catch (_: Exception) {
                body
            }
        }
    }

    /**
     * Registers a new Solar Prosumer with the central Web API.
     */
    fun registerProsumer(
        request: RegisterProsumerRequestDto,
        callback: ApiCallback<ProsumerProfileResponseDto>
    ) {
        val payload = JSONObject().apply {
            put("nic", request.nic)
            put("fullName", request.fullName)
            put("email", request.email)
            if (!request.phoneNumber.isNullOrBlank()) put("phoneNumber", request.phoneNumber)
            if (!request.address.isNullOrBlank()) put("address", request.address)
        }

        ApiClient.sendRequest(
            method = HttpMethod.POST,
            endpoint = "prosumers/register",
            requestBody = payload,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val dto = parseProfileJson(json)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, dto))
                    } catch (e: Exception) {
                        callback.onError(NetworkResult.NetworkError(e, "Failed to parse registration response"))
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    /**
     * Authenticates an active Solar Prosumer using their NIC.
     */
    fun loginProsumer(
        nic: String,
        callback: ApiCallback<ProsumerAuthResponseDto>
    ) {
        val payload = JSONObject().apply {
            put("nic", nic)
        }

        ApiClient.sendRequest(
            method = HttpMethod.POST,
            endpoint = "auth/prosumer-login",
            requestBody = payload,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val authDto = ProsumerAuthResponseDto(
                            token = json.getString("token"),
                            nic = json.getString("nic"),
                            fullName = json.getString("fullName"),
                            email = json.getString("email"),
                            accountStatus = json.optString("accountStatus", "Active")
                        )
                        callback.onSuccess(NetworkResult.Success(result.statusCode, authDto))
                    } catch (e: Exception) {
                        callback.onError(NetworkResult.NetworkError(e, "Failed to parse authentication response"))
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    /**
     * Fetches current authenticated Prosumer profile from the server.
     */
    fun getProfile(
        bearerToken: String?,
        callback: ApiCallback<ProsumerProfileResponseDto>
    ) {
        ApiClient.sendRequest(
            method = HttpMethod.GET,
            endpoint = "prosumers/me",
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val profile = parseProfileJson(json)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, profile))
                    } catch (e: Exception) {
                        callback.onError(NetworkResult.NetworkError(e, "Failed to parse profile response"))
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    /**
     * Updates current authenticated Prosumer profile fields.
     */
    fun updateProfile(
        bearerToken: String?,
        request: UpdateProsumerProfileRequestDto,
        callback: ApiCallback<ProsumerProfileResponseDto>
    ) {
        val payload = JSONObject().apply {
            put("fullName", request.fullName)
            put("email", request.email)
            if (!request.phoneNumber.isNullOrBlank()) put("phoneNumber", request.phoneNumber)
            if (!request.address.isNullOrBlank()) put("address", request.address)
        }

        ApiClient.sendRequest(
            method = HttpMethod.PUT,
            endpoint = "prosumers/me",
            requestBody = payload,
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val profile = parseProfileJson(json)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, profile))
                    } catch (e: Exception) {
                        callback.onError(NetworkResult.NetworkError(e, "Failed to parse updated profile response"))
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    /**
     * Sends a request to deactivate the current authenticated Prosumer account.
     */
    fun requestDeactivation(
        bearerToken: String?,
        callback: ApiCallback<ProsumerProfileResponseDto>
    ) {
        ApiClient.sendRequest(
            method = HttpMethod.POST,
            endpoint = "prosumers/me/deactivation-request",
            bearerToken = bearerToken,
            callback = object : ApiCallback<String> {
                override fun onSuccess(result: NetworkResult.Success<String>) {
                    try {
                        val json = JSONObject(result.responseBody)
                        val profile = parseProfileJson(json)
                        callback.onSuccess(NetworkResult.Success(result.statusCode, profile))
                    } catch (e: Exception) {
                        callback.onError(NetworkResult.NetworkError(e, "Failed to parse deactivation response"))
                    }
                }

                override fun onError(error: NetworkResult<Nothing>) {
                    callback.onError(error)
                }
            }
        )
    }

    private fun parseProfileJson(json: JSONObject): ProsumerProfileResponseDto {
        return ProsumerProfileResponseDto(
            nic = json.optString("nic"),
            fullName = json.optString("fullName"),
            email = json.optString("email"),
            phoneNumber = if (json.has("phoneNumber") && !json.isNull("phoneNumber")) json.optString("phoneNumber") else null,
            address = if (json.has("address") && !json.isNull("address")) json.optString("address") else null,
            accountStatus = json.optString("accountStatus", "Active"),
            createdAt = if (json.has("createdAt") && !json.isNull("createdAt")) json.optString("createdAt") else null,
            updatedAt = if (json.has("updatedAt") && !json.isNull("updatedAt")) json.optString("updatedAt") else null
        )
    }
}
