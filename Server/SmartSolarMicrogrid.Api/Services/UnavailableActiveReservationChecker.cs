/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UnavailableActiveReservationChecker.cs
 * Purpose: Fail closed until Member 2 supplies the real reservation integration.
 */

namespace SmartSolarMicrogrid.Api.Services;

public sealed class UnavailableActiveReservationChecker : IActiveReservationChecker
{
    public Task<bool?> HasActiveReservationsAsync(
        string stationId,
        CancellationToken cancellationToken = default)
    {
        // Return null to signal that reservation verification is unavailable, never that it is clear.
        return Task.FromResult<bool?>(null);
    }
}
