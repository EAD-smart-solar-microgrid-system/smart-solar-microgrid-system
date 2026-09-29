package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.request

/**
 * DTO for registering a new Solar Prosumer with the central Web API.
 */
data class RegisterProsumerRequestDto(
    val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String? = null,
    val address: String? = null
)
