/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationResponse.cs
 * Purpose: Expose normalized energy slot reservation details to API clients.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public sealed class ReservationResponse
{
    public string Id { get; set; } = string.Empty;

    public string ProsumerNic { get; set; } = string.Empty;

    public string StationId { get; set; } = string.Empty;

    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDateTime { get; set; }

    public string ReservationType { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public string? CancellationReason { get; set; }

    public DateTime? CancelledAt { get; set; }

    public string? QrToken { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
