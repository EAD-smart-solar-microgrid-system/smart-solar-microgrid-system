package com.example.smartsolarmicrogridtradingsystem.data.remote.dto

/** Request fields accepted by POST /api/prosumers/register. */
data class RegisterProsumerRequest(
    val nic: String,
    val fullName: String,
    val email: String,
    val phoneNumber: String?,
    val address: String?
)

/** Request fields accepted by PUT /api/prosumers/me. NIC and status are server-owned. */
data class UpdateProsumerRequest(
    val fullName: String,
    val email: String,
    val phoneNumber: String?,
    val address: String?
)
