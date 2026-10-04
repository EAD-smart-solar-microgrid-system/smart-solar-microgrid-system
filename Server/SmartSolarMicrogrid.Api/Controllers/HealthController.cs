/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: HealthController.cs
 * Purpose: Expose the API health check over HTTP.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class HealthController : ControllerBase
{
    private readonly IHealthService _healthService;

    public HealthController(IHealthService healthService)
    {
        // Store the service used to prepare the health response.
        _healthService = healthService;
    }

    [HttpGet]
    public async Task<ActionResult<HealthResponse>> Get(CancellationToken cancellationToken)
    {
        // Ask the service for the current API health response and return HTTP 200.
        var healthResponse = await _healthService.GetHealthAsync(cancellationToken);

        return Ok(healthResponse);
    }
}
