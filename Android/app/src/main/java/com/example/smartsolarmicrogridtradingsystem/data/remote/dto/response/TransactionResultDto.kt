package com.example.smartsolarmicrogridtradingsystem.data.remote.dto.response

data class TransactionResultDto(
    val success: Boolean,
    val message: String,
    val reservationId: String? = null,
    val prosumerNic: String? = null,
    val stationId: String? = null,
    val slotId: String? = null,
    val reservationDateTime: String? = null,
    val reservationType: String? = null,
    val status: String? = null
)
