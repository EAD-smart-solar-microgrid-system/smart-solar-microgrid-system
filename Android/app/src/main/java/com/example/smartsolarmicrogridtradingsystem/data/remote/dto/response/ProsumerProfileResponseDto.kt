package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

/**
 * DTO representing a Solar Prosumer profile from the central Web API.
 */
data class ProsumerProfileResponseDto(
    val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String? = null,
    val address: String? = null,
    val accountStatus: String,
    val createdAt: String? = null,
    val updatedAt: String? = null
)
