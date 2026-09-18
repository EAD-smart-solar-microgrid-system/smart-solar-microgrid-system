/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: IHealthService.cs
 * Purpose: Define the service contract for the API health check.
 */

using SmartSolarMicrogrid.Api.DTOs;

namespace SmartSolarMicrogrid.Api.Services;

public interface IHealthService
{
    Task<HealthResponse> GetHealthAsync(CancellationToken cancellationToken = default);
}
