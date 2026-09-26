/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationMonitoringController.cs
 * Purpose: Expose Member 4 read-only reservation monitoring endpoints without altering Member 2 booking workflows.
 */

using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.ReservationMonitoring;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/member4/reservation-monitoring")]
public sealed class ReservationMonitoringController : ControllerBase
{
    private readonly IReservationMonitoringService _monitoringService;

    public ReservationMonitoringController(IReservationMonitoringService monitoringService)
    {
        // Store the Member 4 monitoring service that owns filter validation and read-only queries.
        _monitoringService = monitoringService;
    }

    [HttpGet]
    public async Task<ActionResult<ReservationMonitoringListResponse>> Search(
        [FromQuery] ReservationMonitoringQuery query,
        CancellationToken cancellationToken)
    {
        // Return a filtered, paginated reservation list for Member 4 monitoring clients.
        var result = await _monitoringService.SearchAsync(query, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ReservationMonitoringItemResponse>> GetById(
        string id,
        CancellationToken cancellationToken)
    {
        // Return one reservation monitoring record by identifier using a read-only lookup.
        var result = await _monitoringService.GetByIdAsync(id, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    private ActionResult CreateErrorResult<T>(ReservationMonitoringServiceResult<T> result)
    {
        // Map expected monitoring service outcomes into standard HTTP responses.
        var message = result.ErrorMessage ?? "The reservation monitoring request could not be completed.";

        return result.ErrorType switch
        {
            ReservationMonitoringServiceErrorType.Validation => BadRequest(new ErrorResponse(message)),
            ReservationMonitoringServiceErrorType.NotFound => NotFound(new ErrorResponse(message)),
            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                new ErrorResponse("The reservation monitoring request could not be completed."))
        };
    }
}
