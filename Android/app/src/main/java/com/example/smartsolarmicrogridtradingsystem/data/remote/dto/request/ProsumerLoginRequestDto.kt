package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.request

/**
 * DTO for authenticating a Solar Prosumer using their National Identity Card (NIC).
 */
data class ProsumerLoginRequestDto(
    val nic: String
)
