/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UpdateReservationRequest.cs
 * Purpose: Receive client parameters for modifying a scheduled energy slot reservation.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public sealed class UpdateReservationRequest
{
    public DateTime ReservationDateTime { get; set; }

    public string? SlotId { get; set; }

    public string? ReservationType { get; set; }
}
