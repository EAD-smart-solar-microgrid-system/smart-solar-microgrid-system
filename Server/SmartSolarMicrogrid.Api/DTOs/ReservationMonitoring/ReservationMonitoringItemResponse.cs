/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationMonitoringItemResponse.cs
 * Purpose: Expose a read-only reservation summary for Member 4 monitoring clients.
 */

namespace SmartSolarMicrogrid.Api.DTOs.ReservationMonitoring;

public sealed class ReservationMonitoringItemResponse
{
    public string Id { get; set; } = string.Empty;

    public string StationId { get; set; } = string.Empty;

    public string SlotId { get; set; } = string.Empty;

    public string ProsumerId { get; set; } = string.Empty;

    public DateTime ReservationDateTime { get; set; }

    public string Status { get; set; } = string.Empty;

    public string ReservationType { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}
