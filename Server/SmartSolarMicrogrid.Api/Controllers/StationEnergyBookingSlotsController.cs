/*
 * SE4040 - Enterprise Application Development
 * Smart Solar Microgrid Trading System
 * File: StationEnergyBookingSlotsController.cs
 * Purpose: Expose station-scoped REST endpoints for energy booking slot management.
 */

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartSolarMicrogrid.Api.DTOs;
using SmartSolarMicrogrid.Api.DTOs.Slots;
using SmartSolarMicrogrid.Api.Services;

namespace SmartSolarMicrogrid.Api.Controllers;

[ApiController]
[Route("api/stations/{hubId}/slots")]
public sealed class StationEnergyBookingSlotsController : ControllerBase
{
    private readonly IEnergyBookingSlotService _slotService;

    public StationEnergyBookingSlotsController(IEnergyBookingSlotService slotService)
    {
        // Store the service that owns slot validation and persistence rules.
        _slotService = slotService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<IReadOnlyList<EnergyBookingSlotResponse>>> GetByStationId(
        string hubId,
        CancellationToken cancellationToken)
    {
        // Request all slots for one station and return an empty list when none exist.
        var result = await _slotService.GetByStationIdAsync(hubId, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return Ok(result.Value!);
    }

    [HttpPost]
    [Authorize(Roles = "GridOperator,Backoffice")]
    public async Task<ActionResult<EnergyBookingSlotResponse>> Create(
        string hubId,
        [FromBody] CreateEnergyBookingSlotRequest? request,
        CancellationToken cancellationToken)
    {
        // Reject an absent body before passing client data to the service.
        if (request is null)
        {
            return BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _slotService.CreateAsync(hubId, request, cancellationToken);

        if (!result.Succeeded)
        {
            return CreateErrorResult(result);
        }

        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    private ActionResult CreateErrorResult<T>(StationServiceResult<T> result)
    {
        // Translate expected service outcomes into simple public HTTP error responses.
        var message = result.ErrorMessage ?? "The energy booking slot request could not be completed.";

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
                    new ErrorResponse("The energy booking slot request could not be completed."));
        }
    }
}
