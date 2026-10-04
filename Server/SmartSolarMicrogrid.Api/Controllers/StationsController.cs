/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationsController.cs
 * Purpose: Expose the public REST endpoints for microgrid node management using HubId.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Stations;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/stations")]
public sealed class StationsController : ControllerBase
{
    private readonly IStationService _stationService;

    public StationsController(IStationService stationService)
    {
        // Store the service that owns station validation and lifecycle rules.
        _stationService = stationService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<StationResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        // Request all stations from the service and return an empty list when none exist.
        var result = await _stationService.GetAllAsync(cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value!);
    }

    [HttpGet("{hubId}")]
    [Authorize]
    public async Task<ActionResult<StationResponse>> GetByHubId(
        string hubId,
        CancellationToken cancellationToken)
    {
        // Request an individual station identified by its public HubId.
        var result = await _stationService.GetByHubIdAsync(hubId, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value!);
    }

    [HttpPost]
    [Authorize(Roles = "Backoffice")]
    public async Task<ActionResult<StationResponse>> Create(
        [FromBody] CreateStationRequest? request,
        CancellationToken cancellationToken)
    {
        // Reject an absent body before passing client data to the service.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _stationService.CreateAsync(request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpPut("{hubId}")]
    [Authorize(Roles = "Backoffice")]
    public async Task<ActionResult<StationResponse>> UpdateDetails(
        string hubId,
        [FromBody] UpdateStationRequest? request,
        CancellationToken cancellationToken)
    {
        // Reject an absent body before asking the service to update station details.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _stationService.UpdateDetailsAsync(hubId, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    [HttpPatch("{hubId}/status")]
    [Authorize(Roles = "Backoffice")]
    public async Task<ActionResult<StationResponse>> UpdateStatus(
        string hubId,
        [FromBody] UpdateStationStatusRequest? request,
        CancellationToken cancellationToken)
    {
        // Pass status changes to the service, which performs the reservation safety check.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _stationService.ChangeStatusAsync(hubId, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value);
    }

    private ActionResult CreateErrorResult<T>(StationServiceResult<T> result)
    {
        // Translate expected service outcomes into simple public HTTP error responses.
        var message = result.ErrorMessage ?? "The station request could not be completed.";

        switch (result.ErrorType)
        {
            case StationServiceErrorType.Validation:
                return BadRequest(new ErrorResponse(message));
            case StationServiceErrorType.NotFound:
                return NotFound(new ErrorResponse(message));
            case StationServiceErrorType.Conflict:
                return Conflict(new ErrorResponse(message));
            case StationServiceErrorType.DependencyUnavailable:
                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    new ErrorResponse(message));
            default:
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new ErrorResponse("The station request could not be completed."));
        }
    }
}
