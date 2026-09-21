/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: Member4NearbyStationsController.cs
 * Purpose: Expose the Member 4 nearby-stations maps endpoint.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Member4;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/member4/stations")]
public sealed class Member4NearbyStationsController : ControllerBase
{
    private readonly INearbyStationsService _nearbyStationsService;

    public Member4NearbyStationsController(INearbyStationsService nearbyStationsService)
    {
        // Store the nearby-stations service that owns coordinate validation and distance filtering.
        _nearbyStationsService = nearbyStationsService;
    }

    [HttpGet("nearby")]
    public async Task<ActionResult<IReadOnlyList<NearbyStationResponse>>> GetNearby(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double radiusKm,
        CancellationToken cancellationToken)
    {
        // Return stations within the requested radius, ordered by ascending distance.
        var result = await _nearbyStationsService.GetNearbyAsync(
            latitude,
            longitude,
            radiusKm,
            cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    private ActionResult CreateErrorResult<T>(Member4DashboardServiceResult<T> result)
    {
        // Map expected nearby-stations outcomes into standard HTTP responses.
        var message = result.ErrorMessage ?? "The nearby stations request could not be completed.";

        return result.ErrorType switch
        {
            Member4DashboardServiceErrorType.Validation => BadRequest(new ErrorResponse(message)),
            Member4DashboardServiceErrorType.NotFound => NotFound(new ErrorResponse(message)),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ErrorResponse("The nearby stations request could not be completed."))
        };
    }
}
