/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: DashboardBookingItemResponse.cs
 * Purpose: Expose a compact recent-booking row for the Member 4 prosumer dashboard.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Member4;

public sealed class DashboardBookingItemResponse
{
    public string Id { get; set; } = string.Empty;

    public string BookingId { get; set; } = string.Empty;

    public string StationId { get; set; } = string.Empty;

    public string HubId { get; set; } = string.Empty;

    public string StationName { get; set; } = string.Empty;

    public string SlotId { get; set; } = string.Empty;

    public string ProsumerId { get; set; } = string.Empty;

    public string ProsumerName { get; set; } = string.Empty;

    public DateTime ReservationDateTime { get; set; }

    public string Status { get; set; } = string.Empty;

    public string ReservationType { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}

