/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: CancelReservationRequest.cs
 * Purpose: Receive optional client remarks when cancelling an existing energy reservation.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Reservations;

public sealed class CancelReservationRequest
{
    public string? Reason { get; set; }
}
