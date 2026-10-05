/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: ReservationMonitoringController.cs
 * Purpose: Expose Member 4 read-only reservation monitoring endpoints without altering Member 2 booking workflows.
 */

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.ReservationMonitoring;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/member4/reservation-monitoring")]
[Authorize(Roles = "GridOperator,Backoffice,Prosumer")]
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
        // Restrict Prosumer callers to their own reservations before running the search.
        query ??= new ReservationMonitoringQuery();
        var prosumerScopeError = ApplyProsumerScope(query);
        if (prosumerScopeError is not null)
        {
            return prosumerScopeError;
        }

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

        var prosumerAccessError = DenyProsumerAccessToOtherReservation(result.Value!.ProsumerId);
        if (prosumerAccessError is not null)
        {
            return prosumerAccessError;
        }

        return Ok(result.Value);
    }

    private ActionResult? ApplyProsumerScope(ReservationMonitoringQuery query)
    {
        // Force Prosumer search requests to the caller's NIC and reject cross-account filters.
        if (!User.IsInRole("Prosumer"))
        {
            return null;
        }

        var callerNic = GetCallerNic();
        if (string.IsNullOrEmpty(callerNic))
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new ErrorResponse("Access denied to another prosumer's reservations."));
        }

        if (!string.IsNullOrWhiteSpace(query.ProsumerId) &&
            !string.Equals(query.ProsumerId.Trim(), callerNic, StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new ErrorResponse("Access denied to another prosumer's reservations."));
        }

        query.ProsumerId = callerNic;
        return null;
    }

    private ActionResult? DenyProsumerAccessToOtherReservation(string? prosumerId)
    {
        // Block Prosumer access when the reservation belongs to a different account.
        if (!User.IsInRole("Prosumer"))
        {
            return null;
        }

        var callerNic = GetCallerNic();
        if (string.IsNullOrEmpty(callerNic) ||
            !string.Equals(callerNic, prosumerId?.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(
                StatusCodes.Status403Forbidden,
                new ErrorResponse("Access denied to another prosumer's reservations."));
        }

        return null;
    }

    private string? GetCallerNic()
    {
        // Resolve the authenticated Prosumer NIC from standard or custom identity claims.
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("nic")?.Value;
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
