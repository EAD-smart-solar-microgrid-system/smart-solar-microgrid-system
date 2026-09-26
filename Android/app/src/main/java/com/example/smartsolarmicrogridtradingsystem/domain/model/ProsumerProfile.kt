package com.example.smartsolarmicrogridtradingsystem.domain.model

/** Server-owned Prosumer profile data cached locally for offline display. */
data class ProsumerProfile(
    val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String?,
    val address: String?,
    val accountStatus: String,
    val updatedAt: String
)
