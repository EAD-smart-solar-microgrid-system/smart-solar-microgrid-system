/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ProsumerDashboardResponse.cs
 * Purpose: Carry Member 4 prosumer dashboard summary metrics and recent bookings.
 */

namespace SmartSolarMicrogrid.Api.DTOs.Member4;

public sealed class ProsumerDashboardResponse
{
    public string ProsumerId { get; set; } = string.Empty;

    public int PendingReservationCount { get; set; }

    public int ApprovedFutureReservationCount { get; set; }

    public IReadOnlyList<DashboardBookingItemResponse> RecentBookings { get; set; } =
        Array.Empty<DashboardBookingItemResponse>();
}
