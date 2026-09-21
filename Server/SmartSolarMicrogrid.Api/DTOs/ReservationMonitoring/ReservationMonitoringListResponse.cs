/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationMonitoringListResponse.cs
 * Purpose: Carry a paginated, read-only reservation monitoring result set.
 */

namespace SmartSolarMicrogrid.Api.DTOs.ReservationMonitoring;

public sealed class ReservationMonitoringListResponse
{
    public IReadOnlyList<ReservationMonitoringItemResponse> Items { get; set; } =
        Array.Empty<ReservationMonitoringItemResponse>();

    public int TotalCount { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}
