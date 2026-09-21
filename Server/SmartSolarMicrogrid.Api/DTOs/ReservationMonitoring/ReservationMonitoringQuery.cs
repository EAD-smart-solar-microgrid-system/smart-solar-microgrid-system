/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationMonitoringQuery.cs
 * Purpose: Capture optional Member 4 reservation monitoring filters and pagination inputs.
 */

namespace SmartSolarMicrogrid.Api.DTOs.ReservationMonitoring;

public sealed class ReservationMonitoringQuery
{
    public string? StationId { get; set; }

    public string? ProsumerId { get; set; }

    public string? Status { get; set; }

    public DateTime? StartDate { get; set; }

    public DateTime? EndDate { get; set; }

    public string? Search { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 20;
}
