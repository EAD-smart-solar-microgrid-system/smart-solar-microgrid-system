/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ICurrentProsumerAccessor.cs
 * Purpose: Define the future Member 1 integration point for the authenticated Prosumer NIC.
 */

namespace SmartSolarMicrogrid.Api.Services;

public interface ICurrentProsumerAccessor
{
    Task<string?> GetCurrentProsumerNicAsync(CancellationToken cancellationToken = default);
}
