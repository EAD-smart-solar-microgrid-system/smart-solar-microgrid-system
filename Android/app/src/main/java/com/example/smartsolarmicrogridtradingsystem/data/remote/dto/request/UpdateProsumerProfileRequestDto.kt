package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.request

/**
 * DTO for updating a Solar Prosumer's editable profile fields.
 */
data class UpdateProsumerProfileRequestDto(
    val fullName: String,
    val email: String,
    val phoneNumber: String? = null,
    val address: String? = null
)
