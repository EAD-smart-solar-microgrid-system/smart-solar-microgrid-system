/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IActiveReservationChecker.cs
 * Purpose: Define the narrow reservation capability required before deactivation.
 */

namespace SmartSolarMicrogrid.Api.Services;

public interface IActiveReservationChecker
{
    Task<bool?> HasActiveReservationsAsync(
        string stationId,
        CancellationToken cancellationToken = default);
}
