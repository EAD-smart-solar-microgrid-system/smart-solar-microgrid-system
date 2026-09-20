/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: QrTokenResponse.cs
 * Purpose: Expose secure server-generated QR credential details for mobile presentation and operator verification.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public sealed class QrTokenResponse
{
    public string ReservationId { get; set; } = string.Empty;

    public string QrToken { get; set; } = string.Empty;

    public DateTime IssuedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public string StationId { get; set; } = string.Empty;

    public string ProsumerNic { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;
}
