package com.example.smartsolarmicrogridtradingsystem.data.repository

import android.content.Context
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiCallback
import com.example.smartsolarmicrogridtradingsystem.core.network.ApiClient
import com.example.smartsolarmicrogridtradingsystem.core.network.HttpMethod
import com.example.smartsolarmicrogridtradingsystem.core.network.NetworkResult
import com.example.smartsolarmicrogridtradingsystem.core.session.SessionManager
import com.example.smartsolarmicrogridtradingsystem.data.local.ProsumerLocalDataSource
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.RegisterProsumerRequest
import com.example.smartsolarmicrogridtradingsystem.data.remote.dto.UpdateProsumerRequest
import com.example.smartsolarmicrogridtradingsystem.domain.model.ProsumerProfile
import org.json.JSONObject

sealed class ProsumerResult {

    data class Success(
        val profile: ProsumerProfile
    ) : ProsumerResult()

    data class Failure(
        val message: String,
        val statusCode: Int? = null
    ) : ProsumerResult()
}

/**
 * API boundary and local SQLite cache coordinator
 * for Member 3 Prosumer Account Control.
 */
class ProsumerRepository(context: Context) {

    private val localDataSource = ProsumerLocalDataSource(context)
    private val sessionManager = SessionManager(context)

    /**
     * Registers a new Prosumer through the central Web API.
     */
    fun register(
        request: RegisterProsumerRequest,
        callback: (ProsumerResult) -> Unit
    ) {
        ApiClient.sendRequest(
            method = HttpMethod.POST,
            endpoint = "prosumers/register",
            requestBody = request.toJson(),
            callback = profileCallback(callback)
        )
    }

    /**
     * Retrieves the currently authenticated Prosumer profile.
     */
    fun getCurrent(
        callback: (ProsumerResult) -> Unit
    ) {
        ApiClient.sendRequest(
            method = HttpMethod.GET,
            endpoint = "prosumers/me",
            bearerToken = sessionManager.getToken(),
            callback = profileCallback(callback)
        )
    }

    /**
     * Updates editable fields of the currently authenticated Prosumer.
     */
    fun updateCurrent(
        request: UpdateProsumerRequest,
        callback: (ProsumerResult) -> Unit
    ) {
        ApiClient.sendRequest(
            method = HttpMethod.PUT,
            endpoint = "prosumers/me",
            requestBody = request.toJson(),
            bearerToken = sessionManager.getToken(),
            callback = profileCallback(callback)
        )
    }

    /**
     * Sends an account deactivation request for the current Prosumer.
     */
    fun requestDeactivation(
        callback: (ProsumerResult) -> Unit
    ) {
        ApiClient.sendRequest(
            method = HttpMethod.POST,
            endpoint = "prosumers/me/deactivation-request",
            bearerToken = sessionManager.getToken(),
            callback = profileCallback(callback)
        )
    }

    /**
     * Retrieves the locally cached Prosumer profile from SQLite.
     */
    fun getCached(
        callback: (ProsumerProfile?) -> Unit
    ) = localDataSource.get(callback)

    /**
     * Creates a reusable API callback for Prosumer profile responses.
     *
     * Successful server responses are parsed and cached in SQLite
     * before being returned to the UI.
     */
    private fun profileCallback(
        callback: (ProsumerResult) -> Unit
    ) = object : ApiCallback<String> {

        override fun onSuccess(result: NetworkResult.Success<String>) {

            val profile = try {
                parseProfile(JSONObject(result.responseBody))
            } catch (_: Exception) {
                null
            }

            if (profile == null) {
                callback(
                    ProsumerResult.Failure(
                        "The server returned an invalid Prosumer profile."
                    )
                )
                return
            }

            localDataSource.save(profile) { saved ->

                if (saved) {
                    callback(
                        ProsumerResult.Success(profile)
                    )
                } else {
                    callback(
                        ProsumerResult.Failure(
                            "The profile was received, but could not be cached locally."
                        )
                    )
                }
            }
        }

        override fun onError(error: NetworkResult<Nothing>) {

            val failure = when (error) {

                is NetworkResult.Unauthorized -> {
                    ProsumerResult.Failure(
                        message = "Please sign in to access your Prosumer profile.",
                        statusCode = error.statusCode
                    )
                }

                is NetworkResult.HttpError -> {
                    ProsumerResult.Failure(
                        message = safeServerMessage(
                            error.errorBody,
                            error.statusCode
                        ),
                        statusCode = error.statusCode
                    )
                }

                is NetworkResult.NetworkError -> {
                    ProsumerResult.Failure(
                        message = "Unable to reach the server. Check your connection and try again."
                    )
                }

                is NetworkResult.UnexpectedError -> {
                    ProsumerResult.Failure(
                        message = "The client could not process the server response."
                    )
                }

                is NetworkResult.Success<*> -> {
                    /*
                     * Defensive branch required because NetworkResult is sealed
                     * and Kotlin requires the when expression to be exhaustive.
                     * A success result should normally be delivered to onSuccess().
                     */
                    ProsumerResult.Failure(
                        message = "An unexpected network response was received."
                    )
                }
            }

            callback(failure)
        }
    }

    /**
     * Converts the API JSON response into a ProsumerProfile.
     */
    private fun parseProfile(
        json: JSONObject
    ): ProsumerProfile? {

        return ProsumerProfile(
            nic = json.optString("nic"),
            fullName = json.optString("fullName"),
            email = json.optString("email"),
            phoneNumber = json.optionalString("phoneNumber"),
            address = json.optionalString("address"),
            accountStatus = json.optString("accountStatus"),
            updatedAt = json.optString("updatedAt")
        ).takeIf {
            it.nic.isNotBlank() &&
                    it.fullName.isNotBlank() &&
                    it.email.isNotBlank()
        }
    }

    /**
     * Produces a safe user-facing message for HTTP failures.
     */
    private fun safeServerMessage(
        body: String?,
        statusCode: Int
    ): String {

        val message = try {
            JSONObject(body.orEmpty()).optString("message")
        } catch (_: Exception) {
            ""
        }

        return when {
            message.isNotBlank() -> message

            statusCode == 409 ->
                "This NIC is already registered."

            statusCode == 400 ->
                "Please check the information and try again."

            else ->
                "The server could not complete the Prosumer request."
        }
    }

    /**
     * Reads an optional non-empty string from a JSON object.
     */
    private fun JSONObject.optionalString(
        key: String
    ): String? {

        return if (isNull(key)) {
            null
        } else {
            optString(key)
                .takeIf { it.isNotBlank() }
        }
    }

    /**
     * Converts the Prosumer registration request into API JSON.
     */
    private fun RegisterProsumerRequest.toJson(): JSONObject {

        return JSONObject().apply {
            put("nic", nic)
            put("fullName", fullName)
            put("email", email)
            put("phoneNumber", phoneNumber ?: JSONObject.NULL)
            put("address", address ?: JSONObject.NULL)
        }
    }

    /**
     * Converts the Prosumer profile-update request into API JSON.
     */
    private fun UpdateProsumerRequest.toJson(): JSONObject {

        return JSONObject().apply {
            put("fullName", fullName)
            put("email", email)
            put("phoneNumber", phoneNumber ?: JSONObject.NULL)
            put("address", address ?: JSONObject.NULL)
        }
    }
}
