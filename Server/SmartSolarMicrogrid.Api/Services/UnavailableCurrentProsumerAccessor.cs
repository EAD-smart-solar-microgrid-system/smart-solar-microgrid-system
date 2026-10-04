/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: UnavailableCurrentProsumerAccessor.cs
 * Purpose: Fail safely until Member 1 supplies the authenticated Prosumer identity.
 */

namespace SmartSolarMicrogrid.Api.Services;

public sealed class UnavailableCurrentProsumerAccessor : ICurrentProsumerAccessor
{
    public Task<string?> GetCurrentProsumerNicAsync(
        CancellationToken cancellationToken = default)
    {
        // Return no identity rather than inventing or trusting a client-provided NIC.
        return Task.FromResult<string?>(null);
    }
}
