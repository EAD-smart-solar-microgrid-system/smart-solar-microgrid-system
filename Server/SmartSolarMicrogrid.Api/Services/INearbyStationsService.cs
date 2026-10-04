/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: INearbyStationsService.cs
 * Purpose: Define the Member 4 nearby-stations maps query contract.
 */

using SmartSolarMicrogrid.Api.DTOs.Member4;

namespace SmartSolarMicrogrid.Api.Services;

public interface INearbyStationsService
{
    Task<Member4DashboardServiceResult<IReadOnlyList<NearbyStationResponse>>> GetNearbyAsync(
        double latitude,
        double longitude,
        double radiusKm,
        CancellationToken cancellationToken = default);
}
