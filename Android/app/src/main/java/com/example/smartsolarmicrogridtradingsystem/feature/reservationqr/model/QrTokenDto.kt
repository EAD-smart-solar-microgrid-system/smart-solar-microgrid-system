package com.example.smartsolarmicrogridtradingsystem.feature.reservationqr.model

import org.json.JSONObject

/**
 * Server-generated cryptographic QR token credentials returned by POST /api/reservations/{id}/qr-token.
 * Used for mobile QR rendering and operator verification at the microgrid station.
 *
 * @property reservationId Identifier of the associated reservation.
 * @property qrToken Opaque cryptographic token to be encoded in the QR code bitmap.
 * @property issuedAt Timestamp when the token was generated in ISO-8601 format.
 * @property expiresAt Expiry timestamp of the token (typically ReservationDateTime + 4 hours).
 * @property stationId Identifier of the authorized station.
 * @property prosumerNic National Identity Card number of the authorized prosumer.
 * @property status Reservation status when the token was issued (e.g. "Approved").
 */
data class QrTokenDto(
    val reservationId: String,
    val qrToken: String,
    val issuedAt: String,
    val expiresAt: String,
    val stationId: String,
    val prosumerNic: String,
    val status: String
) {
    companion object {
        /**
         * Parses a [JSONObject] response into a [QrTokenDto].
         * Safely inspects both camelCase and PascalCase key variants.
         */
        fun fromJson(json: JSONObject): QrTokenDto {
            return QrTokenDto(
                reservationId = json.optString("reservationId", json.optString("ReservationId", "")),
                qrToken = json.optString("qrToken", json.optString("QrToken", "")),
                issuedAt = json.optString("issuedAt", json.optString("IssuedAt", "")),
                expiresAt = json.optString("expiresAt", json.optString("ExpiresAt", "")),
                stationId = json.optString("stationId", json.optString("StationId", "")),
                prosumerNic = json.optString("prosumerNic", json.optString("ProsumerNic", "")),
                status = json.optString("status", json.optString("Status", ""))
            )
        }
    }
}
