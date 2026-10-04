/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: CreateReservationRequest.cs
 * Purpose: Receive client parameters for creating a new energy slot reservation.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public sealed class CreateReservationRequest
{
    public string ProsumerNic { get; set; } = string.Empty;

    public string StationId { get; set; } = string.Empty;

    public string SlotId { get; set; } = string.Empty;

    public DateTime ReservationDateTime { get; set; }

    public string? ReservationType { get; set; }
}
