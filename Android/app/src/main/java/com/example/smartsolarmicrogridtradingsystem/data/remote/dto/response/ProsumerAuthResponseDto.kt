package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

/**
 * DTO returned upon successful Prosumer authentication with signed JWT token.
 */
data class ProsumerAuthResponseDto(
    val token: String,
    val nic: String,
    val fullName: String,
    val email: String,
    val accountStatus: String
)
