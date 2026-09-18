/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: HealthService.cs
 * Purpose: Provide the non-business health status for the Web API.
 */

using SmartSolarMicrogrid.Api.DTOs;

namespace SmartSolarMicrogrid.Api.Services;

public sealed class HealthService : IHealthService
{
    public Task<HealthResponse> GetHealthAsync(CancellationToken cancellationToken = default)
    {
        // Return a simple service status without contacting MongoDB or applying business rules.
        var response = new HealthResponse("Healthy", "Smart Solar Microgrid API");

        return Task.FromResult(response);
    }
}
