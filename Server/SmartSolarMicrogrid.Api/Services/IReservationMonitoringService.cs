/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IReservationMonitoringService.cs
 * Purpose: Define the Member 4 read-only reservation monitoring service contract.
 */

using SmartSolarMicrogrid.Api.DTOs.ReservationMonitoring;

namespace SmartSolarMicrogrid.Api.Services;

public interface IReservationMonitoringService
{
    Task<ReservationMonitoringServiceResult<ReservationMonitoringListResponse>> SearchAsync(
        ReservationMonitoringQuery query,
        CancellationToken cancellationToken = default);

    Task<ReservationMonitoringServiceResult<ReservationMonitoringItemResponse>> GetByIdAsync(
        string id,
        CancellationToken cancellationToken = default);
}
